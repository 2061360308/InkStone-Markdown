import { Panel, PanelIconPosition } from './base'
import { FilePanel } from './files'
import { DifferencesPanel } from './differences'
import { OutlinePanel } from './outline'
import { SearchPanel } from './search'
import { AboutPanel } from './about'
import { SettingsPanel } from './settings'
import { localFileEditorPanel } from './localFileEditor'
import { defineAsyncComponent } from 'vue'

class PanelsManager {
  private static instance: PanelsManager
  private panels: Panel[] = [
    new FilePanel(),
    new DifferencesPanel(),
    new OutlinePanel(),
    new SearchPanel(),
    new AboutPanel(),
    new SettingsPanel(),
    new localFileEditorPanel(),
  ]

  private constructor() {}

  public static getInstance(): PanelsManager {
    if (!PanelsManager.instance) {
      PanelsManager.instance = new PanelsManager()
    }
    return PanelsManager.instance
  }

  public getAllPanels(): Array<{
    id: string
    icon: string
    position: PanelIconPosition
    index: number
    noselect: boolean
  }> {
    return this.panels
      .filter((panel: Panel) => !panel.noSidebar)
      .map((panel: Panel) => ({
        id: panel.id,
        icon: panel.icon,
        position: panel.position!,
        index: panel.index!,
        noselect: panel.noselect || false,
      }))
  }

  public getPanel(id: string): Panel | undefined {
    return this.panels.find((panel: Panel) => panel.id === id)
  }

  public getPanelComponent(id: string) {
    const panel = this.getPanel(id)
    if (panel) {
      return defineAsyncComponent({
        loader: panel.component,
        loadingComponent: {
          template: '<div>Loading...</div>',
        },
        errorComponent: {
          template: '<div>Failed to load component</div>',
        },
        delay: 200,
      })
    }
    return null
  }

  public async activePanel(id: string) {
    const panel = this.getPanel(id)
    if (panel) {
      panel.onActive()
    }
  }
}

const panelsManager = PanelsManager.getInstance()
export default panelsManager
