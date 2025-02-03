import { Panel, PanelIconPosition } from './base'
import { FilePanel } from './files'
import { DifferencesPanel } from './differences'
import { OutlinePanel } from './outline'
import { SearchPanel } from './search'
import { AboutPanel } from './about'
import { SettingsPanel } from './settings'

class PanelsManager {
  private static instance: PanelsManager
  private panels: Panel[] = [
    new FilePanel(),
    new DifferencesPanel(),
    new OutlinePanel(),
    new SearchPanel(),
    new AboutPanel(),
    new SettingsPanel(),
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
  }> {
    return this.panels.map((panel: Panel) => {
      return { id: panel.id, icon: panel.icon, position: panel.position, index: panel.index }
    })
  }

  public getPanel(id: string): Panel | undefined {
    return this.panels.find((panel: Panel) => panel.id === id)
  }

  public async getPanelComponent(id: string) {
    const panel = this.getPanel(id)
    if (panel) {
      return await panel.component()
    }
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
