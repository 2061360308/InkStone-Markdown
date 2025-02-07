<script setup lang="ts">
import { Ref, ref, onMounted } from 'vue'
import { useContexStore, useSettingsStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { Splitpanes, Pane } from 'splitpanes'
import { PanelIconPosition } from '@/panels/base'
import panelsManager from '@/panels'
import SidebarPanel from '@/components/SidebarPanel.vue'
import { decryptToken } from '@/utils/general'
import { validateLogin } from '@/utils/general'
import api from '@/utils/api'
import {
  ContextMenu,
  ContextMenuGroup,
  ContextMenuSeparator,
  ContextMenuItem,
} from '@imengyu/vue3-context-menu'
import { useDark } from '@vueuse/core'

const contexStore = useContexStore()
const settingsStore = useSettingsStore()

const { sidebarState } = storeToRefs(contexStore)

const titleBarVisible = ref(false)

/**
 *    标题栏
 */

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

const titleBarCheck = () => {
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

  if ('windowControlsOverlay' in navigator) {
    const overlay = navigator.windowControlsOverlay
    titleBarVisible.value = overlay?.visible || false // 立即同步一次
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

    const themeColorName = '--app-titlebar-color'
    const pollCSSVariable = (name: string, interval: number, callback: (value: string) => void) => {
      const getCSSVariable = (name: string) => {
        const rootStyles = getComputedStyle(document.documentElement)
        return rootStyles.getPropertyValue(name).trim()
      }

      let previousValue = getCSSVariable(name)
      callback(previousValue)
      setInterval(() => {
        const currentValue = getCSSVariable(name)
        if (currentValue !== previousValue) {
          callback(currentValue)
          previousValue = currentValue
        }
      }, interval)
    }

    const themeColorMetaTag = document.querySelector('meta[name="theme-color"]')
    pollCSSVariable(themeColorName, 2000, (value) => {
      console.log('CSS Variable --app-titlebar-color changed to', value)
      ;(themeColorMetaTag as HTMLElement).setAttribute('content', value)
    })
  } else {
    console.warn('navigator.windowControlsOverlay is not supported')
    titleBarVisible.value = false
  }
}

const menuVisible = ref(false)
const optionsComponent = ref({
  x: 500,
  y: 200,
})

const onFileMenu = (event: { preventDefault: () => void; clientX: number; clientY: number }) => {
  console.log('onFileMenu', event)
  event.preventDefault()

  optionsComponent.value = {
    x: event.clientX,
    y: event.clientY,
  }
  menuVisible.value = !menuVisible.value
}

/**
 *    左侧边栏
 */

const notificationVisible: Ref<boolean> = ref(contexStore.notification.data.length > 0)

const activeMenu = ref(contexStore.sidebarState.current)

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
  if (sidebarPanelFixed.value && !panelsManager.getPanel(index)?.noselect) {
    if (index === activeMenu.value) {
      activeMenu.value = ''
      closeSideBarPanel()
    } else {
      contexStore.sidebarState.opened = true
      activeMenu.value = index
    }
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

/**
 *   主工作区
 */

const truncateTitle = (title: string) => {
  const maxLength = 10 // 设置最大字符长度
  if (title.length > maxLength) {
    return title.substring(0, maxLength) + '...'
  }
  return title
}

/**
 *   验证本地token信息
 */

const validate = async () => {
  if (api.ready) {
    contexStore.sidebarState.ready = true
    console.log('API已经准备好了，无需进行验证')
    return
  }

  const start_time = Date.now()

  const access_token = decryptToken(localStorage.getItem('access_token') || '')

  // 如果存在 access_token,进行验证
  if (access_token) {
    const { tokenValid, repoValid, hasPushAccess, branchValid, installedApp } = await validateLogin(
      access_token,
      settingsStore.settings['基本配置'].repoName,
      settingsStore.settings['基本配置'].repoBranch,
    )
    if (tokenValid && repoValid && hasPushAccess && branchValid) {
      // 判断登录方式，如果是通过GithubApp自动登录的，需要验证是否安装应用
      const loginMethodValue = localStorage.getItem('loginMethod')
      if (loginMethodValue === 'github' && !installedApp) {
        localStorage.removeItem('access_token')
      }
    } else {
      // 验证失败，清除本地token
      localStorage.removeItem('access_token')
    }
  }

  console.log('验证完成, 耗时：', Date.now() - start_time)

  // 置sidebarPanel的ready为true，让其开始挂载面板组件
  contexStore.sidebarState.ready = true
}

onMounted(() => {
  titleBarCheck()
  validate()
})

const isDark = useDark()
</script>

<template>
  <div class="main-application">
    <div class="title-bar" v-if="titleBarVisible">
      <div class="logo">
        <el-image src="/favicon.ico" alt="logo" class="logo-img" />
      </div>
      <span class="title">砚台 Inkstone</span>
      <div class="bar-menu" @click="onFileMenu">文件</div>
      <div class="opened-file-tip">这是打开的文件</div>
      <context-menu v-model:show="menuVisible" :options="optionsComponent">
        <context-menu-group label="新建" icon="fas fa-plus">
          <context-menu-item label="新建文章" :clickClose="true" data-filetype="post">
            <template #icon>
              <font-awesome-icon :icon="['fas', 'square-pen']" />
            </template>
          </context-menu-item>
          <context-menu-item label="新建草稿" :clickClose="true" data-filetype="draft">
            <template #icon>
              <font-awesome-icon :icon="['fas', 'pen-ruler']" />
            </template>
          </context-menu-item>

          <ContextMenuSeparator />

          <context-menu-item label="文件" :clickClose="true" data-filetype="file">
            <template #icon>
              <font-awesome-icon :icon="['fas', 'file']" />
            </template>
          </context-menu-item>
        </context-menu-group>

        <context-menu-item label="重命名" :clickClose="false">
          <template #icon>
            <font-awesome-icon :icon="['fas', 'i-cursor']" />
          </template>
        </context-menu-item>
        <context-menu-item label="复制" :clickClose="false">
          <template #icon> <font-awesome-icon :icon="['fas', 'copy']" /> </template
        ></context-menu-item>
        <context-menu-item label="删除" :clickClose="false">
          <template #icon>
            <font-awesome-icon :icon="['fas', 'trash']" style="color: var(--el-color-danger)" />
          </template>
        </context-menu-item>
      </context-menu>
    </div>
    <div class="notification" v-if="notificationVisible"></div>
    <div :class="[titleBarVisible ? 'has-titlebar' : '', 'main-container']">
      <div
        class="sidebar-menu"
        @mouseenter="sidebarMenuMouseEnter"
        @mouseleave="menuBarEnter = false"
      >
        <div class="items-top items-box">
          <div
            v-for="item in topMenuItems"
            :index="item.id"
            :key="item.id"
            :class="{ active: item.id === activeMenu, item: true, noselect: item.noselect }"
            @click="handleMenuSelect(item.id)"
          >
            <font-awesome-icon :icon="['fas', item.icon]" size="2xl" />
          </div>
        </div>
        <div class="items-bottom items-box">
          <div class="item noselect">
            <el-switch
              v-model="isDark"
              style="--el-switch-on-color: var(--el-fill-color)"
              class="theme-switch"
            >
              <template #active-action>
                <font-awesome-icon :icon="['fas', 'moon']" />
              </template>
              <template #inactive-action>
                <font-awesome-icon :icon="['fas', 'sun']" />
              </template>
            </el-switch>
          </div>
          <div
            v-for="item in bottomMenuItems"
            :index="item.id"
            :key="item.id"
            :class="{ active: item.id === activeMenu, item: true, noselect: item.noselect }"
            @click="handleMenuSelect(item.id)"
          >
            <font-awesome-icon :icon="['fas', item.icon]" size="2xl" />
          </div>
        </div>
      </div>
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
          <SidebarPanel @update:pin="handelPinButton" style="width: 100%; height: 100%" />
        </pane>
        <pane :size="100 - sidebarPanelSize">
          <div class="workspace">
            <el-tabs
              v-model="contexStore.activeTabId"
              type="card"
              closable
              @tab-remove="(name) => contexStore.removeTab(name as string)"
              class="el-tabs"
              v-if="contexStore.tabs.length > 0"
            >
              <el-tab-pane
                v-for="item in contexStore.tabs"
                :key="item.id"
                :name="item.id"
                class="tab-pane"
              >
                <template #label>
                  <span
                    :class="{
                      'panel-tab': true,
                      native: item.panel === 'nativeFile',
                      remote: item.panel === 'remoteFile',
                    }"
                  >
                    <font-awesome-icon :icon="['fas', item.icon]" style="padding-right: 2px" />
                    <el-tooltip
                      :class="{ 'panel-tab': true, native: item.panel === 'nativeFile' }"
                      effect="dark"
                      :content="item.title.value"
                      placement="bottom-start"
                      >{{ truncateTitle(item.title.value) }}</el-tooltip
                    >
                  </span>
                </template>

                <component :is="panelsManager.getPanelComponent(item.panel)" :id="item.id" />
              </el-tab-pane>
            </el-tabs>
            <div class="empty-box" v-else>
              <div class="cover-image"></div>
              <div class="tip-content"><span>请在左侧文件管理器中选择文件打开</span></div>
              <!-- <el-empty image="cover.png" :image-size="550">
                <template #description>

                </template>
              </el-empty> -->
            </div>
          </div>
        </pane>
      </splitpanes>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main-application {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .title-bar {
    padding: 0 10px;
    height: env(titlebar-area-height, 33px);
    width: env(titlebar-area-width, 100%);
    -webkit-app-region: drag;
    display: flex;
    gap: 10px;
    justify-content: left;
    align-items: center;
    white-space: nowrap;
    background-color: var(--app-titlebar-color);

    .logo-img {
      width: env(titlebar-area-height, 33px);
      height: env(titlebar-area-height, 33px);
      border-radius: 50%;
    }

    .title {
      font-size: 18px;
      font-weight: bold;
    }

    .bar-menu {
      padding: 4px 6px;
      border-radius: 4px;
      -webkit-app-region: no-drag;
    }

    .bar-menu:hover {
      background-color: var(--el-color-primary-light-8);
    }

    .opened-file-tip {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      z-index: 1;
      margin: auto;
    }
  }

  .main-container {
    width: calc(100% - 50px);
    height: 100%;
    display: flex;
  }

  .main-container.has-titlebar {
    height: calc(100% - env(titlebar-area-height, 33px));
  }
}

.sidebar-menu {
  width: $sidebar-menu-w;
  height: 100%;
  display: flex;
  justify-content: space-between;
  justify-items: center;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color);

  .items-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .item {
    width: $sidebar-menu-w;
    height: $sidebar-menu-w;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 10px;
    cursor: pointer;

    &:hover:not(.noselect) {
      background-color: var(--el-color-primary-light-8);
    }
  }

  .item.active {
    color: var(--el-color-primary);
  }
}

.splitpanes {
  // width: calc(100% - 54px);
  width: 100%;
  height: 100%;
}

.workspace {
  width: 100%;
  height: 100%;

  .panel-tab.native {
    color: var(--el-color-success);
  }

  .panel-tab.remote {
    color: var(--el-color-warning);
  }

  .el-tabs {
    height: 100%;
  }

  .empty-box {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .cover-image {
      width: 60%;
      height: 30%;
      background-image: var(--app-cover-image);
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
    }
  }
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
      overflow-y: hidden;
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
