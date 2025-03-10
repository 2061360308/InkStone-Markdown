<script setup lang="ts">
import { ref, onMounted, watch, defineEmits } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import CryptoJS from 'crypto-js'
import api from '@/utils/api'
import fs from '@/utils/fs'
import { useSettingsStore } from '@/stores'
import { computed } from 'vue'

const settingsStore = useSettingsStore()

const emit = defineEmits(['change:loading', 'change:tipLoad'])
const loading = ref(false)
const tipLoad = computed(() => !api.ready)

watch(
  () => loading.value,
  (value) => {
    emit('change:loading', value)
  },
  {
    immediate: true,
  },
)

watch(
  () => tipLoad.value,
  (value) => {
    emit('change:tipLoad', value)
  },
  {
    immediate: true,
  },
)

const isRotating = ref(false)
const messageInput = ref('')
const repoName = computed(() => settingsStore.settings.repoName)

enum FileAction {
  CREATE = 'create',
  UPDATE = 'update',
}
type DiffFiles = Array<[name: string, action: FileAction]>

type remoteTree = {
  sha: string
  url: string
  truncated: boolean
  tree: {
    path?: string
    mode?: string
    type?: string
    sha?: string
    size?: number
    url?: string
  }[]
}

const diff_files = ref<DiffFiles>([])
onMounted(() => {
  if (api.ready) {
    refreshDiffData()
  }
})

const calculateFileSha = async (filePath: string): Promise<string> => {
  const fileContent = await fs.get(filePath, repoName.value)
  const size = new TextEncoder().encode(fileContent).length
  const header = `blob ${size}\0`
  const store = header + fileContent

  const sha1 = CryptoJS.SHA1(CryptoJS.enc.Utf8.parse(store)).toString()
  return sha1
}

const refreshDiffData = async () => {
  loading.value = true
  const files: DiffFiles = []
  const remoteTree: remoteTree = await api.getRepoTree()
  const remoteItems: Record<string, string> = {}
  remoteTree.tree.forEach((item) => {
    if (item.path && item.sha) {
      remoteItems[item.path] = item.sha
    }
  })
  const localItems: string[] = await fs.list(repoName.value)
  for (const item of localItems) {
    if (remoteItems[item]) {
      const sha = await calculateFileSha(item)

      if (sha !== remoteItems[item]) {
        files.push([item, FileAction.UPDATE])
      }
    } else {
      files.push([item, FileAction.CREATE])
    }
  }
  diff_files.value = files
  loading.value = false

  gender_commit_message()
}

const refreshClicked = () => {
  isRotating.value = true
  refreshDiffData().then(() => {
    ElMessage({
      type: 'success',
      message: '刷新完成',
    })
    setTimeout(() => {
      isRotating.value = false
    }, 1000)
  })
}

const gender_commit_message = () => {
  let commitMessage = 'feat: Update blog articles\n\n'
  const changes: Record<string, Array<string>> = {
    create: [],
    delete: [],
    change: [],
  }

  diff_files.value.forEach(([filePath, action]) => {
    if (action === FileAction.CREATE) {
      changes.create.push(filePath)
    } else if (action === FileAction.UPDATE) {
      changes.change.push(filePath)
    }
  })

  if (changes.create.length > 0) {
    commitMessage += '- Add new articles:\n'
    changes.create.forEach((filePath) => {
      commitMessage += `  - ${filePath}\n`
    })
  }

  if (changes.delete.length > 0) {
    commitMessage += '- Delete outdated articles:\n'
    changes.delete.forEach((filePath) => {
      commitMessage += `  - ${filePath}\n`
    })
  }

  if (changes.change.length > 0) {
    commitMessage += '- Update articles:\n'
    changes.change.forEach((filePath) => {
      commitMessage += `  - ${filePath}\n`
    })
  }

  messageInput.value = commitMessage
}

const undo = (file: string | null = null) => {
  const all_files: string[] = []
  let undoFiles: string[] = []
  for (const i in diff_files.value) {
    all_files.push(diff_files.value[i][0])
  }

  if (!file) {
    undoFiles = all_files
  } else {
    if (all_files.indexOf(file) === -1) {
      ElMessage({
        type: 'error',
        message: 'File not found',
      })
      return
    } else {
      undoFiles = [file]
    }
  }

  ElMessageBox.confirm('此操作将删除本地更改且无法恢复，是否继续？', '警告-危险操作', {
    confirmButtonText: '确定',
    cancelButtonText: '取消，保留更改',
    type: 'warning',
  })
    .then(() => {
      undoFiles.forEach((f) => {
        fs.delete(f, repoName.value)
      })
      refreshDiffData()
      ElMessage({
        type: 'success',
        message: 'Delete completed',
      })
    })
    .catch((error) => {
      console.error(error)
      ElMessage({
        type: 'info',
        message: 'Delete canceled',
      })
    })
}

