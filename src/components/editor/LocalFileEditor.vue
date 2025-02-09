<script setup lang="ts">
import { defineProps, onMounted, Ref, ref, watch } from 'vue'
import { useContexStore, useSettingsStore } from '@/stores'
import { storeToRefs } from 'pinia'
import MdEditor from './MdEditor.vue'
import fs from '@/utils/fs'
import api from '@/utils/api'

const contexStore = useContexStore()
const settingsStore = useSettingsStore()
const { tabs } = storeToRefs(contexStore)

const ready: Ref<boolean> = ref(false)

const props = defineProps({
  // 对应在Contex中tabs的id
  id: {
    type: String,
    required: true,
  },
})

const file: Ref<null | localFile> = ref(null)
const fileName = ref('')
const isAllSaved = ref(true)
let repo = ''
let path = ''
const EditorInstanceRef = ref<InstanceType<typeof MdEditor> | null>(null)

onMounted(async () => {
  // 通过id获取当前tab的内容
  const tab = tabs.value.find((tab) => tab.id === props.id)
  file.value = tab?.data.file as localFile

  path = file.value.path
  repo = file.value.repo

  fileName.value = path.split('/').pop() as string
})

// 根据文件是否保存来修改标题提示文字
watch(
  () => isAllSaved.value,
  (value) => {
    const title = path.split('/').pop() || ''
    if (value) {
      contexStore.titleBarText = title
    } else {
      contexStore.titleBarText = title + ' *'
    }
  },
)

const editorReady = async () => {
  console.log('editorReady')
  if (await fs.isExist(path, repo)) {
    const content = (await fs.get(path, repo)) as string
    EditorInstanceRef.value?.setContent(content)
    ready.value = true
  } else {
    const branch = settingsStore.settings['基本配置'].repoBranch as string
    api.getFileContent(path, branch).then((res) => {
      fs.write(path, res.decodedContent, repo)
      EditorInstanceRef.value?.setContent(res.decodedContent)
      ready.value = true
    })
  }
}

const saveFile = async () => {
  if (!EditorInstanceRef.value) {
    return
  }
  const file_content = EditorInstanceRef.value.getContent()

  await fs.write(path, file_content, repo)

  ElMessage({
    message: '文章保存成功',
    grouping: true,
    type: 'success',
  })

  isAllSaved.value = true
}
</script>

<template>
  <div>
    <MdEditor
      v-if="file"
      :editor="id"
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
