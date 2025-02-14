<script setup lang="ts">
import Vditor from 'vditor'
import {
  ref,
  defineProps,
  defineExpose,
  defineModel,
  watch,
  onBeforeUnmount,
  nextTick,
  Ref,
  VNode,
} from 'vue'

import { ElMessage } from 'element-plus'
import FrontMatterEditor from './FrontMatterEditor.vue'

import imagehosting from '@/utils/imagehosting'
import { convertImagesToMarkdownBase64 } from '@/utils/imagehosting'
import { useContexStore, useSettingsStore } from '@/stores'
import { onMounted } from 'vue'
import ContextMenu from '@imengyu/vue3-context-menu'
import { handleNormalContextMenu } from '@/utils/normalContextMenu'
import { outlineRender } from '@/utils/outline'
import { storeToRefs } from 'pinia'
import { useScrollLock, useScroll, useStyleTag } from '@vueuse/core'
import { useTemplateRef } from 'vue'

const contexStore = useContexStore()
const settingsStore = useSettingsStore()

let fistChangeContent = true
const loading = ref(false)

const frontMatterString: Ref<string> = ref('') // frontMatter 解析出来的对象

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
    required: true,
  },
  renameFile: {
    type: Function,
    required: true,
  },
  editorReady: {
    type: Function,
    required: true,
  },
})

const fileName = ref(props.fileName)

const isAllSaved = defineModel() // 是否全部保存

const { activeTabId } = storeToRefs(contexStore) // 大纲树

let vditorInstance: Vditor | null = null

const setContent = async (content: string, replace: boolean = false) => {
  /**
   * 读取文件内容并设置到编辑器中
   * 会将 frontMatter 的内容分离出来，并设置到 frontMatter 中
   * 由 createVditorInstance 创建完Vditor实例后调用
   *  */

  // if (props.native) {
  //   // 加载句柄
  //   fileHandle.value = await tabsStore.tabs.find((item) => item.id === props.editor)?.data
  //     .fileHandle

  //   if (!fileHandle.value) {
  //     return
  //   }

  //   // 读取文件内容
  //   const file = await fileHandle.value.getFile()
  //   content = await file.text()
  // } else {
  //   content = await fs.get(path, repoName.value)
  // }
  // 分离 frontMatter 和 content
  const result = splitFrontMatter(content)

  frontMatterString.value = result.yamlContent // 设置 frontMatter 字符串内容
  // 设置正文内容到编辑器中
  if (vditorInstance) {
    vditorInstance.setValue(result.content, replace)
  }

  if (fistChangeContent) {
    updateOutline() // 更新大纲
  }
}

const getContent = () => {
  /**
   * 获取编辑器内容
   * 会将 frontMatter 和 content 合并
   */
  const content = (vditorInstance as Vditor).getValue()

  // 补全 frontMatter 末尾的换行符
  if (!frontMatterString.value.endsWith('\n') && !content.startsWith('\n')) {
    return frontMatterString.value + '\n' + content
  } else {
    return frontMatterString.value + content
  }
}

defineExpose({
  vditorInstance,
  getContent,
  setContent,
})

const totalWordsNum = ref(0)

const currentMode = ref(settingsStore.settings.editorDefaultMode)

const previewSourceRef: Ref<HTMLElement | null> = ref(null)

const editorFullscreeState = ref(false)

let modeInerval: ReturnType<typeof setInterval> // 编辑器模式检测定时器

