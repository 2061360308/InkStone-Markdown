import { defineStore } from 'pinia'
import { ref, Ref } from 'vue'
import { localFile, remoteFile, nativeFile } from '@/utils/files'

export const useContexStore = defineStore('contex', () => {
  // 打开的文件
  const openedFiles: Ref<Array<localFile | remoteFile | nativeFile>> = ref([])
  // 路由参数
  const routerParams: Ref<Record<string, unknown>> = ref({})
  // 侧边栏状态
  const sidebarState: Ref<{
    fixed: boolean
    opened: boolean
    size: number
    current: string
    ready: boolean
  }> = ref({
    fixed: true,
    opened: true,
    size: 20,
    current: '',
    ready: false,
  })

  const notification: Ref<{ hash: string; data: Array<string> }> = ref({ hash: '', data: [] })

  return {
    openedFiles,
    routerParams,
    sidebarState,
    notification,
  }
})
