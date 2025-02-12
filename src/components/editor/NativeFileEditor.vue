<script setup lang="ts">
import { defineProps, onMounted, Ref, ref, watch, defineAsyncComponent, Component } from 'vue'
import { useContexStore } from '@/stores'
import { storeToRefs } from 'pinia'
import MdEditor from './MdEditor.vue'

const contexStore = useContexStore()
const { tabs } = storeToRefs(contexStore)

const ready: Ref<boolean> = ref(false)

const props = defineProps({
  // 对应在Contex中tabs的id
  id: {
    type: String,
    required: true,
  },
})

const file: Ref<null | File> = ref(null)
const fileName = ref('')
const isMarkdown = ref(true)
const isAllSaved = ref(true)

let fileHandler: null | FileSystemFileHandle = null

const EditorInstanceRef = ref<InstanceType<typeof MdEditor> | null>(null)
let Editor: Component

onMounted(async () => {
  // 通过id获取当前tab的内容
  const tab = tabs.value.find((tab) => tab.id === props.id)
  fileHandler = tab?.data.file as nativeFile

  const fileObj = await fileHandler.getFile()
  fileName.value = fileObj.name

  const ext = fileName.value.split('.').pop() as string
  isMarkdown.value = ext === 'md' || ext === 'markdown'

  if (isMarkdown.value) {
    Editor = defineAsyncComponent(() => import('./MdEditor.vue'))
  } else {
    Editor = defineAsyncComponent(() => import('./CodemirrorEditor.vue'))
  }

  file.value = fileObj

  fileName.value = fileHandler.name
})

// 根据文件是否保存来修改标题提示文字
watch(
  () => isAllSaved.value,
  (value) => {
    const title = fileName.value
    if (value) {
      contexStore.titleBarText = title
    } else {
      contexStore.titleBarText = title + ' *'
    }
  },
)

const editorReady = async () => {
  console.log('editorReady')
  file.value?.text().then((content) => {
    if (!EditorInstanceRef.value) {
      return
    }
    EditorInstanceRef.value.setContent(content)
    ready.value = true
  })
}

const saveFile = async () => {
  if (!EditorInstanceRef.value) {
    return
  }
  const file_content = EditorInstanceRef.value.getContent()

  fileHandler?.createWritable().then((writable) => {
    writable.write(file_content)
    writable.close()
  })

  ElMessage({
    message: '文章保存成功',
    grouping: true,
    type: 'success',
  })

  isAllSaved.value = true
}
</script>

<template>
  <div class="local-file-editor file-editor">
    <Editor
      v-if="file"
      :editor="id"
      class="editor"
      :file-name="fileName"
      v-model="isAllSaved"
      :editorReady="editorReady"
      :save-file="saveFile"
      ref="EditorInstanceRef"
      v-show="ready"
    />
    <el-skeleton
      :rows="7"
      animated
      v-if="!ready"
      style="margin: auto; max-width: 800px; padding: 40px"
    />
  </div>
</template>

<style scoped lang="scss">
.local-file-editor {
  width: 100%;
  height: 100%;

  .editor {
    width: 100%;
    height: 100%;
  }
}
</style>