const createVditorInstance = () => {
  /**
   * 创建 Vditor 实例
   */

  // 等待下一个 tick 确保组件已渲染
  nextTick(() => {
    vditorInstance = new Vditor(props.editor, {
      value: '# Hello Vditor!\n\n这是编辑器预设内容，如果你看到这段文字代表内容没有被正确显示！',
      mode: currentMode.value,
      height: '100%',
      typewriterMode: true, //settingsStore.settings.editorTypewriterMode,
      input: inputHandler,
      cache: {
        enable: true,
        id: props.editor,
      },
      theme: 'dark',
      toolbarConfig: {
        pin: true,
      },
      toolbar: [
        'emoji',
        'headings',
        'bold',
        'italic',
        'strike',
        'link',
        '|',
        'list',
        'ordered-list',
        'check',
        'outdent',
        'indent',
        '|',
        'quote',
        'line',
        'code',
        'inline-code',
        'insert-before',
        'insert-after',
        '|',
        'upload',
        'table',
        '|',
        'undo',
        'redo',
        '|',
        {
          name: 'save',
          tipPosition: 'ne',
          tip: '保存到本地~',
          className: 'save',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-242.7c0-17-6.7-33.3-18.7-45.3L352 50.7C340 38.7 323.7 32 306.7 32L64 32zm0 96c0-17.7 14.3-32 32-32l192 0c17.7 0 32 14.3 32 32l0 64c0 17.7-14.3 32-32 32L96 224c-17.7 0-32-14.3-32-32l0-64zM224 288a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/></svg>',
          click: () => props.saveFile(),
        },
        {
          name: 'fullscreen',
          tipPosition: 'ne',
          tip: '全屏编辑',
          className: 'fullscreen',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><use xlink:href="#vditor-icon-fullscreen"></use></svg>',
          click: () => {
            editorFullscreeState.value = !editorFullscreeState.value
          },
        },
        'edit-mode',
        {
          name: 'more',
          toolbar: [
            'both',
            'code-theme',
            'content-theme',
            'export',
            'outline',
            'preview',
            'devtools',
            'info',
            'help',
          ],
        },
      ],
      preview: {
        markdown: {
          autoSpace: settingsStore.settings.editorAutoSpace,
          gfmAutoLink: settingsStore.settings.editorGfmAutoLink,
        },
      },
      outline: {
        enable: false,
        position: 'left',
      },
      counter: {
        enable: true,
        after: (length: number) => {
          totalWordsNum.value = length
        },
      },
      upload: {
        accept: '.jpg,.jpeg,.png,.gif,.bmp,.webp,.svg', // 允许上传的文件类型
        handler: uploadImage,
      },
      after: () => {
        // 确保 vditorInstance 完全初始化后再进行操作
        // fileName.value = props.fileName // 设置文件名
        props.editorReady()
        updatePreviewSourceRef(currentMode.value) // 更新预览区域Ref
        updateEditorResetElm(currentMode.value) // 更新编辑器重置区域
      },
    })
  })
}

// 等待编辑器 id 准备好后再创建 Vditor 实例
watch(
  () => props.editor,
  () => {
    createVditorInstance()
  },
  {
    immediate: true,
    once: true,
  },
)

watch(
  () => activeTabId.value,
  (newVal) => {
    if (newVal !== props.editor) {
      return
    }

    updateOutline()
  },
)

onMounted(() => {
  modeInerval = setInterval(() => {
    if (vditorInstance) {
      if (vditorInstance.vditor.currentMode === currentMode.value) {
        return
      }
      currentMode.value = vditorInstance.vditor.currentMode

      updatePreviewSourceRef(currentMode.value) // 更新预览区域Ref
      updateOutline() // 更新大纲
      updateEditorResetElm(currentMode.value) // 更新编辑器重置区域
    }
  }, 1000)
  window.addEventListener('keydown', handleKeyDown)
  editorBoxElmRef.value?.addEventListener('wheel', wheelEventHandler)
})

onBeforeUnmount(() => {
  /**
   * 组件销毁时操作
   * 销毁 Vditor 实例
   * 清除其在缓存中的数据（Storage）
   */
  if (vditorInstance) {
    vditorInstance.clearCache() // 清除缓存
    vditorInstance.destroy() // 销毁实例
    vditorInstance = null
  }

  clearInterval(modeInerval)
  window.removeEventListener('keydown', handleKeyDown)
  editorBoxElmRef.value?.removeEventListener('wheel', wheelEventHandler)
  updateOutline(true) // 清空大纲
})

/**
 * 大纲
 */
const { outlineTree, outlineSelectId } = storeToRefs(contexStore)

