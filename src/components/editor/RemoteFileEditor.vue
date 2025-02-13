<script setup lang="ts">
import { ref, defineProps, Ref, onMounted, computed } from 'vue'
import CodemirrorEditor from './CodemirrorEditor.vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import api from '@/utils/api'
import Vditor from 'vditor'
import { useSettingsStore, useContexStore } from '@/stores'
import CommitHistory from './CommitHistory.vue'
import { storeToRefs } from 'pinia'

const contexStore = useContexStore()
const settingsStore = useSettingsStore()
const { tabs } = storeToRefs(contexStore)
const branch = computed(() => settingsStore.settings['基本配置'].repoBranch)

const ready: Ref<boolean> = ref(false)

const props = defineProps({
  // 对应在Contex中tabs的id
  id: {
    type: String,
    required: true,
  },
})

const file: Ref<null | remoteFile> = ref(null)
const fileName = ref('')
const isAllSaved = ref(true)
let path = ''
let tab: TabItem

const sha = ref<string>(branch.value)
const fileType = ref<string | null>(null)
const mdPreviewMode = ref(false)
const showHistoryDrawer = ref(false)

// 最大编辑区域宽度,这里用于Markdown预览
const MaxEditRegionWidth = settingsStore.settings['编辑器配置'].editorMaxWidth

const EditorInstanceRef = ref<InstanceType<typeof CodemirrorEditor> | null>(null)

const markdownPreview = ref<HTMLDivElement | null>(null)

onMounted(async () => {
  // 通过id获取当前tab的内容
  tab = tabs.value.find((tab) => tab.id === props.id) as TabItem
  const tabFile = tab?.data.file as remoteFile

  path = tabFile.path
  const ext = path.split('.').pop() as string
  fileType.value = ext === 'md' || ext === 'markdown' ? 'md' : ext
  sha.value = branch.value

  file.value = tabFile

  fileName.value = path.split('/').pop() as string
  console.log('onMounted')
})

const setContent = (content: string) => {
  EditorInstanceRef.value?.setContent(content, true)

  Vditor.preview(markdownPreview.value as HTMLDivElement, content, {
    speech: {
      enable: true,
    },
    anchor: 1,
    mode: 'dark',
  })
}

const updateContent = (newSha: string | null = null) => {
  sha.value = newSha || (branch.value as string)

  console.log(file.value?.content)
  if (sha.value === branch.value && file.value?.content) {
    setContent(file.value.content)
    ready.value = true
    return
  }

  console.log('sha', sha.value)
  showHistoryDrawer.value = false

  api.getFileContent(path, sha.value).then((res) => {
    ;(tab?.data.file as remoteFile).content = res.decodedContent
    setContent(res.decodedContent)

    if (sha.value === branch.value) {
      if (file.value) {
        file.value.content = res.decodedContent
      }
    }

    ready.value = true
  })
}

const editorReady = async () => {
  console.log('editor ready')
  updateContent()
}
</script>

<template>
  <div class="remote-file-editor file-editor">
    <div class="operation-bar">
      <div class="preview" v-if="fileType === 'md'">
        <div v-if="mdPreviewMode">
          <el-tooltip class="box-item" effect="dark" content="预览Markdown" placement="bottom">
            <el-button
              type="primary"
              size="small"
              :disabled="fileType !== 'md'"
              @click="mdPreviewMode = false"
            >
              <font-awesome-icon :icon="['fas', 'code']"
            /></el-button>
          </el-tooltip>
        </div>
        <div v-else>
          <el-tooltip class="box-item" effect="dark" content="预览Markdown" placement="bottom">
            <el-button
              type="primary"
              size="small"
              :disabled="fileType !== 'md'"
              @click="mdPreviewMode = true"
              ><font-awesome-icon :icon="['fas', 'magnifying-glass']" /></el-button
          ></el-tooltip>
        </div>
      </div>
      <div class="history">
        <el-tooltip class="box-item" effect="dark" content="查看文件提交历史" placement="bottom"
          ><el-button type="primary" size="small" @click="showHistoryDrawer = true"
            ><font-awesome-icon :icon="['fas', 'code-commit']"
          /></el-button>
        </el-tooltip>
      </div>
      <div class="currentState">
        <el-tooltip class="box-item" effect="dark" content="当前版本" placement="bottom"
          ><el-button
            type="primary"
            size="small"
            :disabled="branch === sha"
            @click="() => updateContent()"
            ><font-awesome-icon :icon="['fas', 'house-circle-check']" />
          </el-button>
        </el-tooltip>
      </div>
    </div>
    <div class="markdown-preview" v-show="mdPreviewMode">
      <div
        class="markdown-preview-inner"
        :style="{ maxWidth: MaxEditRegionWidth.toString() + 'px' }"
        ref="markdownPreview"
      ></div>
    </div>
    <CodemirrorEditor
      v-if="file"
      class="editor"
      ref="EditorInstanceRef"
      v-show="!mdPreviewMode && ready"
      :editor="id"
      :file-name="fileName"
      v-model="isAllSaved"
      :editorReady="editorReady"
      :read-only="true"
    />
    <el-skeleton
      :rows="7"
      animated
      v-if="!ready"
      style="margin: auto; max-width: 800px; padding: 40px"
    />
    <el-drawer
      modal-class="history-drawer"
      v-model="showHistoryDrawer"
      title="提交历史"
      direction="rtl"
      size="100%"
    >
      <CommitHistory :path="path" @change-sha="updateContent" />
    </el-drawer>
  </div>
</template>

<style scoped lang="scss">
.remote-file-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .editor {
    width: 100%;
    height: 100%;
  }
}

.operation-bar {
  position: fixed;
  width: 80px;
  height: 24px;
  top: 60px;
  right: 60px;

  display: flex;
  gap: 2px;
  z-index: 5;
}

.markdown-preview {
  width: 100%;
  height: 100%;
  overflow: auto;

  display: flex;
  justify-content: center;
}

.markdown-preview-inner {
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
.has-titlebar {
  .history-drawer {
    top: env(titlebar-area-height, 33px) !important;
  }
}
</style>
