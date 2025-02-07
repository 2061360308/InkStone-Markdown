<script setup lang="ts">
import { defineProps, onMounted, Ref, ref } from 'vue'
import { useContexStore } from '@/stores'
import { storeToRefs } from 'pinia'
import MdEditor from './MdEditor.vue'
import fs from '@/utils/fs'

const contexStore = useContexStore()
const { tabs } = storeToRefs(contexStore)

const props = defineProps({
  // 对应在Contex中tabs的id
  id: {
    type: String,
    required: true,
  },
})

const file: Ref<null | localFile> = ref(null)
const fileName = ref('')
const content = ref('')
const isAllSaved = ref(true)
let repo = ''
let path = ''

onMounted(async () => {
  // 通过id获取当前tab的内容
  const tab = tabs.value.find((tab) => tab.id === props.id)
  file.value = tab?.data.file as localFile

  path = file.value.path
  repo = file.value.repo

  fileName.value = path.split('/').pop() as string
  content.value = (await fs.get(path, repo)) as string
})

// const saveFile = async () => {
//   const file_path = props.path
//   const file_content = getContent()

//   if (props.native) {
//     // 本地文件
//     if (!fileHandle.value) {
//       throw new Error('找不到文件句柄')
//     }

//     // 请求写入权限
//     const writable = await fileHandle.value.createWritable()
//     // 写入内容
//     await writable.write(file_content)
//     // 关闭写入流
//     await writable.close()
//   } else {
//     // 写入文件
//     await fs.write(file_path, file_content, repoName.value)
//   }

//   ElMessage({
//     message: '文章保存成功',
//     grouping: true,
//     type: 'success',
//   })

//   isAllSaved.value = false
// }
</script>

<template>
  <div>
    <MdEditor
      v-if="file"
      :editor="id"
      :file-name="fileName"
      :content="content"
      v-model="isAllSaved"
    />
  </div>
</template>