const updatePreviewSourceRef = (mode: string) => {
  let sourceClass = ''
  if (mode === 'wysiwyg') {
    sourceClass = '.vditor-wysiwyg'
  } else if (mode === 'ir') {
    sourceClass = '.vditor-ir'
  } else {
    sourceClass = '.vditor-preview'
  }

  previewSourceRef.value = (document.getElementById(props.editor) as HTMLElement).querySelector(
    sourceClass,
  ) as HTMLElement
}

const updateOutline = (clear: boolean = false) => {
  if (clear) {
    outlineTree.value = []
    return
  }

  if (previewSourceRef.value) {
    console.log('previewSourceRef:', previewSourceRef.value)
    outlineTree.value = outlineRender(previewSourceRef.value)
    console.log('outlineTree:', outlineTree.value)
  }
}

// 大纲选中，滚动到对应位置

watch(
  () => outlineSelectId.value,
  (newVal) => {
    const selectItemElm = document.getElementById(newVal)
    if (selectItemElm) {
      selectItemElm.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  },
)

/**
 * 平滑滚动
 */

const editorBoxElmRef = useTemplateRef<HTMLElement>('editor-box') // 编辑器外部区域
const editorResetElmRef: Ref<HTMLElement | null> = ref(null) // vditor reset 区域(内容区域)
const editorBoxElmIsLocked = useScrollLock(editorBoxElmRef)
const { y: editorBoxElmY, directions: editorBoxElmD } = useScroll(editorBoxElmRef)
const editorResetIsLocked = useScrollLock(editorResetElmRef)
const { y: editorResetY, directions: editorResetD } = useScroll(editorResetElmRef)
editorResetIsLocked.value = true

watch([editorResetY, editorBoxElmY], () => {
  handelElmLock()
})

const handelElmLock = () => {
  if (editorFullscreeState.value) {
    // 全屏状态下不处理
    editorResetIsLocked.value = false
    return
  }

  if (!editorBoxElmRef.value || !editorResetElmRef.value) {
    return
  }

  // editorBoxElm向下滚动且滚到了底部，锁定editorBoxElm滚动，解锁editorResetElm滚动
  if (editorBoxElmD.bottom) {
    if (
      editorBoxElmRef.value.scrollTop + editorBoxElmRef.value.clientHeight >=
      editorBoxElmRef.value.scrollHeight
    ) {
      editorBoxElmIsLocked.value = true
      editorResetIsLocked.value = false
    }
  }

  // editoResetElm向上滚动且滚到了顶部，锁定editorResetElm滚动，解锁editorBoxElm滚动
  if (editorResetD.top) {
    if (editorResetY.value === 0) {
      editorResetIsLocked.value = true
      editorBoxElmIsLocked.value = false
    }
  }

  // editoResetElm到顶，锁定editorResetElm滚动，解锁editorBoxElm滚动（主要为了初始化状态）
  if (editorBoxElmY.value === 0) {
    editorResetIsLocked.value = true
    editorBoxElmIsLocked.value = false
  }
}

// 鼠标滚动事件，让滚动更加平滑（防止滚动区域切换时卡顿现象）
const wheelEventHandler = (event: WheelEvent) => {
  if (editorFullscreeState.value) {
    // 全屏状态下不处理
    editorResetIsLocked.value = false
    return
  }

  if (!editorBoxElmRef.value || !editorResetElmRef.value) {
    return
  }

  if (event.deltaY < 0) {
    // 向上滚动
    if (editorBoxElmIsLocked.value && !editorResetIsLocked.value && editorResetY.value === 0) {
      event.preventDefault()
      editorResetIsLocked.value = true
      editorBoxElmIsLocked.value = false
      // editorBoxElmRef.value!.scrollTop =
      //   (editorBoxElmRef.value!.scrollTop as number) + event.deltaY
      return
    }

    if (!editorBoxElmIsLocked.value) {
      event.preventDefault()
      editorBoxElmRef.value!.scrollTop = (editorBoxElmRef.value!.scrollTop as number) + event.deltaY
    }

    if (!editorResetIsLocked.value) {
      event.preventDefault()
      editorResetElmRef.value!.scrollTop =
        (editorResetElmRef.value!.scrollTop as number) + event.deltaY
    }
  } else {
    // 向下滚动

    if (
      !editorBoxElmIsLocked.value &&
      editorResetIsLocked.value &&
      editorBoxElmRef.value.scrollTop + editorBoxElmRef.value.clientHeight >=
        editorBoxElmRef.value.scrollHeight
    ) {
      event.preventDefault()
      editorBoxElmIsLocked.value = true
      editorResetIsLocked.value = false
      return
    }

    if (!editorBoxElmIsLocked.value) {
      event.preventDefault()
      editorBoxElmRef.value!.scrollTop = (editorBoxElmRef.value!.scrollTop as number) + event.deltaY
    }

    if (!editorResetIsLocked.value) {
      event.preventDefault()
      editorResetElmRef.value!.scrollTop =
        (editorResetElmRef.value!.scrollTop as number) + event.deltaY
    }
  }
}

const updateEditorResetElm = (mode: string) => {
  if (mode === 'wysiwyg' || mode === 'ir') {
    if (previewSourceRef.value) {
      editorResetElmRef.value = previewSourceRef.value.querySelector('.vditor-reset') as HTMLElement
    }
  } else {
    editorResetElmRef.value = previewSourceRef.value = (
      document.getElementById(props.editor) as HTMLElement
    ).querySelector('.vditor-sv')
  }

  handelElmLock()
}

/**
 * 设置编辑器最大宽度
 */

useStyleTag(`
.md-editor-box .vditor-reset {
  * {
    max-width: ${settingsStore.settings.editorMaxWidth}px !important;
    margin: auto !important;
  }
}`)

/**
 * 编辑器内容变化事件
 */

const inputHandler = () => {
  /**
   * 编辑器内容变化时触发
   * 用于更新编辑器状态栏右下角的字数统计
   */
  updateOutline()

  console.log('inputHandler')

  if (fistChangeContent) {
    fistChangeContent = false
    return
  }
  isAllSaved.value = false
}

/**
 * frontMatter
 */

const splitFrontMatter = (content: string): Record<string, string> => {
  const yalmPattern = /^---[\s\S]*?---/
  const yamlMatch = content.match(yalmPattern)
  const yamlContent = yamlMatch ? yamlMatch[0] : ''
  const cleanedContent = content.replace(yamlContent, '')

  return {
    yamlContent,
    content: cleanedContent,
  }
}

const frontMatterChange = (value: string) => {
  /**
   * frontMatter 内容变化时触发
   */

  frontMatterString.value = value
  isAllSaved.value = false
}

/**
 * 快捷键
 */

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault()
    props.saveFile()
  }
}

