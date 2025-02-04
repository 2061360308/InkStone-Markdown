<script setup lang="ts">
import { ref, defineAsyncComponent, ComponentPublicInstance, defineEmits } from 'vue'
import { useContexStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import panelsManager from '@/panels'
import { watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const emits = defineEmits(['update:pin'])

const contexStore = useContexStore()
const { sidebarState } = storeToRefs(contexStore)

/**
 *  动态加载面板组件
 */
const panel = computed(() => panelsManager.getPanel(sidebarState.value.current))
const title = computed(() => panel.value?.name || '')
const actions = computed(() => panel.value?.actions || [])

const component = computed(() => {
  if (panel.value?.component) {
    return defineAsyncComponent({
      loader: panel.value.component,
      loadingComponent: {
        template: '<div>Loading...</div>',
      },
      errorComponent: {
        template: '<div>Failed to load component</div>',
      },
      delay: 200,
    })
  }
  return null
})

watch(
  () => sidebarState.value.current,
  () => {
    // 切换面板需要重置loading和tipLoad状态
    loading.value = false
    tipLoad.value = false
  },
)

const ContentComponentRef = ref<ComponentPublicInstance | null>(null)

const handleActionButton = (method: string): void => {
  const component = ContentComponentRef.value as { [key: string]: () => void } | null

  if (component && typeof component[method] === 'function') {
    component[method]()
  }
}

const pinButtonClicked = () => {
  emits('update:pin')
}

/**
 *  给组件提供的控制面板的状态
 */

const loading = ref(false) // 加载状态
const tipLoad = ref(false) // 登录提示

const changeLoading = (value: boolean) => {
  loading.value = value
}

const changeTipLoad = (value: boolean) => {
  tipLoad.value = value
}

const goLogin = async () => {
  localStorage.removeItem('jumpLogin') // 清除跳过登录标记
  router.replace({ name: 'login' })
}

/**
 *   完成验证
 *   1. 验证登录情况
 *   2. 同步设置项
 */

const ready = computed(() => sidebarState.value.ready)
</script>

<template>
  <div class="sidebar-panel" v-loading="loading">
    <div class="title-bar">
      <div class="title">{{ title }}</div>
      <div class="actions">
        <el-button
          link
          v-for="action in actions"
          :key="action.name"
          @click="handleActionButton(action.method)"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', action.icon]" size="lg" />
          </template>
        </el-button>
        <el-button link @click="pinButtonClicked">
          <template #icon>
            <font-awesome-icon
              v-show="sidebarState.fixed"
              :icon="['fas', 'thumbtack-slash']"
              size="lg"
            />
            <font-awesome-icon
              v-show="!sidebarState.fixed"
              :icon="['fas', 'thumbtack']"
              size="lg"
            />
          </template>
        </el-button>
      </div>
    </div>

    <div class="no-login-tip" v-if="tipLoad">
      登录后可使用完整功能
      <el-button type="primary" size="small" round @click="goLogin">登录</el-button>
    </div>

    <div :class="[tipLoad ? 'tip-load' : '', 'content']">
      <component
        v-if="ready"
        @change:loading="changeLoading"
        @change:tipLoad="changeTipLoad"
        :is="component"
        ref="ContentComponentRef"
      />
      <div v-else style="height: 100%">
        <el-skeleton :rows="5" animated />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.sidebar-panel {
  width: 100%;
  height: 100%;
  min-width: 300px;
  overflow-y: hidden;

  .content {
    width: 100%;
    height: calc(100% - 40px);
    padding: 10px;
    overflow: auto;
  }

  .content.tip-load {
    height: calc(100% - 100px);
  }
}

.title-bar {
  padding: 10px;
  height: 40px;
  white-space: nowrap; /* 确保内容不会换行 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 5px;

  .title {
    font-size: 16px;
    font-weight: bold;
  }

  .actions {
    padding: 0;
    margin: 0;
    display: flex;
    justify-content: end;
    align-items: center;
  }
}
</style>
