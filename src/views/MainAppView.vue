<script setup lang="ts">
import { Ref, ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContexStore } from '@/stores'
import { storeToRefs } from 'pinia'
import { Splitpanes, Pane } from 'splitpanes'
import { PanelIconPosition } from '@/panels/base'
import panelsManager from '@/panels'
import SidebarPanel from '@/components/SidebarPanel.vue'
import { useDark, useMediaQuery } from '@vueuse/core'
import { MenuBar } from '@imengyu/vue3-context-menu'
import FileTypeIcon from '@/components/file/FileTypeIcon.vue'
import { createNativeFile, openNativeFile } from '@/utils/filePanelOperation'
import { backendTasks } from '@/utils/backendLaunchTasks'

const contexStore = useContexStore()
const route = useRoute()
const router = useRouter()

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

const isNarrowscreen = useMediaQuery('(max-width: 650px)')

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
    titleBarVisible.value = overlay?.visible || isNarrowscreen.value // 立即同步一次
    updateMenuBarData()
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
        titleBarVisible.value = overlay.visible || isNarrowscreen.value
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

type MenubarItem = Array<{
  label: string
  onClick?: () => void
  divided?: boolean
  children?: MenubarItem
}>

interface MenubarData {
  items: MenubarItem
  zIndex: number
  mini: boolean
}

const updateMenuBarData = () => {
  if (isNarrowscreen.value) {
    menuBarData.value.items = [...baseMenuBarItem]
    for (const item of topMenuItems.value) {
      menuBarData.value.items.push({
        label: item.name,
        onClick: () => {
          handleMenuSelect(item.id)
          sidebarDrawerVisible.value = true
        },
        divided: false,
      })
    }

    menuBarData.value.items[menuBarData.value.items.length - 1].divided = true

    menuBarData.value.items.push({
      label: '日/夜间模式',
      onClick: () => {
        isDark.value = !isDark.value
      },
      divided: true,
    })

    for (const item of bottomMenuItems.value) {
      menuBarData.value.items.push({
        label: item.name,
        onClick: () => {
          handleMenuSelect(item.id)
          if (!item.noselect) {
            sidebarDrawerVisible.value = true
          }
        },
      })
    }
  } else {
    menuBarData.value.items = baseMenuBarItem
  }
}

watch(isNarrowscreen, (value) => {
  if ('windowControlsOverlay' in navigator) {
    const overlay = navigator.windowControlsOverlay
    titleBarVisible.value = overlay?.visible || value
  } else {
    titleBarVisible.value = value
  }

  updateMenuBarData()
})

const baseMenuBarItem: MenubarItem = [
  {
    label: '新建',
    children: [
      {
        label: '文章',
        onClick: (
          post: boolean = true,
          draft: boolean = false,
          _callback: (file: FileSystemFileHandle) => void = openNativeFile,
        ) => {
          createNativeFile(post, draft, _callback)
        },
      },
      {
        label: '草稿',
        onClick: (
          post: boolean = true,
          draft: boolean = true,
          _callback: (file: FileSystemFileHandle) => void = openNativeFile,
        ) => {
          createNativeFile(post, draft, _callback)
        },
      },
      {
        label: '文件',
        onClick: (
          post: boolean = false,
          draft: boolean = false,
          _callback: (file: FileSystemFileHandle) => void = openNativeFile,
        ) => {
          createNativeFile(post, draft, _callback)
        },
      },
    ],
  },
  {
    label: '打开',
    onClick: async () => {
      if ('showOpenFilePicker' in window) {
        const [fileHandle] = await window.showOpenFilePicker({ startIn: 'desktop' })
        openNativeFile(fileHandle)
        console.log(fileHandle)
      } else {
        ElNotification({
          title: 'Warning',
          message: '抱歉，当前浏览器不支持打开本地文件',
          type: 'warning',
        })
      }
    },
    divided: true,
  },
]

const menuBarData: Ref<MenubarData> = ref({
  items: [],
  zIndex: 3,
  mini: true,
})

/**
 *    左侧边栏
 */

const notificationVisible: Ref<boolean> = ref(contexStore.notification.data.length > 0)

const sidebarState = storeToRefs(contexStore).sidebarState

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
  if (!panelsManager.getPanel(index)?.noselect) {
    if (sidebarState.value.fixed) {
      if (index === sidebarState.value.current) {
        sidebarState.value.current = ''

        console.log(sidebarState.value)
        closeSideBarPanel()
        return
      } else {
        contexStore.sidebarState.opened = true
        sidebarState.value.current = index
      }
    } else {
      sidebarState.value.current = index
    }
  }
  panelsManager.activePanel(index)
}

const handelPinButton = () => {
  if (sidebarState.value.fixed) {
    unpinSideBarPanel()
  } else {
    contexStore.sidebarState.fixed = true // 置侧边栏状态为固定
    sidebarDrawerVisible.value = false // 关闭抽屉
  }
}

const sidebarDrawerVisible: Ref<boolean> = ref(false)

let menuBarEnter: boolean = false

const sidebarMenuMouseEnter = () => {
  if (sidebarState.value.fixed) return

  menuBarEnter = true
  sidebarDrawerVisible.value = true
}