const commit = async () => {
  const message = messageInput.value
  if (!message) {
    ElMessage({
      type: 'error',
      message: 'Please input commit message',
    })
    return
  }

  loading.value = true

  const files: Array<{ path: string; content: string }> = []
  for (const file of diff_files.value) {
    const filePath = file[0]
    const fileContent = await fs.get(filePath, repoName.value)
    files.push({ path: filePath, content: fileContent })
  }

  api
    .commitChanges(files, message)
    .then(async () => {
      ElMessage({
        type: 'success',
        message: 'Commit success',
      })

      for (const path of files) {
        await fs.delete(path.path, repoName.value)
      }

      refreshDiffData()

      // 更新本地的sha
      loading.value = false
    })
    .catch((error) => {
      console.error(error)
      ElNotification({
        title: 'Error',
        message: '提交失败，发生错误！',
        type: 'error',
      })
      loading.value = false
    })
}
</script>
<template>
  <div class="differences-panel">
    <el-empty description="离线模式无法提交文件" v-if="tipLoad" />
    <div v-else>
      <div class="commit-box">
        <el-input
          v-model="messageInput"
          :autosize="{ minRows: 2, maxRows: 4 }"
          type="textarea"
          placeholder="commit message"
          clearable
        />
        <el-button type="primary" :disabled="diff_files.length <= 0" @click="commit"
          >提交</el-button
        >
      </div>
      <div class="operation-box">
        <div class="title">更改列表</div>
        <div>
          <el-tooltip class="box-item" effect="dark" content="刷新数据" placement="bottom"
            ><el-button link size="small" @click="refreshClicked">
              <font-awesome-icon
                style="margin-right: 15px"
                :icon="['fas', 'arrows-rotate']"
                size="lg"
                :class="{ 'rotate-animation': isRotating }"
              /> </el-button
          ></el-tooltip>
          <el-tooltip class="box-item" effect="dark" content="放弃所有更改" placement="bottom"
            ><el-button link size="small" @click="undo()"
              ><font-awesome-icon
                class="undo_all"
                :icon="['fas', 'rotate-left']"
                size="lg" /></el-button
          ></el-tooltip>
        </div>
      </div>
      <div class="diff-box">
        <div class="diff-item" v-for="file in diff_files" :key="file[0]">
          <div class="file-info">
            <span class="file-name">{{ file[0].split('/').pop() }}</span>
            <el-tooltip class="box-item" effect="dark" :content="file[0]" placement="right"
              ><span class="file-path">{{
                file[0].split('/').slice(0, -1).join('/')
              }}</span></el-tooltip
            >
          </div>
          <div class="others">
            <el-tooltip class="box-item" effect="dark" content="放弃更改" placement="bottom"
              ><el-button link size="small" @click="undo(file[0])">
                <font-awesome-icon
                  class="undo"
                  :icon="['fas', 'rotate-left']"
                  size="lg" /></el-button
            ></el-tooltip>

            <font-awesome-icon
              v-if="file[1] === FileAction.UPDATE"
              :icon="['fas', 'u']"
              :size="'xs'"
              style="color: var(--el-color-primary)"
            />
            <font-awesome-icon
              v-if="file[1] === FileAction.CREATE"
              :icon="['fas', 'n']"
              :size="'xs'"
              style="color: var(--el-color-success)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.commit-box,
.diff-box {
  display: flex;
  flex-direction: column;
  padding: 10px;
}

.operation-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;

  .undo_all {
    cursor: pointer;
    color: var(--el-color-secondary);
  }

  .title {
    font-size: 12px;
    font-weight: bold;
  }
}

.diff-box {
  overflow: auto;
  display: flex;
  flex-direction: column;
  height: calc(100% - 120px);

  .diff-item {
    padding: 3px;
    border-bottom: 0.5px solid #c9c9c9;
    white-space: nowrap; /* 确保内容不会换行 */
    display: flex;
    justify-content: space-between;
  }

  .file-name {
    font-weight: bold;
    font-size: 12px;
    margin-right: 3px;
  }

  .file-path {
    display: inline-block;
    font-size: 10px;
    color: #6f6f6f;
    overflow: hidden;
    width: 80px;
    text-overflow: ellipsis;
  }
  .others .undo {
    cursor: pointer;
    margin-right: 5px;
    display: none;
    color: var(--el-color-secondary);
  }

  .diff-item:hover .undo {
    display: inline-block;
  }
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.rotate-animation {
  animation: rotate 0.5s linear infinite;
}
</style>
