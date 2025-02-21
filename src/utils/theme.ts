import JSZip from 'jszip'
import { write, dir, file } from 'opfs-tools'
import { useSettingsStore } from '@/stores'
import { storeToRefs } from 'pinia'
// import { useStyleTag } from '@vueuse/core'
import { Tag } from '@lezer/highlight'
import { cm6LightTheme, cm6DarkTheme } from './cm6Theme'
import { watch } from 'vue'

declare interface ThemeIndex {
  name: string
  version: string
  author: string
  authorUrl?: string
  description?: string
  url: string
  mainCss: string
  highlightTheme?: string
  highlightDarkTheme?: string
  codeMirrorTheme?: string
  codeMirrorDarkTheme?: string
  otherResources?: string[]
}

// const themeStyleTag = useStyleTag('')

const checkThemeName = async (themeName: string) => {
  if (
    (await dir(`/themes/${themeName}`).exists()) &&
    (await file(`/themes/${themeName}/theme.json`).exists())
  ) {
    return true
  }
  return false
}

const getCurrentThemeName = async (check: boolean = true) => {
  const settingsStore = useSettingsStore()
  const { themeName } = storeToRefs(settingsStore)

  if (!check) {
    return themeName.value
  }

  if (themeName.value === 'default') {
    return 'default'
  }

  if (await checkThemeName(themeName.value)) {
    return themeName.value
  } else {
    themeName.value = 'default'
    return 'default'
  }
}

const getResPath = async (path: string) => {
  if (path.startsWith('/')) {
    return `/themes/${await getCurrentThemeName(false)}${path}`
  } else {
    return `/themes/${await getCurrentThemeName(false)}/${path}`
  }
}

const getThemeIndex = async (): Promise<ThemeIndex | null> => {
  // 读取加载全局主题CSS文件
  const themeName = await getCurrentThemeName()

  if (themeName === 'default') {
    return null
  }

  // 读取主题文件
  const themeIndexFile = await file(`/themes/${themeName}/theme.json`).text()
  const themeIndex: ThemeIndex = JSON.parse(themeIndexFile)
  return themeIndex
}

const createModelBlobUrl = (content: string) => {
  const blob = new Blob([content], { type: 'application/javascript' })
  return URL.createObjectURL(blob)
}

const createThemeBlobUrl = async (content: string) => {
  const blob = new Blob([content], { type: 'text/css' })
  return URL.createObjectURL(blob)
}

export const uploadTheme = async (themeZipFile: File) => {
  // 从本地上传压缩的主题文件
  const zip = new JSZip()
  try {
    const themeFiles = await zip.loadAsync(themeZipFile)
    // 处理 zipContent
    const themeIndexFile = themeFiles.file('theme.json')
    if (!themeIndexFile) {
      throw new Error('主题文件缺失')
    }

    const themeIndex: ThemeIndex = JSON.parse(await themeIndexFile.async('text'))
    // 检查是否有必要字段
    if (
      !themeIndex.name ||
      !themeIndex.version ||
      !themeIndex.author ||
      !themeIndex.url ||
      !themeIndex.mainCss
    ) {
      throw new Error('主题文件缺失必要字段')
    }

    // 检查指向的资源文件是否都存在
    // 判断mainCss指向的文件是否存在
    if (!themeFiles.file(themeIndex.mainCss)) {
      throw new Error('主样文件损坏')
    }

    if (themeIndex.codeMirrorTheme) {
      if (!themeFiles.file(themeIndex.codeMirrorTheme)) {
        throw new Error('主样文件损坏')
      }
    }

    if (themeIndex.codeMirrorDarkTheme) {
      if (!themeFiles.file(themeIndex.codeMirrorDarkTheme)) {
        throw new Error('主样文件损坏')
      }
    }

    if (themeIndex.otherResources) {
      for (const resource of themeIndex.otherResources) {
        if (!themeFiles.file(resource)) {
          throw new Error('主样文件损坏')
        }
      }
    }

    // 获取作者名和主题名
    const themeName = themeIndex.name + '-' + themeIndex.author

    // 检查是否有重名主题
    const themeDir = dir(`/themes/${themeName}`)
    if (await themeDir.exists()) {
      throw new Error('主题已存在')
    }

    // 创建主题目录
    await themeDir.create()
    // 写入主题文件
    for (const fileName in themeFiles.files) {
      const file = themeFiles.files[fileName]
      if (!file.dir) {
        const content = await file.async('arraybuffer')
        console.log('fileName', fileName, content)
        await write(`/themes/${themeName}/${fileName}`, new Uint8Array(content))
      }
    }

    // 写入主题索引文件
    await write(`/themes/${themeName}/theme.json`, JSON.stringify(themeIndex))

    return true
  } catch (error) {
    console.error('加载压缩文件时出错:', error)
    return false
  }
}

