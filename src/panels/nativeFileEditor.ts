import { Component } from 'vue'
import { Panel } from './base'
// import { useContexStore } from '@/stores'

export class NativeFileEditorPanel implements Panel {
  id = 'nativeFileEditor'
  name = '本机文件编辑器'
  icon = 'file'
  noSidebar = true

  async component(): Promise<Component> {
    const m = await import('@/components/editor/NativeFileEditor.vue')
    return m.default as Component
  }

  onActive(): void {
    // const contexStore = useContexStore()
    console.log('nativeFileEditorPanel onActive')
  }
}