/**
 * 插入图片
 */

const handleDragOver = (event: { preventDefault: () => void }) => {
  // 阻止默认行为以允许拖放
  event.preventDefault()
}

const handleDrop = (event: DragEvent) => {
  // 获取拖入的文件
  const dataTransfer = event.dataTransfer
  if (dataTransfer) {
    const files = dataTransfer.files
    if (files.length > 0) {
      console.log('拖入的文件:', files)
    }
  }
}

const uploadImage = async (files: File[]): Promise<null> => {
  loading.value = true

  if (!imagehosting.ready) {
    const base64Results = await convertImagesToMarkdownBase64(files)
    let content = '\n'
    for (let i = 0; i < base64Results.length; i++) {
      const base64Result = base64Results[i]
      content += `${settingsStore.getImageString(base64Result.file.name, base64Result.url)}\n`
    }

    vditorInstance?.insertValue(content)
    loading.value = false
    return null
  }

  const { success, failed } = await imagehosting.upload(files)
  let content = '\n'
  for (let i = 0; i < success.length; i++) {
    const fileExtension = success[i].file.name.split('.').pop() || ''
    let rootUrl = settingsStore.settings.rootUrl
    if (!rootUrl.endsWith('/')) {
      rootUrl += '/'
    }
    const imgUrl = `${rootUrl}${success[i].hash}.${fileExtension}`

    content += `${settingsStore.getImageString(success[i].file.name, imgUrl)}\n`
  }

  vditorInstance?.insertValue(content)

  if (failed.length > 0) {
    for (let i = 0; i < failed.length; i++) {
      ElMessage({
        message: `图片 ${failed[i].name} 上传失败`,
        type: 'warning',
      })
    }
  }

  loading.value = false
  return null
}