export const deleteTheme = async (themeName: string) => {
  // 删除主题
  const themeDir = dir(`/themes/${themeName}`)
  if (await themeDir.exists()) {
    await themeDir.remove()

    await getCurrentThemeName()
    return true
  }

  return false
}

export const listThemes = async (): Promise<string[]> => {
  // 列出所有主题名字
  const result = ['default']
  const themes = await dir('/themes').children()
  for (const theme of themes) {
    if (theme.kind === 'dir') {
      result.push(theme.name)
    }
  }
  return result
}

export const watchGlobalTheme = async () => {
  const settingsStore = useSettingsStore()
  const { themeName } = storeToRefs(settingsStore)

  watch(
    themeName,
    async () => {
      await loadGlobalThemes()
    },
    { immediate: true },
  )
}

let themeCssLink = document.getElementById('global-theme-css') as HTMLLinkElement

export const loadGlobalThemes = async () => {
  // 读取加载全局主题CSS文件
  const themeIndex: ThemeIndex | null = await getThemeIndex()

  let url
  if (themeIndex) {
    // 读取css文件内容
    const mainCss = await file(await getResPath(themeIndex.mainCss)).text()
    url = await createThemeBlobUrl(mainCss)
    // 加载主题CSS
    // themeStyleTag.css.value = mainCss
  } else {
    // themeStyleTag.css.value = ''
    url = await createModelBlobUrl('')
  }

  if (!themeCssLink) {
    // 如果不存在，则创建一个新的 link 标签
    themeCssLink = document.createElement('link')
    themeCssLink.id = 'highlight-theme-css'
    themeCssLink.rel = 'stylesheet'
    document.body.appendChild(themeCssLink)
  }

  themeCssLink.href = url
}

export const getHighlightTheme = async (dark: boolean = false): Promise<string> => {
  // 读取hightlight主题名
  const themeIndex: ThemeIndex | null = await getThemeIndex()

  let highlightName = ''

  const defaultLight = 'github'
  const defaultDark = 'github-dark'

  if (dark && themeIndex && themeIndex.highlightDarkTheme) {
    highlightName = themeIndex.highlightDarkTheme
  } else if (!dark && themeIndex && themeIndex.highlightTheme) {
    highlightName = themeIndex.highlightTheme
  } else {
    highlightName = dark ? defaultDark : defaultLight
  }

  return highlightName
}

type StyleSpec = {
  [propOrSelector: string]: string | number | StyleSpec | null
}

interface TagStyle {
  tag: Tag | readonly Tag[]
  class?: string
  [styleProperty: string]: unknown
}

interface CodemirrorThemeType {
  theme?: { [selector: string]: StyleSpec }
  dark?: boolean
  highlightStyleGender?: (tag: unknown) => TagStyle[]
}

export const getCodemirrorTheme = async (dark: boolean = false): Promise<CodemirrorThemeType> => {
  // 导出codemirror主题模块
  const themeIndex: ThemeIndex | null = await getThemeIndex()

  const defaultLight = cm6LightTheme
  const defaultDark = cm6DarkTheme

  let result = null

  if (dark && themeIndex && themeIndex.codeMirrorDarkTheme) {
    // 读取配置模块内容
    const content = await file(await getResPath(themeIndex.codeMirrorDarkTheme)).text()
    // 动态加载配置模块
    result = (await import(createModelBlobUrl(content))).default
  } else if (!dark && themeIndex && themeIndex.codeMirrorTheme) {
    const content = await file(await getResPath(themeIndex.codeMirrorTheme)).text()
    result = (await import(createModelBlobUrl(content))).default
  } else {
    result = dark ? defaultDark : defaultLight
  }

  return result
}
