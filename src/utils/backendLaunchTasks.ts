import api from '@/utils/api'
import { validateLoginAfter } from '@/utils/general'
import imagehosting from '@/utils/imagehosting'
import { useContexStore, useSettingsStore } from '@/stores'

const print = (msg: string) => {
  const style = `
    color: white;
    background-color: #67c23a;
    font-size: 12px;
    font-weight: bold;
    padding: 2px 4px;
    margin: 0 6px 0 2px;
    border-radius: 5px;
  `
  console.log(`%c Launch %c${msg}`, style, '')
}

export const backendTasks = async () => {
  // 后台加载任务

  const contexStore = useContexStore()
  const settingsStore = useSettingsStore()

  /**
   *   验证本地token信息
   */
  print('开始执行后台启动任务')

  if (!api.ready) {
    await validateLoginAfter()
  }

  // 置sidebarPanel的ready为true，让其开始挂载面板组件
  print('验证API完成，准备挂载面板')
  contexStore.sidebarState.ready = true

  /**
   *  同步设置项
   */

  if (api.ready) {
    await settingsStore.syncRemoteSettings()
    print('设置项同步完成')
  }

  /**
   * 图床初始化
   */
  if (
    settingsStore.bucket &&
    settingsStore.endpoint &&
    settingsStore.region &&
    settingsStore.accessKeyId &&
    settingsStore.secretAccessKey
  ) {
    await imagehosting.init(
      settingsStore.bucket || '',
      settingsStore.endpoint || '',
      settingsStore.region || '',
      settingsStore.accessKeyId || '',
      settingsStore.secretAccessKey || '',
    )
    print('图床初始化完成')
  }
}
