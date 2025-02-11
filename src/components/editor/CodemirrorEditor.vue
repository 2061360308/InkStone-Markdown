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

import { defaultHighlightStyle } from '@codemirror/language'
import { ref, defineProps, defineExpose } from 'vue'

const editorContainer = ref<HTMLElement | null>(null) // 编辑器容器

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

EditorView.updateListener.of((update: { docChanged: boolean }) => {
  if (update.docChanged) {
    handelChange()
  }
})

const handelChange = () => {
  isAllSaved.value = false
}

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

<style scoped lang="scss">
.codemirror-editor {
  width: 100%;
  padding: none;
  margin: auto;
  white-space: nowrap; /* 确保内容在一行内显示 */
  height: 100%;
  overflow: hidden;
}
</style>

<style lang="scss">
.cm-editor {
  width: 100%;
  height: 100%;

  .cm-scroller {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
}
</style>
