<script setup lang="ts">
import { Ref, ref } from "vue";
import api from "@/utils/api";
import { useGlobalStore, useTabsStore } from "@/stores";

const globalStore = useGlobalStore();
const tabsStore = useTabsStore();

const loading = ref(false);

const keywords = ref("");

const searchResults: Ref<Array<any>> = ref([]);

const handleSearch = async () => {
  if (!keywords.value) {
    return;
  }
  loading.value = true;

  searchResults.value = await api.searchFiles(keywords.value);

  // 定时1秒后取消loading
  setTimeout(() => {
    loading.value = false;
  }, 1000);
};
</script>

<template>
  <div class="file-tree-box">
    <div class="title-bar">
      <div class="title">搜索</div>
      <div class="actions">
        <el-button
          circle
          @click="handleSearch"
          :disabled="!keywords"
          title="刷新结果"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', 'arrows-rotate']" size="lg" />
          </template>
        </el-button>
      </div>
    </div>
    <div v-if="api.ready">
      <el-input
        v-model="keywords"
        style="width: 100%"
        clearable
        :autosize="{ minRows: 1, maxRows: 5 }"
        placeholder="搜索"
        @change="handleSearch"
      />
      <div class="inner-box" v-loading="loading">
        <div v-if="searchResults.length > 0">
          <div
            class="result-item"
            v-for="node in searchResults"
            @click="tabsStore.openRemoteFile(node.path)"
          >
            <el-tooltip
              effect="dark"
              :content="node.path"
              placement="right-start"
            >
              <span>
                <span class="title">{{ node.name }}</span>
                <div class="path">{{ node.path }}</div>
              </span>
            </el-tooltip>
          </div>
        </div>
        <div v-else>
          <el-empty description="无搜索结果" />
        </div>
      </div>
    </div>
    <div class="no-login-tip" v-else>
      登录后可使用完整功能
      <el-button type="primary" size="small" round @click="globalStore.goLogin"
        >登录</el-button
      >
    </div>
    <el-empty description="离线模式无法搜索远程文件" v-if="!api.ready" />
  </div>
</template>

<style scoped>
.file-tree-box {
  height: 100%;
}

.title-bar {
  padding: 10px;
  height: 40px;
  white-space: nowrap; /* 确保内容不会换行 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 5px;
}

.title-bar .title {
  font-size: 16px;
  font-weight: bold;
}

.title-bar .actions {
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: end;
  align-items: center;
}

.inner-box {
  height: calc(100vh - 72px);
  overflow: auto;
  padding: 10px;
}

.result-item {
  display: flex;
  flex-direction: row;
  white-space: nowrap;
  gap: 10px; /* 子元素之间的间距 */
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: var(--el-border-color) 1px solid;
}

.result-item:hover {
  color: var(--el-color-primary);
}

.result-item .title {
  font-size: 14px;
  font-weight: bold;
  margin-right: 10px;
}

.result-item .path {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
