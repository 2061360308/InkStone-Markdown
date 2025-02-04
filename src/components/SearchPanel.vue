<script setup lang="ts">
import { Ref, ref } from 'vue'
import api from '@/utils/api'
import { useTabsStore } from '@/stores'
import { watch } from 'vue'

const tabsStore = useTabsStore()

const loading = ref(false)

const emit = defineEmits(['change:loading'])
watch(
  () => loading.value,
  (value) => {
    emit('change:loading', value)
  },
)

const keywords = ref('')

const searchResults: Ref<Array<{ name: string; path: string }>> = ref([])

const refresh = async () => {
  if (!keywords.value) {
    return
  }
  loading.value = true

  searchResults.value = await api.searchFiles(keywords.value)

  // 定时1秒后取消loading
  setTimeout(() => {
    loading.value = false
  }, 1000)
}

defineExpose({
  refresh,
})
</script>
<template>
  <div v-if="api.ready" class="search-panel">
    <el-input
      v-model="keywords"
      style="width: 100%"
      clearable
      :autosize="{ minRows: 1, maxRows: 5 }"
      placeholder="搜索"
      @change="refresh"
    />
    <div class="inner-box" v-loading="loading">
      <div v-if="searchResults.length > 0">
        <div
          class="result-item"
          v-for="node in searchResults"
          @click="tabsStore.openRemoteFile(node.path)"
          :key="node.path"
        >
          <el-tooltip effect="dark" :content="node.path" placement="right-start">
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
</template>
