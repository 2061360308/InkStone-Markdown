import { Component } from 'vue'

export enum PanelIconPosition {
  top,
  bottom,
}

export interface Panel {
  id: string  // 标识id
  name: string  // 名称
  icon: string  // 图标名称
  position?: PanelIconPosition  // 显示在侧边栏的位置（上/下）
  index?: number  // 侧边栏显示时的权重
  noselect?: boolean // 是否不可选中
  actions?: Array<{  // 激活时顶部的操作按钮
    icon: string
    name: string
    tooltip: string
    method: string
  }>
  noSidebar?: boolean  // 是否不能在侧边栏显示
  component: () => Promise<Component>
  onActive: () => void
}
