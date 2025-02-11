<script setup lang="ts">
import { watchOnce } from '@vueuse/core'
import { EditorState } from '@codemirror/state'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  // highlightActiveLine,
  keymap,
} from '@codemirror/view'
import {
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
  bracketMatching,
  foldKeymap,
} from '@codemirror/language'
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import {
  closeBrackets,
  autocompletion,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete'
import { lintKeymap } from '@codemirror/lint'

// const theme = {
//   workspaceBgColor: '#ffffff',
//   workspaceBgColorLight: '#dcdfe6',
//   workspaceTextColor: '#24292e',
//   gutterLineNumColor: '#5c6370',
//   currentLineColor: '#d9d9d9',
//   cursorColor: '#000',
//   selectionBgColor: '#d9d9d9',
// }

import { defaultHighlightStyle } from '@codemirror/language'
// import { tags } from '@lezer/highlight'
import { ref, defineProps, defineExpose, watch } from 'vue'
import { useElementSize, useCssVar } from '@vueuse/core'

const editorContainer = ref<HTMLElement | null>(null) // 编辑器容器

// Todo: 不知道Codemirror这里宽度使用百分比会闪烁，只能写死数值
const { width: containerWidth } = useElementSize(editorContainer) // 编辑器容器宽度
const editorWidth = useCssVar('--app-codemirror-editor-w', editorContainer)
watch(
  () => containerWidth.value,
  (value) => {
    editorWidth.value = `${value - 60}px`
  },
)

// const props = defineProps({
//   content: String, // 内容
//   readOnly: {
//     // 是否只读
//     type: Boolean,
//     default: false,
//   },
// })

const props = defineProps({
  // 编辑器名称/id
  editor: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    default: '',
  },
  saveFile: {
    type: Function,
    required: false,
  },
  editorReady: {
    type: Function,
    required: true,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
})

const isAllSaved = defineModel() // 是否全部保存

const setContent = async (content: string) => {
  if (editorView) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content,
      },
    })
  }
}

const getContent = () => {
  /**
   * 获取编辑器内容
   * 会将 frontMatter 和 content 合并
   */
  return editorView ? editorView.state.doc.toString() : ''
}

defineExpose({
  getContent,
  setContent,
})

// const markdwonHighlightStyle = HighlightStyle.define([
//   {
//     tag: tags.heading1,
//     fontSize: '26px',
//     fontWeight: 'bold',
//     color: '#9876aa',
//   },
//   {
//     tag: tags.heading2,
//     fontSize: '24px',
//     fontWeight: 'bold',
//     color: '#9876aa',
//   },
//   {
//     tag: tags.heading3,
//     fontSize: '22px',
//     fontWeight: 'bold',
//     color: '#9876aa',
//   },
//   {
//     tag: tags.heading4,
//     fontSize: '20px',
//     fontWeight: 'bold',
//     color: '#9876aa',
//   },
//   {
//     tag: tags.heading5,
//     fontSize: '18px',
//     fontWeight: 'bold',
//     color: '#9876aa',
//   },
//   {
//     tag: tags.heading6,
//     fontSize: '16px',
//     fontWeight: 'bold',
//     color: '#9876aa',
//   },
//   { tag: [tags.strong], fontWeight: 'bold' },
//   { tag: tags.emphasis, fontStyle: 'italic' },
//   { tag: tags.strikethrough, textDecoration: 'line-through' },
//   { tag: tags.meta, color: '#c57330' },
//   { tag: tags.link, color: '#287bde' },
//   { tag: tags.quote, color: '#6a8759' },
//   { tag: tags.number, color: '#2e5795' },
//   { tag: tags.keyword, color: '#c57330' },
//   {
//     tag: [tags.atom, tags.bool, tags.url, tags.contentSeparator, tags.labelName],
//     color: '#8e75a7',
//   },
//   { tag: [tags.literal, tags.inserted], color: '#a5c261' },
//   { tag: [tags.string, tags.deleted], color: '#68844e' },
//   {
//     tag: [tags.regexp, tags.escape, tags.special(tags.string)],
//     color: '#e40',
//   },
//   { tag: tags.definition(tags.variableName), color: '#8ea4b8' },
//   { tag: tags.local(tags.variableName), color: '#30a' },
//   { tag: [tags.typeName, tags.namespace], color: '#e7b350' },
//   { tag: tags.className, color: '#317467' },
//   {
//     tag: [tags.special(tags.variableName), tags.macroName],
//     color: '#256',
//   },
//   { tag: tags.definition(tags.propertyName), color: '#00c' },
//   { tag: tags.comment, color: '#5f9654' },
//   { tag: tags.invalid, color: '#f00' },
//   { tag: tags.self, color: '#c57330' },
// ])

EditorView.updateListener.of((update: { docChanged: boolean }) => {
  if (update.docChanged) {
    handelChange()
  }
})

const handelChange = () => {
  isAllSaved.value = false
}

