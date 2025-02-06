import { Panel, PanelIconPosition } from './base'
import { createVNode, render, ref, Component } from 'vue'

const show = ref(true)
let component: null | Component = null

export class AboutPanel implements Panel {
  actions?: { icon: string; name: string; tooltip: string; method: string }[] | undefined
  id = 'about'
  name = '关于'
  icon = 'circle-question'
  position = PanelIconPosition.bottom
  index = 0
  noselect = true

  async component(): Promise<Component> {
    const m = await import('../components/AboutPanel.vue')
    return m.default as Component
  }

  async onActive(): Promise<void> {
    show.value = true

    if (!component) {
      component = await this.component()
      console.log('component', component)
      const container = document.createElement('div')
      document.body.appendChild(container)

      // 创建组件的 VNode
      const vnode = createVNode(component, { show })

      // 使用 render 函数将 VNode 渲染到容器中
      render(vnode, container)
    }
  }
}
