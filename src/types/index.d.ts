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
  user: string
  branch: string
  content: string
  editor?: EditorInstance
}

declare interface nativeFile extends FileSystemFileHandle {
  editor?: EditorInstance
}
