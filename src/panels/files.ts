import { Component } from 'vue'
import { Panel, PanelIconPosition } from './base'
import { useContexStore } from '@/stores'

export class FilePanel implements Panel {
  id = 'files'
  name = '资源管理器'
  icon = 'file'
  position = PanelIconPosition.top
  index = 0

  actions = [
    {
      icon: 'add',
      name: '新建文件',
      tooltip: '新建文件',
      method: 'createFile',
    },
    {
      icon: 'arrows-rotate',
      name: '刷新',
      tooltip: '刷新',
      method: 'refresh',
    }
  ]

  async component(): Promise<Component> {
    const m = await import('@/components/file/FilePanel.vue')
    return m.default as Component
  }

  onActive(): void {
    const contexStore = useContexStore()
    console.log('FilePanel onActive')
    contexStore.sidebarState.current = this.id
  }
}
