<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContexStore, useSettingsStore } from '@/stores'
import api from '@/utils/api'
import { validateLoginAfter } from '@/utils/general'
import imagehosting from '@/utils/imagehosting'

const route = useRoute()
const router = useRouter()
const contexStore = useContexStore()
const settingsStore = useSettingsStore()

declare global {
  interface Window {
    launchQueue?: LaunchQueue
  }

  interface LaunchQueue {
    setConsumer(consumer: (params: LaunchParams) => void): void
  }

  interface LaunchParams {
    files: FileSystemFileHandle[]
  }
}

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

const backendTasks = async () => {
  // 后台加载任务

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
  await imagehosting.init(
    settingsStore.settings['图床配置'].bucket,
    settingsStore.settings['图床配置'].endpoint,
    settingsStore.settings['图床配置'].region,
    settingsStore.settings['图床配置'].accessKeyId,
    settingsStore.settings['图床配置'].secretAccessKey,
  )
  print('图床初始化完成')
}

onMounted(() => {
  // 处理当前路由参数
  const { query } = route
  contexStore.routerParams = query // 将路由参数存储到全局状态中
  router.replace({ query: {} }) // 清空路由参数

  // 检查系统传递过来的文件
  if ('launchQueue' in window) {
    window.launchQueue!.setConsumer((launchParams) => {
      if (!launchParams.files.length) {
        return
      }
      for (const fileHandle of launchParams.files) {
        // contexStore.openedFiles.push(fileHandle)
        console.log('Todo:', fileHandle)
      }
    })
  } else {
    console.error('File Handling API is not supported!')
  }

  backendTasks()

  router.push({ name: 'main' })
})
</script>

<template>
  <div class="launch-main">
    <el-image src="/cover.png" class="cover-img" />
  </div>
</template>

<style scoped lang="scss">
.launch-main {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;

  .cover-img {
    width: 70%;
    max-width: 500px;

    animation: fadeInOut 2s infinite;

    @keyframes fadeInOut {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.3;
      }
    }
  }
}
</style>
