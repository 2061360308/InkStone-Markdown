import { Component, markRaw } from 'vue'
import { Panel, PanelIconPosition } from './base'
import { useContexStore } from '@/stores'
import panelsManager from '.'

export class SettingsPanel implements Panel {
  id = 'settings'
  name = '设置'
  icon = 'gear'
  position = PanelIconPosition.bottom
  index = 1
  noselect = true

  async component(): Promise<Component> {
    const m = await import('@/components/SettingsPanel.vue')
    return m.default as Component
  }

  onActive(): void {
    console.log('AboutPanel onActive')
    const contexStore = useContexStore()

    const settingsTab: TabItem = {
      id: this.id,
      panelName: this.id,
      panel: panelsManager.getPanelComponent(this.id)
        ? markRaw(panelsManager.getPanelComponent(this.id)!)
        : null,
      icon: 'gear',
      title: this.name,
      data: {},
    }
    contexStore.addTab(settingsTab)
  }
}
