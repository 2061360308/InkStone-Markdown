// 声明 .vue 文件模块
declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'splitpanes'
declare module '@imengyu/vue3-context-menu'
declare module 'js-yaml'
declare const __APP_VERSION__: string

declare interface EditorInstance {
  setContent: (content: string) => void
  getContent: () => string
  saveFile: () => void
}

declare interface localFile {
  path: string
  repo: string
  editor?: EditorInstance
}

declare interface remoteFile {
  path: string
  repo: string
  content: string
  editor?: EditorInstance
}

declare interface nativeFile extends FileSystemFileHandle {
  editor?: EditorInstance
}

declare interface treeItemObject {
  title: string
  isLeaf: boolean
  isExpanded: boolean
  data: {
    path: string
    position?: 'remote' | 'local'
  }
  children?: treeItemObject[]
}

declare interface Window {
  showOpenFilePicker: (opstions: Record<string, unknown>) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker: (opstions: Record<string, unknown>) => Promise<FileSystemFileHandle>
}

declare interface TabItem {
  id: string // 唯一标识
  panelName: string // 面板名称
  panel: unknown // 面板组件
  icon: string // 图标
  title: string // 标题
  data: {
    file?: localFile | remoteFile | nativeFile
  }
}
