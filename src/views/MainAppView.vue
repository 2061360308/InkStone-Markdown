<script setup lang="ts">
import { Ref, ref } from 'vue'

const titleBarVisible = ref(false)

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

const notificationVisible = ref(true)

// Menu enum
enum Menu {
  Null = '',
  Files = 'files',
  Editing = 'editing',
  Search = 'search',
  Changes = 'changes',
  About = 'about',
  Settings = 'settings',
}

const activeMenu = ref<Menu>(Menu.Files)

const handleMenuSelect = (index: string) => {
  // Set the active menu
  switch (index) {
    case Menu.Files:
      activeMenu.value = Menu.Files
      break
    case Menu.Editing:
      activeMenu.value = Menu.Editing
      break
    case Menu.Search:
      activeMenu.value = Menu.Search
      break
    case Menu.Changes:
      activeMenu.value = Menu.Changes
      break
    case Menu.About:
      // aboutDialogVisible.value = true;
      break
    case Menu.Settings:
      break
  }
}

const sidebarPanelVisible: Ref<boolean> = ref(false)
const sidebarPanelFixed: Ref<boolean> = ref(false)
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
    <div class="notification"></div>
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
          <el-menu-item :index="Menu.Files">
            <font-awesome-icon :icon="['fas', 'file']" size="2xl" />
          </el-menu-item>
          <el-menu-item :index="Menu.Editing">
            <font-awesome-icon :icon="['fas', 'inbox']" size="2xl" />
          </el-menu-item>
          <el-menu-item :index="Menu.Search">
            <font-awesome-icon :icon="['fas', 'magnifying-glass']" size="2xl" />
          </el-menu-item>
          <el-menu-item :index="Menu.Changes">
            <font-awesome-icon :icon="['fas', 'code-branch']" size="2xl" />
          </el-menu-item>
        </div>
        <div class="items-bottom">
          <el-menu-item :index="Menu.About">
            <font-awesome-icon :icon="['fas', 'circle-question']" size="2xl" />
          </el-menu-item>
          <el-menu-item :index="Menu.Settings">
            <font-awesome-icon :icon="['fas', 'gear']" size="2xl" />
          </el-menu-item>
        </div>
      </el-menu>
      <el-drawer
        :modal-class="titleBarVisible ? 'sidebar-drawer-hastitlebar' : 'sidebar-drawer'"
        v-model="sidebarDrawerVisible"
        title="I am the title"
        direction="ltr"
        :size="350"
        :modal="false"
        @mouseleave="sidebarMenuMouseLeave"
      ></el-drawer>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main-application {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background-color: #f5f5f5;

  .title-bar {
    background-color: antiquewhite;
    height: env(titlebar-area-height, 33px);
  }

  .main-container {
    height: 100%;
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
</style>

<style lang="scss">
.sidebar-drawer {
  left: $sidebar-menu-w !important;
  box-shadow: none;

  .el-drawer.ltr {
    border-radius: 0 10px 10px 0;
    box-shadow: none;
  }
}

.sidebar-drawer-hastitlebar {
  top: env(titlebar-area-height, 33px) !important;
  left: $sidebar-menu-w !important;

  .el-drawer.ltr {
    border-radius: 0 10px 10px 0;
    box-shadow: none;
  }
}
</style>
