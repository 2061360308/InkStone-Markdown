import { Component } from 'vue'
import { Panel, PanelIconPosition } from './base'
import { useContexStore } from '@/stores'

export class OutlinePanel implements Panel {
  id = 'outline'
  name = '大纲'
  icon = 'inbox'
  position = PanelIconPosition.top
  index = 1

  actions = []

  async component(): Promise<Component> {
    const m = await import('@/components/OutlinePanel.vue')
    return m.default as Component
  }

  onActive(): void {
    const contexStore = useContexStore()
    console.log('FilePanel onActive')
    contexStore.sidebarState.current = this.id
  }
}
