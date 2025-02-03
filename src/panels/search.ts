import { Component } from 'vue'
import { Panel, PanelIconPosition } from './base'
import { useContexStore } from '@/stores'

export class SearchPanel implements Panel {
  id = 'search'
  name = '搜索'
  icon = 'magnifying-glass'
  position = PanelIconPosition.top
  index = 2

  async component(): Promise<Component> {
    const m = await import('@/components/SearchPanel.vue')
    return m.default as Component
  }

  onActive(): void {
    const contexStore = useContexStore()
    console.log('FilePanel onActive')
    contexStore.sidebarState.current = this.id
  }
}
