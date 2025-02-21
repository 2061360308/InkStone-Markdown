import { Component, markRaw } from 'vue'
import { Panel } from './base'
import { useContexStore } from '@/stores'
import panelsManager from '.'

export class ThemePanel implements Panel {
  id = 'theme'
  name = '主题管理'
  icon = 'shirt'
  // position = PanelIconPosition.bottom
  // index = 2
  // noselect = true
  noSidebar = true

  async component(): Promise<Component> {
    const m = await import('@/components/themePanel.vue')
    return m.default as Component
  }

  onActive(): void {
    console.log('ThemePanel onActive')
    const contexStore = useContexStore()

    const settingsTab: TabItem = {
      id: this.id,
      panelName: this.id,
      panel: panelsManager.getPanelComponent(this.id)
        ? markRaw(panelsManager.getPanelComponent(this.id)!)
        : null,
      icon: this.icon,
      title: this.name,
      data: {},
    }
    contexStore.addTab(settingsTab)
  }
}
