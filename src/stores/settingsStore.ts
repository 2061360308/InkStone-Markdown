import { defineStore } from 'pinia'
import { ref, Ref, watch } from 'vue'
import { format } from 'date-fns'
import api from '@/utils/api'
import CryptoJS from 'crypto-js'

export const useSettingsStore = defineStore('settings', () => {
  const themeName: Ref<string> = ref('default') // 主题名称
  const repoName: Ref<string> = ref('') // 仓库名称
  const repoBranch: Ref<string> = ref('') // 使用的仓库分支
  const repoPath: Ref<string> = ref('') // 使用的仓库根路径
  const defaultFrontMatter: Ref<string> = ref(
    `title: "{{title}}"\ndescription: ""\ndate: {{currentDate}}\nlastmod: {{currentDate}}\ndraft: {{draft}}`,
  ) // 默认创建文章时的 front matter
  const dateTimeFormat: Ref<string> = ref("yyyy-MM-dd'T'HH:mm:ssxxxxx") // 日期时间格式
  const editorDefaultMode: Ref<string> = ref('ir') // 默认编辑器模式 wysiwyg | ir | sv
  const editorMaxWidth: Ref<number> = ref(800) // 编辑器最大宽度
  const editorTypewriterMode: Ref<boolean> = ref(false) // 打字机模式
  const editorAutoSpace: Ref<boolean> = ref(true) // 自动空格
  const editorGfmAutoLink: Ref<boolean> = ref(true) // 自动链接

  // imageHosting
  const bucket: Ref<string> = ref('') // bucket name
  const endpoint: Ref<string> = ref('') // endpoint eg: https://cos.ap-chengdu.myqcloud.com
  const region: Ref<string> = ref('') // region eg: ap-chengdu
  const accessKeyId: Ref<string> = ref('') // accessKeyId
  const secretAccessKey: Ref<string> = ref('') // secretAccessKey
  const rootUrl: Ref<string> = ref('') // 图床根的URL
  const defaultImageLinkString: Ref<string> = ref('![{{ name }}]({{ url }})') // 默认插入图片链接的字符串

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
    themeName,
    repoName,
    repoBranch,
    repoPath,
    defaultFrontMatter,
    dateTimeFormat,
    editorDefaultMode,
    editorMaxWidth,
    editorTypewriterMode,
    editorAutoSpace,
    editorGfmAutoLink,
    bucket,
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    rootUrl,
    defaultImageLinkString,
  }

  /**
   * 设置项的保存与加载/同步
   */

  const requireSavedSettings: Record<string, Ref<unknown>> = {
    themeName,
    defaultFrontMatter,
    dateTimeFormat,
    editorDefaultMode,
    editorMaxWidth,
    editorTypewriterMode,
    editorAutoSpace,
    editorGfmAutoLink,
    bucket,
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    rootUrl,
    defaultImageLinkString,
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
    for (const key in requireSavedSettings) {
      data[key] = requireSavedSettings[key].value
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
    for (const key in requireSavedSettings) {
      if (data[key] !== undefined) {
        requireSavedSettings[key].value = data[key]
      }
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

  // 监测需要保存的设置项的变化
  watch(
    Object.values(requireSavedSettings),
    () => {
      console.log('Save settings')
      saveSettings()
    },
    { deep: true },
  )

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
    themeName,
    repoName,
    repoBranch,
    repoPath,
    defaultFrontMatter,
    dateTimeFormat,
    editorDefaultMode,
    editorMaxWidth,
    editorTypewriterMode,
    editorAutoSpace,
    editorGfmAutoLink,
    bucket,
    endpoint,
    region,
    accessKeyId,
    secretAccessKey,
    rootUrl,
    defaultImageLinkString,
    // 旧数据
    settings,
    settingsUsage,
    getfrontMatter,
    getImageString,
    syncRemoteSettings,
  }
})