// const editorTheme = EditorView.theme(
//   {
//     // 输入的字体颜色
//     '&': {
//       color: theme.workspaceTextColor,
//       backgroundColor: theme.workspaceBgColor,
//     },
//     // 背景色
//     '.cm-content': {
//       caretColor: theme.workspaceTextColor,
//     },
//     //光标的颜色
//     '&.cm-focused .cm-cursor': {
//       borderLeftColor: theme.cursorColor,
//     },
//     // 选中的状态
//     '&.cm-focused .cm-selectionBackground, ::selection': {
//       // color: theme.selectionBgColor, // Todo: 选中文字背景色无效
//       backgroundColor: `${theme.selectionBgColor} !important`,
//     },
//     // 激活序列的背景色
//     '.cm-gutterElement.cm-activeLineGutter': {
//       backgroundColor: theme.currentLineColor,
//     },
//     // 激活背景色
//     '.cm-activeLine.cm-line': {
//       backgroundColor: `${theme.currentLineColor} !important`,
//     },
//     // 左侧侧边栏的颜色
//     '.cm-gutters': {
//       backgroundColor: theme.workspaceBgColor,
//       color: theme.gutterLineNumColor,
//       border: `1px solid ${theme.workspaceBgColorLight}`,
//     },
//   },
//   {},
// )

let editorView: EditorView | null = null

watchOnce(
  () => editorContainer.value,
  (value) => {
    if (value) {
      if (editorView) {
        // 销毁之前的编辑器
        editorView.destroy()
      }

      initEditor()
    }
  },
  { immediate: true },
)

const initEditor = async () => {
  const suffix = props.fileName.split('.').pop()?.toLowerCase()
  let languageExtension: Extension | null = null

  switch (suffix) {
    case 'yaml':
    case 'yml':
      languageExtension = await import('@codemirror/lang-yaml').then((mod) => mod.yaml())
      break
    case 'xml':
      languageExtension = await import('@codemirror/lang-xml').then((mod) => mod.xml())
      break
    case 'angular':
      languageExtension = await import('@codemirror/lang-angular').then((mod) => mod.angular())
      break
    case 'cpp':
    case 'c':
    case 'h':
      languageExtension = await import('@codemirror/lang-cpp').then((mod) => mod.cpp())
      break
    case 'css':
      languageExtension = await import('@codemirror/lang-css').then((mod) => mod.css())
      break
    case 'go':
      languageExtension = await import('@codemirror/lang-go').then((mod) => mod.go())
      break
    case 'html':
      languageExtension = await import('@codemirror/lang-html').then((mod) => mod.html())
      break
    case 'java':
      languageExtension = await import('@codemirror/lang-java').then((mod) => mod.java())
      break
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
      languageExtension = await import('@codemirror/lang-javascript').then((mod) =>
        mod.javascript(),
      )
      break
    case 'json':
      languageExtension = await import('@codemirror/lang-json').then((mod) => mod.json())
      break
    case 'less':
      languageExtension = await import('@codemirror/lang-less').then((mod) => mod.less())
      break
    case 'liquid':
      languageExtension = await import('@codemirror/lang-liquid').then((mod) => mod.liquid())
      break
    case 'md':
      languageExtension = await import('@codemirror/lang-markdown').then(
        async (mod) =>
          await import('@codemirror/language-data').then(({ languages }) =>
            mod.markdown({ codeLanguages: languages }),
          ),
      )
      break
    case 'php':
      languageExtension = await import('@codemirror/lang-php').then((mod) => mod.php())
      break
    case 'py':
      languageExtension = await import('@codemirror/lang-python').then((mod) => mod.python())
      break
    case 'rs':
      languageExtension = await import('@codemirror/lang-rust').then((mod) => mod.rust())
      break
    case 'sass':
    case 'scss':
      languageExtension = await import('@codemirror/lang-sass').then((mod) => mod.sass())
      break
    case 'sql':
      languageExtension = await import('@codemirror/lang-sql').then((mod) => mod.sql())
      break
    case 'vue':
      languageExtension = await import('@codemirror/lang-vue').then((mod) => mod.vue())
      break
    case 'wast':
      languageExtension = await import('@codemirror/lang-wast').then((mod) => mod.wast())
      break
    default:
      languageExtension = null
  }

  let extensions = [
    // editorTheme,
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightSpecialChars(),
    history(),
    foldGutter(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    syntaxHighlighting(defaultHighlightStyle),
    bracketMatching(),
    closeBrackets(),
    autocompletion(),
    rectangularSelection(),
    crosshairCursor(),
    // highlightActiveLine(),
    highlightSelectionMatches(),
    keymap.of([
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...completionKeymap,
      ...lintKeymap,
    ]),
    EditorState.readOnly.of(props.readOnly),
  ]

  if (languageExtension) {
    extensions = [...extensions, languageExtension]
  }

  const state = EditorState.create({
    doc: '',
    extensions: extensions,
  })

  editorView = new EditorView({
    state,
    parent: editorContainer.value as HTMLElement,
  })

  props.editorReady()
}
</script>

<template>
  <div ref="editorContainer" class="codemirror-editor" :id="editor"></div>
</template>

<style scoped>
.codemirror-editor {
  width: 100%;
  padding: none;
  margin: auto;
  /* white-space: nowrap; 确保内容在一行内显示 */
  height: 100%;
  overflow: hidden;
  /* height: calc(100vh - 70px); 编辑器高度 */
}
</style>

<style>
.cm-editor {
  /* max-width: calc(100% - 20px); */
  width: var(--app-codemirror-editor-w);
  /* width: 100vw; */
  /* width: 100%; */
  height: 100%;
  /* overflow-x: hidden; */
}
.ͼ1 .cm-scroller {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
