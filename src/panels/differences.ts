import { Component } from 'vue'
import { Panel, PanelIconPosition } from './base'
import { useContexStore } from '@/stores'

export class DifferencesPanel implements Panel {
  id = 'differences'
  name = '差异管理器'
  icon = 'code-branch'
  position = PanelIconPosition.top
  index = 3

  async component(): Promise<Component> {
    const m = await import('@/components/DifferencesPanel.vue')
    return m.default as Component
  }

  onActive(): void {
    const contexStore = useContexStore()
    console.log('FilePanel onActive')
    contexStore.sidebarState.current = this.id
  }
}
