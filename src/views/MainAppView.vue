<script setup lang="ts">
import { Ref, ref } from 'vue'
import { useContexStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import { PanelIconPosition } from '@/panels/base'
import panelsManager from '@/panels'
import SidebarPanel from '@/components/SidebarPanel.vue'
const contexStore = useContexStore()

const { sidebarState } = storeToRefs(contexStore)

const titleBarVisible = ref(false)

/**
 *    标题栏
 */

// 防止标题栏覆盖检测函数频繁触发
const debounce = <F extends (...args: unknown[]) => unknown>(func: F, wait: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return function executedFunction(...args: Parameters<F>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

// 扩展 Navigator 类型声明
declare global {
  interface Navigator {
    windowControlsOverlay?: WindowControlsOverlay
  }

  interface WindowControlsOverlay extends EventTarget {
    visible: boolean
    titlebarAreaRect: DOMRect
  }
}

if ('windowControlsOverlay' in navigator) {
  const overlay = navigator.windowControlsOverlay
  overlay?.addEventListener(
    'geometrychange',
    debounce(() => {
      // 从 overlay 对象而非事件参数中获取数据
      // const isOverlayVisible = overlay.visible;
      // const titleBarRect = overlay.titlebarAreaRect;

      // console.log(
      //   `The overlay is ${isOverlayVisible ? 'visible' : 'hidden'},` +
      //   `the title bar width is ${titleBarRect.width}px`
      // );
      titleBarVisible.value = overlay.visible
    }, 200),
  )
}

/**
 *    左侧边栏
 */

const notificationVisible: Ref<boolean> = ref(contexStore.notification.data.length > 0)

const activeMenu = ref('')
const topMenuItems = computed(() =>
  panelsManager
    .getAllPanels()
    .filter((panel) => panel.position === PanelIconPosition.top)
    .sort((a, b) => a.index - b.index),
)

const bottomMenuItems = computed(() =>
  panelsManager
    .getAllPanels()
    .filter((panel) => panel.position === PanelIconPosition.bottom)
    .sort((a, b) => a.index - b.index),
)

const closeSideBarPanel = () => {
  /**
   * 直接关闭侧边栏，会导致主面板闪烁
   * 这里设计动画先将侧边栏尺寸缓慢减小至 0，然后关闭侧边栏
   * 最后恢复原始尺寸记录，以便下次打开侧边栏时恢复原始尺寸
   */
  const duration = 30 // 动画持续时间，单位为毫秒
  const startSize = sidebarState.value.size
  const startTime = performance.now()

  const animate = (currentTime: number) => {
    const elapsedTime = currentTime - startTime
    const progress = Math.min(elapsedTime / duration, 1)
    contexStore.sidebarState.size = startSize * (1 - progress)

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      contexStore.sidebarState.size = 0

      // 恢复原始尺寸
      // 虽然快速点击会导致置零的情况，这里不做考虑
      setTimeout(() => {
        sidebarState.value.opened = false
        contexStore.sidebarState.size = startSize
      }, 300)
    }
  }

  requestAnimationFrame(animate)
}

const unpinSideBarPanel = () => {
  const duration = 30 // 动画持续时间，单位为毫秒
  const startSize = sidebarState.value.size
  const startTime = performance.now()

  const animate = (currentTime: number) => {
    const elapsedTime = currentTime - startTime
    const progress = Math.min(elapsedTime / duration, 1)
    contexStore.sidebarState.size = startSize * (1 - progress)

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      contexStore.sidebarState.size = 0

      // 恢复原始尺寸
      // 虽然快速点击会导致置零的情况，这里不做考虑
      setTimeout(() => {
        sidebarState.value.fixed = false
        contexStore.sidebarState.size = startSize
      }, 300)
    }
  }

  requestAnimationFrame(animate)
}

const handleMenuSelect = (index: string) => {
  // Set the active menu
  if (sidebarPanelFixed.value) {
    console.log('index::', index, activeMenu.value, index === activeMenu.value)
    if (index === activeMenu.value) {
      activeMenu.value = ''
      closeSideBarPanel()
    } else {
      contexStore.sidebarState.opened = true
      activeMenu.value = index
    }
    console.log('sidebarPanelFixed', contexStore.sidebarState.opened)
  }
  panelsManager.activePanel(index)
}

const handelPinButton = () => {
  if (sidebarPanelFixed.value) {
    unpinSideBarPanel()
  } else {
    contexStore.sidebarState.fixed = true
  }
}

const sidebarPanelVisible = computed(() => sidebarState.value.opened)
const sidebarPanelFixed = computed(() => sidebarState.value.fixed)
const sidebarPanelSize = computed(() => sidebarState.value.size)
const sidebarDrawerVisible: Ref<boolean> = ref(false)

let menuBarEnter: boolean = false

const sidebarMenuMouseEnter = () => {
  if (sidebarPanelFixed.value) return

  menuBarEnter = true
  sidebarDrawerVisible.value = true
}

const sidebarMenuMouseLeave = () => {
  if (sidebarPanelFixed.value) return

  setTimeout(() => {
    if (!menuBarEnter) {
      sidebarDrawerVisible.value = false
    }
  }, 200)
}
</script>

<template>
  <div class="main-application">
    <div class="title-bar" v-if="titleBarVisible"></div>
    <div class="notification" v-if="notificationVisible"></div>
    <div class="main-container">
      <el-menu
        class="sidebar-menu"
        :default-active="activeMenu"
        :collapse="true"
        @select="handleMenuSelect"
        @mouseenter="sidebarMenuMouseEnter"
        @mouseleave="menuBarEnter = false"
      >
        <div class="items-top">
          <el-menu-item v-for="item in topMenuItems" :index="item.id" :key="item.id">
            <font-awesome-icon :icon="['fas', item.icon]" size="2xl" />
          </el-menu-item>
        </div>
        <div class="items-bottom">
          <el-menu-item v-for="item in bottomMenuItems" :index="item.id" :key="item.id">
            <font-awesome-icon :icon="['fas', item.icon]" size="2xl" />
          </el-menu-item>
        </div>
      </el-menu>
      <el-drawer
        :modal-class="titleBarVisible ? 'sidebar-drawer-hastitlebar' : 'sidebar-drawer'"
        v-model="sidebarDrawerVisible"
        direction="ltr"
        :with-header="false"
        :size="350"
        :modal="false"
        @mouseleave="sidebarMenuMouseLeave"
        v-if="!sidebarPanelFixed"
      >
        <SidebarPanel @update:pin="handelPinButton" />
      </el-drawer>
      <splitpanes style="width: 100%; height: 100%" @resize="sidebarState.size = $event[0].size">
        <pane v-if="sidebarPanelFixed && sidebarPanelVisible" :size="sidebarPanelSize">
          <SidebarPanel @update:pin="handelPinButton" />
        </pane>
        <pane :size="100 - sidebarPanelSize">
          <div style="background-color: aquamarine; height: 100%; width: 100%">你好</div>
        </pane>
      </splitpanes>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main-application {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;

  .title-bar {
    background-color: antiquewhite;
    height: env(titlebar-area-height, 33px);
  }

  .main-container {
    height: 100%;
    display: flex;
  }
}

.sidebar-menu {
  width: $sidebar-menu-w;
  height: 100%;
  display: flex;
  justify-content: space-between;
  justify-items: center;
  flex-direction: column;
}

.splitpanes {
  // width: calc(100% - 54px);
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
.sidebar-drawer {
  left: $sidebar-menu-w !important;
  box-shadow: none;

  .el-drawer.ltr {
    border-radius: 0 10px 10px 0;
    box-shadow: none;

    .el-drawer__body {
      padding: 0;
    }
  }
}

.sidebar-drawer-hastitlebar {
  top: env(titlebar-area-height, 33px) !important;
  left: $sidebar-menu-w !important;
  padding: 0;

  .el-drawer.ltr {
    border-radius: 0 10px 10px 0;
    box-shadow: none;

    .el-drawer__body {
      padding: 0;
    }
  }
}
</style>
