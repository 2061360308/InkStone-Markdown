import { Component } from 'vue'
import { Panel } from './base'
// import { useContexStore } from '@/stores'

export class RemoteFileEditorPanel implements Panel {
  id = 'remoteFileEditor'
  name = '远程文件编辑器'
  icon = 'file'
  noSidebar = true

  async component(): Promise<Component> {
    const m = await import('@/components/editor/RemoteFileEditor.vue')
    return m.default as Component
  }

  onActive(): void {
    // const contexStore = useContexStore()
    console.log('RemoteFileEditorPanel onActive')
  }
}
