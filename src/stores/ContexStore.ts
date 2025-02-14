import { defineStore } from 'pinia'
import { markRaw, ref, Ref, watch } from 'vue'
import api from '@/utils/api'
import { generateRandomId } from '@/utils/general'
import panelsManager from '@/panels'

export const useContexStore = defineStore('contex', () => {
  // 打开的文件
  // const openedFiles: Ref<Array<localFile | remoteFile | nativeFile>> = ref([])
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

  // 标题栏提示字符
  const titleBarText = ref('')

  watch(
    () => activeTabId.value,
    (id) => {
      const item = tabs.value.find((tab) => tab.id === id)
      titleBarText.value = item?.title || ''
    },
  )

  const savedContextDict: Record<string, Ref<unknown>> = {
    routerParams,
    sidebarState,
    tabs,
    activeTabId,
    titleBarText,
  }

  interface ContextReset {
    save: () => string
    load: (data: string) => void
  }

  const sidebarStateReset: ContextReset = {
    save: () => {
      const savedState = { ...sidebarState.value }
      savedState.ready = false
      return JSON.stringify(savedState)
    },
    load: (data: string) => {
      try {
        const parsedData = JSON.parse(data)
        sidebarState.value = parsedData
      } catch (e) {
        console.error('Failed to load sidebarState', e)
      }
    },
  }

  const tabsReset: {
    save: () => string
    load: (data: string) => void
  } = {
    save: () => {
      const savedTabs = tabs.value
        .map((tab) => {
          const data = tab.data
          if (tab.panelName === 'localFileEditor' || tab.panelName === 'remoteFileEditor') {
            return {
              id: tab.id,
              panelName: tab.panelName,
              icon: tab.icon,
              title: tab.title,
              data,
            }
          }
          return null
        })
        .filter((tab) => tab !== null)

      return JSON.stringify(savedTabs)
    },
    load: (data: string) => {
      try {
        const parsedTabs = JSON.parse(data)
        parsedTabs.forEach((tab: TabItem) => {
          const newTab: TabItem = {
            id: tab.id,
            panelName: tab.panelName,
            panel: panelsManager.getPanelComponent(tab.panelName)
              ? markRaw(panelsManager.getPanelComponent(tab.panelName)!)
              : null,
            icon: tab.icon,
            title: tab.title,
            data: tab.data,
          }

          tabs.value.push(newTab)
        })
      } catch (e) {
        console.error('Failed to load tabs', e)
      }
    },
  }

  const activeTabIdReset: ContextReset = {
    save: () => {
      const currentTab = tabs.value.find((tab) => tab.id === activeTabId.value)
      if (
        currentTab?.panelName === 'localFileEditor' ||
        currentTab?.panelName === 'remoteFileEditor'
      ) {
        return currentTab.id as string
      } else {
        for (const tab of tabs.value) {
          if (tab.panelName === 'localFileEditor' || tab.panelName === 'remoteFileEditor') {
            return tab.id as string
          }
        }
        return ''
      }
    },
    load: (data: string) => {
      activeTabId.value = data
    },
  }

  const contextResetsDict: Record<string, ContextReset> = {
    sidebarState: sidebarStateReset,
    tabs: tabsReset,
    activeTabId: activeTabIdReset,
  }

  const saveContext = () => {
    const savedValues: Record<string, unknown> = {}

    for (const key in savedContextDict) {
      if (contextResetsDict[key]) {
        savedValues[key] = contextResetsDict[key].save()
        continue
      }
      savedValues[key] = savedContextDict[key].value
    }

    localStorage.setItem('context', JSON.stringify(savedValues))
  }

  const loadContext = () => {
    const savedValues = localStorage.getItem('context')
    if (savedValues) {
      const parsedValues = JSON.parse(savedValues)
      for (const key in savedContextDict) {
        if (parsedValues[key]) {
          if (contextResetsDict[key]) {
            contextResetsDict[key].load(parsedValues[key])
            continue
          }
          savedContextDict[key].value = parsedValues[key]
        }
      }
    }
  }

  loadContext()

  // 开始监听所有需要保存的状态
  for (const key in savedContextDict) {
    watch(savedContextDict[key], saveContext, { deep: true })
  }

  return {
    api,
    // openedFiles,
    routerParams,
    sidebarState,
    notification,
    titleBarText,
    tabs,
    activeTabId,
    setActiveTab,
    addTab,
    removeTab,
    saveContext,
    loadContext,
  }
})
