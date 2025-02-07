import { defineStore } from 'pinia'
import { ref, Ref } from 'vue'
import { localFile, remoteFile, nativeFile } from '@/utils/files'
import api from '@/utils/api'
import { generateRandomId } from '@/utils/general'

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
    current: 'files',
    ready: false,
  })

  // 通知
  const notification: Ref<{ hash: string; data: Array<string> }> = ref({ hash: '', data: [] })

  // 内容状态
  interface TabItem {
    id: string // 唯一标识
    panel: string // 面板名称
    icon: Ref<string> // 图标
    title: Ref<string> // 标题
    data: {
      file?: localFile | remoteFile | nativeFile
    }
  }

  const tabs: Ref<Array<TabItem>> = ref([])
  const activeTabId: Ref<string> = ref('')

  const setActiveTab = (id: string) => {
    activeTabId.value = id
  }

  const addTab = (tab: TabItem) => {
    if (!tab.id) {
      tab.id = generateRandomId(6)
    }

    const id = tab.id

    if (tabs.value.find((_tab) => _tab.id === id)) {
      setActiveTab(id)
      return
    }

    tabs.value.push(tab)
    setActiveTab(id)
  }

  const removeTab = (id: string) => {
    const index = tabs.value.findIndex((tab) => tab.id === id)
    if (index !== -1) {
      tabs.value.splice(index, 1)
      // 如果删除的是当前激活的tab，激活前一个或后一个tab
      if (activeTabId.value === id) {
        if (tabs.value.length > 0) {
          // 优先激活前一个tab，如果没有前一个，则激活后一个
          const newIndex = index > 0 ? index - 1 : 0
          setActiveTab(tabs.value[newIndex].id)
        } else {
          activeTabId.value = ''
        }
      }
    }
  }

  return {
    api,
    openedFiles,
    routerParams,
    sidebarState,
    notification,
    tabs,
    setActiveTab,
    addTab,
    removeTab,
  }
})