const sidebarMenuMouseLeave = () => {
  if (sidebarState.value.fixed) return

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

onMounted(() => {
  if (route.query.from !== 'launch') {
    if (Object.keys(route.query).length > 0) {
      router.replace({ name: 'launch', query: route.query })
    } else {
      // 直接启动后台启动任务
      backendTasks()
    }
  }

  router.replace({ query: {} }) // 清空路由参数

  titleBarCheck()
})

const isDark = useDark()

const getTabItemTitle = (item: TabItem): string => {
  if (item.panelName === 'remoteFileEditor') {
    if (item.data.file) {
      if ((item.data.file as remoteFile).title) {
        return (item.data.file as remoteFile).title as string
      } else {
        return item.title.replace(' @remote', '')
      }
    }
  } else if (item.panelName === 'nativeFileEditor') {
    if (item.data.file) {
      return (item.data.file as nativeFile).name
    }
  } else if (item.panelName === 'localFileEditor') {
    if (item.data.file) {
      if ((item.data.file as localFile).title) {
        return (item.data.file as localFile).title as string
      } else {
        return item.title
      }
    }
  }

  return item.title
}
</script>

<template>
  <div class="main-application">
    <div class="title-bar" v-if="titleBarVisible">
      <div class="logo">
        <el-image src="/favicon.ico" alt="logo" class="logo-img" />
      </div>
      <span class="title">砚台 Inkstone</span>
      <div class="bar-menu"><MenuBar :options="menuBarData" /></div>
      <div class="opened-file-tip">{{ contexStore.titleBarText }}</div>
    </div>
    <div class="notification" v-if="notificationVisible"></div>
    <div
      :class="[
        titleBarVisible ? 'has-titlebar' : '',
        isNarrowscreen ? 'is-narrowscreen' : '',
        'main-container',
      ]"
    >
      <div
        class="sidebar-menu"
        @mouseenter="sidebarMenuMouseEnter"
        @mouseleave="menuBarEnter = false"
        v-if="!isNarrowscreen"
      >
        <div class="items-top items-box">
          <div
            v-for="item in topMenuItems"
            :index="item.id"
            :key="item.id"
            :class="{
              active: item.id === sidebarState.current,
              item: true,
              noselect: item.noselect,
            }"
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
            :class="{
              active: item.id === sidebarState.current,
              item: true,
              noselect: item.noselect,
            }"
            @click="handleMenuSelect(item.id)"
          >
            <font-awesome-icon :icon="['fas', item.icon]" size="2xl" />
          </div>
        </div>
      </div>
      <div v-show="!sidebarState.fixed || isNarrowscreen">
        <el-drawer
          modal-class="sidebar-drawer"
          v-model="sidebarDrawerVisible"
          direction="ltr"
          :with-header="false"
          :size="isNarrowscreen ? '85%' : 350"
          :modal="isNarrowscreen ? true : false"
          @mouseleave="sidebarMenuMouseLeave"
        >
          <!-- v-show="!sidebarState.fixed || isNarrowscreen" -->
          <SidebarPanel @update:pin="handelPinButton" />
        </el-drawer>
      </div>

      <div class="main-center">
        <splitpanes style="width: 100%; height: 100%" @resize="sidebarState.size = $event[0].size">
          <pane
            :size="sidebarState.size"
            ref="pin"
            v-if="sidebarState.fixed && sidebarState.opened && !isNarrowscreen"
          >
            <SidebarPanel
              ref="sidepanel"
              @update:pin="handelPinButton"
              style="width: 100%; height: 100%"
            />
            <div class="SidebarPanelBoxPin" ref="SidebarPanelBoxPin"></div>
          </pane>
          <pane
            :size="
              sidebarState.fixed && sidebarState.opened && !isNarrowscreen
                ? 100 - sidebarState.size
                : 100
            "
          >
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
                      <FileTypeIcon
                        :name="getTabItemTitle(item)"
                        :light="!isDark"
                        v-if="
                          item.panelName === 'localFileEditor' ||
                          item.panelName === 'remoteFileEditor' ||
                          item.panelName === 'nativeFileEditor'
                        "
                      />
                      <font-awesome-icon
                        :icon="['fas', item.icon]"
                        v-else
                        style="margin-right: 4px"
                      />
                      <el-tooltip
                        :class="{ 'panel-tab': true, native: item.panel === 'nativeFile' }"
                        effect="dark"
                        :content="item.title"
                        placement="bottom-start"
                        >{{ truncateTitle(item.title) }}</el-tooltip
                      >
                    </span>
                  </template>

                  <component :is="item.panel" :id="item.id" />
                  <!-- <LocalFileEditor :id="item.id" /> -->
                </el-tab-pane>
              </el-tabs>
              <div class="empty-box" v-else>
                <div class="logo cover-image"></div>
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
      // padding: 4px 6px;
      // border-radius: 4px;
      -webkit-app-region: no-drag;
    }

    //.bar-menu:hover {
    //  background-color: var(--el-color-primary-light-8);
    // }

    .opened-file-tip {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      z-index: 1;
      margin: auto;
    }
  }

  .main-container {
    width: 100%;
    height: 100%;
    display: flex;

    .main-center {
      flex-grow: 1; /* 占满剩余空间 */
      max-width: calc(100% - $sidebar-menu-w);
    }
  }

  .main-container.has-titlebar {
    height: calc(100% - env(titlebar-area-height, 33px));
  }

  .main-container.is-narrowscreen {
    .main-center {
      max-width: 100%;
    }
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
    width: 100%;
    height: 100%;
  }

  .empty-box {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    .logo.cover-image {
      width: 60%;
      height: 30%;
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

.has-titlebar {
  .sidebar-drawer {
    top: env(titlebar-area-height, 33px) !important;
  }
}

.is-narrowscreen {
  .sidebar-drawer {
    left: 0 !important;
  }
}

.workspace {
  .el-tabs__content {
    width: 100%;
    height: 100%;
  }
  .tab-pane {
    width: 100%;
    height: 100%;
  }
}
</style>
