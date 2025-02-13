import { defineStore } from 'pinia'
import { ref, Ref, watch } from 'vue'
import { format } from 'date-fns'
import api from '@/utils/api'
import CryptoJS from 'crypto-js'

export const useSettingsStore = defineStore('settings', () => {
  enum EditorMode {
    /**
     * 编辑器模式
     *
     * 所见即所得 wysiwyg
     * 即时渲染 ir
     * 分屏预览 sv
     */
    WYSIWYG = 'wysiwyg',
    IR = 'ir',
    SV = 'sv',
  }

  enum InputType {
    lineInput = 'lineInput',
    textInput = 'textInput',
    numberInput = 'numberInput',
    selectInput = 'selectInput',
    colorInput = 'colorInput',
    booleanInput = 'booleanInput',
  }

  const themeName = ref<string>('default') // 主题名称
  const repoName = ref<string>('') // 仓库名称
  const repoBranch = ref<string>('') // 使用的仓库分支
  const repoPath = ref<string>('') // 使用的仓库根路径
  const defaultFrontMatter = ref<string>(
    `title: "{{title}}"\ndescription: ""\ndate: {{currentDate}}\nlastmod: {{currentDate}}\ndraft: {{draft}}`,
  ) // 默认创建文章时的 front matter
  const dateTimeFormat = ref<string>("yyyy-MM-dd'T'HH:mm:ssxxxxx") // 日期时间格式
  const editorDefaultMode = ref<EditorMode>(EditorMode.IR) // 默认编辑器模式
  const editorMaxWidth = ref<number>(800) // 编辑器最大宽度
  const editorTypewriterMode = ref<boolean>(false) // 打字机模式
  const editorAutoSpace = ref<boolean>(true) // 自动空格
  const editorGfmAutoLink = ref<boolean>(true) // 自动链接

  // 图床配置
  const bucket = ref<string>('') // bucket name
  const endpoint = ref<string>('') // endpoint eg: https://cos.ap-chengdu.myqcloud.com
  const region = ref<string>('') // region eg: ap-chengdu
  const accessKeyId = ref<string>('') // accessKeyId
  const secretAccessKey = ref<string>('') // secretAccessKey
  const rootUrl = ref<string>('') // 图床根的URL
  const defaultImageLinkString = ref<string>('![{{ name }}]({{ url }})') // 默认插入图片链接的字符串

  const settingsInputTypes: Record<string, InputType> = {
    themeName: InputType.selectInput,
    repoName: InputType.selectInput,
    repoBranch: InputType.selectInput,
    repoPath: InputType.lineInput,
    defaultFrontMatter: InputType.textInput,
    dateTimeFormat: InputType.lineInput,
    editorDefaultMode: InputType.selectInput,
    editorMaxWidth: InputType.numberInput,
    editorTypewriterMode: InputType.booleanInput,
    editorAutoSpace: InputType.booleanInput,
    editorGfmAutoLink: InputType.booleanInput,
    bucket: InputType.lineInput,
    endpoint: InputType.lineInput,
    region: InputType.lineInput,
    accessKeyId: InputType.lineInput,
    secretAccessKey: InputType.lineInput,
    rootUrl: InputType.lineInput,
    defaultImageLinkString: InputType.textInput,
  }

  const settingsInputLabels: Record<string, string> = {
    themeName: '主题',
    repoName: '仓库名称',
    repoBranch: '仓库分支',
    repoPath: '仓库路径',
    defaultFrontMatter: '默认 front matter',
    dateTimeFormat: '日期时间格式',
    editorDefaultMode: '默认编辑器模式',
    editorMaxWidth: '编辑器最大宽度',
    editorTypewriterMode: '打字机模式',
    editorAutoSpace: '自动空格',
    editorGfmAutoLink: '自动链接',
    bucket: 'bucket',
    endpoint: 'endpoint',
    region: 'region',
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    rootUrl: '图床根的URL',
    defaultImageLinkString: '默认插入图片链接的字符串',
  }

  const settingsInputDescriptions: Record<string, string> = {
    themeName: '主题名称：用于设置应用程序的主题样式。',
    repoName: '仓库名称：指定远程仓库的名称。',
    repoBranch: '仓库分支：指定要使用的远程仓库分支。',
    repoPath: '仓库路径：指定本地仓库的路径。',
    defaultFrontMatter: `<p>默认 front matter：用于新建文件时的默认 front matter 配置。</p><p>书写格式见<a style="color:#4dbbf7" target="_blank" href="https:inkstone.work/">官方文档</a></p>`,
    dateTimeFormat: '日期时间格式：设置日期时间的格式，用于 front matter 中的日期时间字段。',
    editorDefaultMode: '默认编辑器模式：设置编辑器的默认模式，例如 Markdown 或富文本。',
    editorMaxWidth: '编辑器最大宽度：设置编辑器的最大显示宽度。',
    editorTypewriterMode: '打字机模式：启用或禁用打字机模式，使当前行始终保持在视图中间。',
    editorAutoSpace: '自动空格：启用或禁用自动空格功能。',
    editorGfmAutoLink: '自动链接：启用或禁用 GitHub 风格的自动链接功能。',
    bucket: 'bucket名字',
    endpoint: 'endpoint，例如：https://cos.ap-chengdu.myqcloud.com',
    region: 'region，例如：ap-chengdu',
    accessKeyId: 'accessKeyId',
    secretAccessKey: 'secretAccessKey',
    rootUrl: '图床根的URL',
    defaultImageLinkString: `<p>默认插入图片链接的字符串</p><p>书写格式见<a style="color:#4dbbf7" target="_blank" href="https:inkstone.work/">官方文档</a></p>`,
  }

  const selectInputOptions: Record<string, Ref<string[]>> = {
    themeName: ref(['default', 'light', 'dark']),
    repoName: ref([]),
    repoBranch: ref([]),
    editorDefaultMode: ref([EditorMode.WYSIWYG, EditorMode.IR, EditorMode.SV]),
  }

  // 设置项是否使用
  const settingsUsage: Record<string, boolean> = {
    themeName: true,
    repoName: true,
    repoBranch: true,
    repoPath: true,
    defaultFrontMatter: true,
    dateTimeFormat: true,
    editorDefaultMode: true,
    editorMaxWidth: true,
    editorTypewriterMode: true,
    editorAutoSpace: true,
    editorGfmAutoLink: true,
    bucket: true,
    endpoint: true,
    region: true,
    accessKeyId: true,
    secretAccessKey: true,
    rootUrl: true,
    defaultImageLinkString: true,
  }

  const settings: SettingsType = {
    基本配置: {
      themeName: themeName,
      repoName: repoName,
      repoBranch: repoBranch,
      repoPath: repoPath,
    },
    编辑器配置: {
      defaultFrontMatter: defaultFrontMatter,
      dateTimeFormat: dateTimeFormat,
      editorDefaultMode: editorDefaultMode,
      editorMaxWidth: editorMaxWidth,
      editorTypewriterMode: editorTypewriterMode,
      editorAutoSpace: editorAutoSpace,
      editorGfmAutoLink: editorGfmAutoLink,
    },
    图床配置: {
      bucket: bucket,
      endpoint: endpoint,
      region: region,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      rootUrl: rootUrl,
      defaultImageLinkString: defaultImageLinkString,
    },
  }

  let uploadTimeout: number | null = null
  const SETTINGS_STORAGE_KEY = 'inkstone.settings'

  const parseSettings = (encryptedSettings: string): Record<string, unknown> => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedSettings, SETTINGS_STORAGE_KEY)
      const decryptedSettings = bytes.toString(CryptoJS.enc.Utf8)
      const remoteData = JSON.parse(decryptedSettings)
      return remoteData
    } catch (e) {
      console.error('Failed to parse settings', e)
      return {}
    }
  }

  const scheduleUploadSettings = (settingsStr: string) => {
    if (uploadTimeout !== null) {
      clearTimeout(uploadTimeout)
    }

    uploadTimeout = window.setTimeout(() => {
      if (api.ready) {
        console.log('Uploading settings...')
        api.uploadSettings(settingsStr)
      }
    }, 30000) // 30秒延时
  }

  const saveSettings = () => {
    // 保存设置
    const data: Record<string, unknown> = {}
    for (const groupname in settings) {
      const group = settings[groupname as keyof SettingsType]
      Object.keys(group).forEach((key: string) => {
        const value = (group as Record<string, Ref<unknown>>)[key].value
        data[key] = value
      })
    }

    const settingsStr = JSON.stringify(data)
    const encryptedSettings = CryptoJS.AES.encrypt(settingsStr, SETTINGS_STORAGE_KEY).toString()

    localStorage.setItem('settings', encryptedSettings)

    if (api.ready) {
      console.log('Add scheduleUploadSettings')
      scheduleUploadSettings(encryptedSettings) // 延时更新设置
    }
  }

  const loadSettings = (data: Record<string, unknown>) => {
    // 加载设置
    for (const groupname in settings) {
      const group = settings[groupname as keyof SettingsType]
      Object.keys(group).forEach((key: string) => {
        if (data[key] !== undefined) {
          ;(group as Record<string, Ref<unknown>>)[key].value = data[key]
        }
      })
    }
  }

  const syncRemoteSettings = async () => {
    // 合并远程设置
    const settingsStr = await api.getSettings()
    if (!settingsStr) {
      return
    }
    const data = parseSettings(settingsStr)
    if (!data) {
      return
    }
    // 加载设置
    const ignores = ['repoName', 'repoBranch', 'repoPath']
    // 去除不需要同步的设置
    for (const ignore of ignores) {
      delete data[ignore]
    }

    loadSettings(data) // 加载设置
  }

  // 监测设置项变化
  for (const groupname in settings) {
    const group = settings[groupname as keyof SettingsType]
    Object.keys(group).forEach((key: string) => {
      watch((group as Record<string, Ref<unknown>>)[key], () => {
        saveSettings()
      })
    })
  }

  // 初始化设置
  const data = localStorage.getItem('settings')
  if (data) {
    const settingsData = parseSettings(data)
    if (settingsData) {
      loadSettings(settingsData)
    }
  } else {
    saveSettings()
  }

  const replaceTemplate = (template: string, values: Record<string, string>) => {
    return template.replace(/{{\s*(\w+)\s*}}/g, (_, key) => values[key] || '')
  }

  const getfrontMatter = (title: string = '', draft: boolean = false) => {
    const currentDate = format(new Date(), dateTimeFormat.value)

    const values: Record<string, string> = {
      title,
      currentDate,
      draft: draft ? 'true' : 'false',
    }

    return `---\n${replaceTemplate(defaultFrontMatter.value, values)}\n---\n`
  }

  const getImageString = (name: string, url: string) => {
    return replaceTemplate(defaultImageLinkString.value, { name, url })
  }

  return {
    InputType,
    settings,
    settingsInputTypes,
    settingsInputLabels,
    settingsInputDescriptions,
    selectInputOptions,
    settingsUsage,
    getfrontMatter,
    getImageString,
    syncRemoteSettings,
  }
})
