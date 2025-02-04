// 声明 .vue 文件模块
declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module 'splitpanes'
declare module '@imengyu/vue3-context-menu'
declare const __APP_VERSION__: string
