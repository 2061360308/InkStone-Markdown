<script setup lang="ts">
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  keymap,
} from "@codemirror/view";
import {
  foldGutter,
  indentOnInput,
  syntaxHighlighting,
  bracketMatching,
  foldKeymap,
} from "@codemirror/language";
import { languages } from "@codemirror/language-data";
import { history, defaultKeymap, historyKeymap } from "@codemirror/commands";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import {
  closeBrackets,
  autocompletion,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { lintKeymap } from "@codemirror/lint";

const theme = {
  workspaceBgColor: "#ffffff",
  workspaceBgColorLight: "#dcdfe6",
  workspaceTextColor: "#24292e",
  gutterLineNumColor: "#5c6370",
  currentLineColor: "#d9d9d9",
  cursorColor: "#000",
  selectionBgColor: "#d9d9d9",
};

import { markdown } from "@codemirror/lang-markdown";
import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";
import {
  ref,
  watch,
  defineProps,
  defineEmits,
  defineExpose,
} from "vue";

const editorContainer = ref<HTMLElement | null>(null);

const props = defineProps({
  content: String, // 内容
  readOnly: { // 是否只读
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits(["change"]);

const markdwonHighlightStyle = HighlightStyle.define([
  {
    tag: tags.heading1,
    fontSize: "26px",
    fontWeight: "bold",
    color: "#9876aa",
  },
  {
    tag: tags.heading2,
    fontSize: "24px",
    fontWeight: "bold",
    color: "#9876aa",
  },
  {
    tag: tags.heading3,
    fontSize: "22px",
    fontWeight: "bold",
    color: "#9876aa",
  },
  {
    tag: tags.heading4,
    fontSize: "20px",
    fontWeight: "bold",
    color: "#9876aa",
  },
  {
    tag: tags.heading5,
    fontSize: "18px",
    fontWeight: "bold",
    color: "#9876aa",
  },
  {
    tag: tags.heading6,
    fontSize: "16px",
    fontWeight: "bold",
    color: "#9876aa",
  },
  { tag: [tags.strong], fontWeight: "bold" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.meta, color: "#c57330" },
  { tag: tags.link, color: "#287bde" },
  { tag: tags.quote, color: "#6a8759" },
  { tag: tags.number, color: "#2e5795" },
  { tag: tags.keyword, color: "#c57330" },
  {
    tag: [
      tags.atom,
      tags.bool,
      tags.url,
      tags.contentSeparator,
      tags.labelName,
    ],
    color: "#8e75a7",
  },
  { tag: [tags.literal, tags.inserted], color: "#a5c261" },
  { tag: [tags.string, tags.deleted], color: "#68844e" },
  {
    tag: [tags.regexp, tags.escape, tags.special(tags.string)],
    color: "#e40",
  },
  { tag: tags.definition(tags.variableName), color: "#8ea4b8" },
  { tag: tags.local(tags.variableName), color: "#30a" },
  { tag: [tags.typeName, tags.namespace], color: "#e7b350" },
  { tag: tags.className, color: "#317467" },
  {
    tag: [tags.special(tags.variableName), tags.macroName],
    color: "#256",
  },
  { tag: tags.definition(tags.propertyName), color: "#00c" },
  { tag: tags.comment, color: "#5f9654" },
  { tag: tags.invalid, color: "#f00" },
  { tag: tags.self, color: "#c57330" },
]);

const updateListener = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    emits("change");
  }
});

const editorTheme = EditorView.theme(
  {
    // 输入的字体颜色
    "&": {
      color: theme.workspaceTextColor,
      backgroundColor: theme.workspaceBgColor,
    },
    // 背景色
    ".cm-content": {
      caretColor: theme.workspaceTextColor,
    },
    //光标的颜色
    "&.cm-focused .cm-cursor": {
      borderLeftColor: theme.cursorColor,
    },
    // 选中的状态
    "&.cm-focused .cm-selectionBackground, ::selection": {
      // color: theme.selectionBgColor, // Todo: 选中文字背景色无效
      backgroundColor: `${theme.selectionBgColor} !important`,
    },
    // 激活序列的背景色
    ".cm-gutterElement.cm-activeLineGutter": {
      backgroundColor: theme.currentLineColor,
    },
    // 激活背景色
    ".cm-activeLine.cm-line": {
      backgroundColor: `${theme.currentLineColor} !important`,
    },
    // 左侧侧边栏的颜色
    ".cm-gutters": {
      backgroundColor: theme.workspaceBgColor,
      color: theme.gutterLineNumColor,
      border: `1px solid ${theme.workspaceBgColorLight}`,
    },
  },
  {}
);

let editorView: EditorView | null = null;

watch(
  () => editorContainer.value,
  (value) => {
    if (value) {
      if (editorView) {
        // 销毁之前的编辑器
        editorView.destroy();
      }

      const state = EditorState.create({
        doc: props.content? props.content : "",
        extensions: [
          editorTheme,
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          history(),
          foldGutter(),
          drawSelection(),
          dropCursor(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          syntaxHighlighting(markdwonHighlightStyle, { fallback: false }),
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
          markdown({ codeLanguages: languages }),
          EditorState.readOnly.of(props.readOnly),
        ],
      });

      editorView = new EditorView({
        state,
        parent: value,
      });
    }
  },
  { immediate: true }
);

const getEditorContent = () => {
  return editorView ? editorView.state.doc.toString() : "";
};

const setEditorContent = (content: string) => {
  if (editorView) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content,
      },
    });
  }
};

defineExpose({
  getEditorContent,
  setEditorContent,
});
</script>

<template>
  <div ref="editorContainer" class="codemirror-editor"></div>
</template>

<style scoped>
.codemirror-editor {
  min-width: 100%; /* 确保内容宽度至少为容器宽度 */
  white-space: nowrap; /* 确保内容在一行内显示 */
  height: 100%;
}
</style>

<style>
.cm-editor {
  height: 100%;
} 
.ͼ1 .cm-scroller {
  height: 100%;
  overflow-x: auto;
}
</style>