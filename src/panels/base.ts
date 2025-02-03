import { Component } from 'vue'

export enum PanelIconPosition {
  top,
  bottom,
}

export interface Panel {
  id: string
  name: string
  icon: string
  position: PanelIconPosition
  index: number
  actions?: Array<{
    icon: string
    name: string
    tooltip: string
    method: string
  }>
  component: () => Promise<Component>
  onActive: () => void
}
