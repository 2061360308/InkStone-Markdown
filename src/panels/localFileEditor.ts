import { Component } from 'vue'
import { Panel } from './base'
// import { useContexStore } from '@/stores'

export class localFileEditorPanel implements Panel {
  id = 'localFileEditor'
  name = '本地文件编辑器'
  icon = 'file'
  noSidebar = true

  async component(): Promise<Component> {
    const m = await import('@/components/editor/LocalFileEditor.vue')
    return m.default as Component
  }

  onActive(): void {
    // const contexStore = useContexStore()
    console.log('localFileEditorPanel onActive')
  }
}