/**
 * 右键菜单
 */

interface contextMenuItem {
  label: string
  disabled?: boolean
  icon?: VNode
  onClick?: () => void
  children?: Array<contextMenuItem>
}

const clipMenu: contextMenuItem = {
  label: '剪贴',
  disabled: false,
  onClick: async () => {
    if (!vditorInstance) {
      return
    }
    await navigator.clipboard.writeText(vditorInstance?.getSelection())
    vditorInstance.deleteValue()
  },
}

const copyMenu: contextMenuItem = {
  label: '复制',
  disabled: false,
  onClick: async () => {
    if (!vditorInstance) {
      return
    }
    await navigator.clipboard.writeText(vditorInstance?.getSelection())
  },
}

const pasteMenu: contextMenuItem = {
  label: '粘贴',
  disabled: false,
  onClick: async () => {
    if (!vditorInstance) {
      return
    }
    vditorInstance.updateValue(await navigator.clipboard.readText())
  },
}

const handleContextMenu = async (event: MouseEvent) => {
  event.stopPropagation() // 停止冒泡
  event.preventDefault() // 阻止默认事件

  if (!vditorInstance) {
    return
  }

  let contexmenu = []

  const selected = vditorInstance.getSelection()

  if (!selected) {
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

  ContextMenu.showContextMenu({
    x: event.clientX,
    y: event.clientY,
    // theme: 'default dark',
    items: contexmenu,
    zIndex: 2017,
  })
}

/**
 * 重命名文件
 */

const handelTitleInputBlur = async () => {
  if (fileName.value !== props.fileName) {
    const result: boolean = await props.renameFile(fileName.value)
    console.log('rename result:', result)
    if (result) {
      ElMessage({
        message: '重命名成功',
        type: 'success',
      })
    } else {
      ElMessage({
        message: '重命名失败',
        type: 'error',
      })
      fileName.value = props.fileName
    }
  }
}
</script>

<template>
  <div
    class="md-editor-box"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
    v-loading="loading"
    @contextmenu="handleContextMenu"
    ref="editor-box"
  >
    <div class="editor-region">
      <!-- :style="currentMode === 'sv' ? {} : { maxWidth: MaxEditRegionWidth.toString() + 'px' }" -->
      <div class="info-box">
        <el-input
          v-model="fileName"
          autosize
          type="textarea"
          placeholder="未命名"
          class="el-front-matter-custom post-title"
          style="margin: 20px 0"
          @contextmenu="
            (event: MouseEvent) => {
              event.stopPropagation()
              handleNormalContextMenu(event)
            }
          "
          @blur="handelTitleInputBlur"
        />
        <FrontMatterEditor :frontMatterString="frontMatterString" @change="frontMatterChange" />
      </div>
      <div :id="editor" class="md-editor"></div>
    </div>

    <div style="height: 200px"></div>

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

      <div class="status-bar-item">
        <div class="icon">
          <font-awesome-icon :icon="['fas', 'won-sign']" />
        </div>
        <span>总字数：{{ totalWordsNum }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.md-editor-box {
  width: 100%;
  height: calc(100vh - 40px);
  /* width: 100%; */
  overflow: auto;

  .editor-region {
    margin: auto;
    width: 100%;
    height: 100%;

    .info-box {
      padding: 25px;

      .post-title {
        font-size: 28px;
        font-weight: bold;
        font-family: '微软雅黑', Courier, monospace;
      }
    }

    .md-editor {
      height: 100%;
      // height: auto !important;
      // min-height: 500px;
    }
  }
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
// .vditor {
//   border: none !important;
//   height: 100% !important;
// }

// .vditor-toolbar {
//   padding: 0 !important;
//   /* background-color: inherit !important; */
// }

// .vditor-reset {
//   // overflow: visible !important;
//   padding: 0 40px !important;
//   /* color: inherit !important; */
//   /* background-color: inherit !important; */
// }
// .vditor-reset {
//   * {
//     max-width: 800px !important;
//     margin: auto !important;
//   }
// }

// .vditor-outline {
//   display: none !important;
// }
</style>
