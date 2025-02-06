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
  noselect?: boolean // 是否可以选中
  actions?: Array<{
    icon: string
    name: string
    tooltip: string
    method: string
  }>
  component: () => Promise<Component>
  onActive: () => void
}
