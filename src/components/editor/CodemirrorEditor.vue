<script setup lang="ts">
import { watchOnce } from '@vueuse/core'
import { EditorState, Transaction } from '@codemirror/state'
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
import {
  history,
  historyField,
  undo,
  redo,
  defaultKeymap,
  historyKeymap,
} from '@codemirror/commands'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import {
  closeBrackets,
  autocompletion,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete'
import { lintKeymap } from '@codemirror/lint'

import { defaultHighlightStyle } from '@codemirror/language'
import { ref, defineProps, defineExpose, onMounted, onBeforeUnmount, VNode, computed } from 'vue'
import ContextMenu from '@imengyu/vue3-context-menu'

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

let fistChangeContent = true // 是否第一次更改内容
const isAllSaved = defineModel() // 是否全部保存

let editorView: EditorView | null = null

const setContent = async (content: string, replace: boolean = false) => {
  if (editorView) {
    const transaction = editorView.state.update({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content,
      },
      annotations: Transaction.addToHistory.of(!replace), // 不记录历史
    })
    editorView.dispatch(transaction)
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

const handelChange = () => {
  if (fistChangeContent) {
    fistChangeContent = false
    return
  }
  isAllSaved.value = false
}

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
    EditorView.updateListener.of((update: { docChanged: boolean }) => {
      console.log('update', update)
      if (update.docChanged) {
        handelChange()
      }
    }),
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

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault()
    if (props.saveFile) props.saveFile()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  /**
   * 组件销毁时操作
   * 销毁 Vditor 实例
   * 清除其在缓存中的数据（Storage）
   */
  window.removeEventListener('keydown', handleKeyDown)
})

interface HistoryState {
  done: Array<Transaction>
  undone: Array<Transaction>
}

// 判断是否可以撤销
const canUndo = computed(() => {
  const historyState: HistoryState = editorView?.state.field(historyField, false) as HistoryState
  return historyState ? historyState.done.length > 0 : false
})

// 判断是否可以重做
const canRedo = computed(() => {
  const historyState: HistoryState = editorView?.state.field(historyField, false) as HistoryState
  return historyState ? historyState.undone.length > 0 : false
})

// 获取选中内容
const getSelectedText = () => {
  if (editorView) {
    const selection = editorView.state.selection.main
    return editorView.state.sliceDoc(selection.from, selection.to)
  }
  return ''
}

// 替换选中内容
const replaceSelectedText = (content: string) => {
  if (editorView) {
    const selection = editorView.state.selection.main
    editorView.dispatch({
      changes: {
        from: selection.from,
        to: selection.to,
        insert: content,
      },
    })
  }
}

// 在光标位置插入内容
// const insertTextAtCursor = (content: string) => {
//   if (editorView) {
//     const selection = editorView.state.selection.main
//     editorView.dispatch({
//       changes: {
//         from: selection.from,
//         to: selection.from,
//         insert: content,
//       },
//     })
//   }
// }

interface contextMenuItem {
  label: string
  icon?: VNode
  disabled: boolean
  onClick?: () => void
  children?: Array<contextMenuItem>
}

const undoMenu: contextMenuItem = {
  label: '撤销',
  disabled: false,
  onClick: () => {
    if (editorView) {
      undo(editorView)
    }
  },
}

const redoMenu: contextMenuItem = {
  label: '重做',
  disabled: false,
  onClick: () => {
    if (editorView) {
      redo(editorView)
    }
  },
}

const clipMenu: contextMenuItem = {
  label: '剪贴',
  disabled: false,
  onClick: async () => {
    const selectedText = getSelectedText()
    await navigator.clipboard.writeText(selectedText)
    replaceSelectedText('')
  },
}

const copyMenu: contextMenuItem = {
  label: '复制',
  disabled: false,
  onClick: async () => {
    const selectedText = getSelectedText()
    await navigator.clipboard.writeText(selectedText)
  },
}

const pasteMenu: contextMenuItem = {
  label: '粘贴',
  disabled: false,
  onClick: async () => {
    const clipboardText = await navigator.clipboard.readText()
    replaceSelectedText(clipboardText)
  },
}

const handleContextMenu = async (event: MouseEvent) => {
  event.preventDefault()
  console.log('右键菜单')

  let contexmenu = []

  if (!getSelectedText()) {
    clipMenu.disabled = true
    copyMenu.disabled = true
  } else {
    clipMenu.disabled = false
    copyMenu.disabled = false
  }

  contexmenu = [clipMenu, copyMenu]

  const clipboardText = await navigator.clipboard.readText()

  if (clipboardText) {
    pasteMenu.disabled = false
  } else {
    pasteMenu.disabled = true
  }

  contexmenu.push(pasteMenu)

  if (canRedo.value) {
    redoMenu.disabled = false
  } else {
    redoMenu.disabled = true
  }

  contexmenu.push(redoMenu)

  if (canUndo.value) {
    undoMenu.disabled = false
  } else {
    undoMenu.disabled = true
  }

  contexmenu.push(undoMenu)

  ContextMenu.showContextMenu({
    x: event.clientX,
    y: event.clientY,
    // theme: 'default dark',
    items: contexmenu,
    zIndex: 2017,
  })
}
</script>

<template>
  <div class="codemirror-editor-box" @contextmenu="handleContextMenu">
    <div ref="editorContainer" class="codemirror-editor" :id="editor"></div>
    <div class="editor-status">
      <div class="status-bar-item">
        <div class="changes" v-if="isAllSaved">
          <span class="icon">
            <font-awesome-icon
              style="color: var(--el-color-success)"
              :icon="['fas', 'circle-check']"
            />
          </span>
          <span>已保存</span>
        </div>
        <div class="all-saved" v-else>
          <span class="icon">
            <font-awesome-icon
              style="color: var(--el-color-danger)"
              :icon="['fas', 'circle-exclamation']"
            />
          </span>
          <span>更改未保存</span>
        </div>
      </div>
    </div>
  </div>
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

.editor-status {
  position: fixed;
  bottom: 0;
  right: 0;

  height: 20px;
  padding: 0 10px;
  background-color: var(--el-color-primary);
  color: var(--el-color-secondary-text);

  border-radius: 20px 0 0 0;

  display: flex;
  justify-content: flex-end;
  padding: 10px;
  font-size: 14px;

  .status-bar-item {
    display: flex;
    align-items: center;
    /* 鼠标指针 */
    cursor: pointer;
    font-size: 14px;
    padding: 0 5px;
    margin: 0 10px;
    color: var(--el-color-white);

    &:hover {
      background-color: var(--el-color-primary-light-7);
      color: var(--el-color-secondary-text);
    }

    .icon {
      margin-right: 5px;
    }
  }
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
