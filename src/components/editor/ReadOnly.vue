<script setup lang="ts">
import { ref, defineProps, watch } from "vue";
import CodemirrorEditor from "./CodemirrorEditor.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import api from "@/utils/api";
import Vditor from "vditor";
import { useSettingsStore } from "@/stores";
import CommitHistory from "./CommitHistory.vue";
// import { watch } from "fs";

const props = defineProps({
  path: {
    type: String,
    required: true,
  },
});

const sha = ref<string>(props.path);

const settingsStore = useSettingsStore();

let content: string | null = null;
const fileType = ref<string | null>(null);
const mdPreviewMode = ref(false);
const showHistoryDrawer = ref(false);

// 最大编辑区域宽度,这里用于Markdown预览
const MaxEditRegionWidth = settingsStore.settings["编辑器配置"].editorMaxWidth;

const codemirrorEditor = ref<InstanceType<typeof CodemirrorEditor> | null>(
  null
);

const markdownPreview = ref<HTMLDivElement | null>(null);

const showCurrentVersion = async () => {
  if (!props.path) {
    return;
  }

  sha.value = props.path;

  fileType.value = props.path.split(".").pop()?.toLowerCase() || "";

  const res = await api.getFileContent(props.path);
  if (res && codemirrorEditor.value) {
    content = res.decodedContent;
    codemirrorEditor.value.setEditorContent(res.decodedContent);

    if (!markdownPreview.value || fileType.value !== "md") {
      return;
    }

    Vditor.preview(markdownPreview.value, content, {
      speech: {
        enable: true,
      },
      anchor: 1,
      mode: "dark",
    });
  }
};

watch(
  () => props.path,
  async (newPath) => {
    showCurrentVersion();
  },
  { immediate: true }
);

const changeSha = (newSha: string) => {
  sha.value = newSha;
  showHistoryDrawer.value = false;

  if (newSha) {
    api.getFileContent(props.path, newSha).then((res) => {
      if (res && codemirrorEditor.value) {
        content = res.decodedContent;
        codemirrorEditor.value.setEditorContent(res.decodedContent);

        if (!markdownPreview.value || fileType.value !== "md") {
          return;
        }

        Vditor.preview(markdownPreview.value, content, {
          speech: {
            enable: true,
          },
          anchor: 1,
          mode: "dark",
        });
      }
    });
  }
};
</script>

<template>
  <div class="editor-box">
    <div class="operation-bar">
      <div class="preview" v-if="fileType === 'md'">
        <div v-if="mdPreviewMode">
          <el-tooltip
            class="box-item"
            effect="dark"
            content="预览Markdown"
            placement="top"
          >
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
          <el-tooltip
            class="box-item"
            effect="dark"
            content="预览Markdown"
            placement="top"
          >
            <el-button
              type="primary"
              size="small"
              :disabled="fileType !== 'md'"
              @click="mdPreviewMode = true"
              ><font-awesome-icon
                :icon="['fas', 'magnifying-glass']" /></el-button
          ></el-tooltip>
        </div>
      </div>
      <div class="history">
        <el-tooltip
          class="box-item"
          effect="dark"
          content="查看文件提交历史"
          placement="top"
          ><el-button
            type="primary"
            size="small"
            @click="showHistoryDrawer = true"
            ><font-awesome-icon :icon="['fas', 'code-commit']"
          /></el-button>
        </el-tooltip>
      </div>
      <div class="currentState">
        <el-tooltip
          class="box-item"
          effect="dark"
          content="当前版本"
          placement="top"
          ><el-button
            type="primary"
            size="small"
            :disabled="path === sha"
            @click="showCurrentVersion"
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
      :read-only="true"
      ref="codemirrorEditor"
      v-show="!mdPreviewMode"
    />
    <el-drawer v-model="showHistoryDrawer" title="提交历史" direction="rtl">
      <CommitHistory :path="path" @change-sha="changeSha" />
    </el-drawer>
  </div>
</template>

<style scoped>
.editor-box {
  width: 100%;
  height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
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
