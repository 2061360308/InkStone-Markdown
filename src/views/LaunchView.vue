<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContexStore } from '@/stores'
import { backendTasks } from '@/utils/backendLaunchTasks'
import { openNativeFile } from '@/utils/filePanelOperation'

const route = useRoute()
const router = useRouter()
const contexStore = useContexStore()

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
        openNativeFile(fileHandle)
      }
    })
  } else {
    console.error('File Handling API is not supported!')
  }

  backendTasks()

  router.push({ name: 'main', query: { from: 'launch' } })
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
