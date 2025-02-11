<script setup lang="ts">
import { defineExpose, ref, Ref, onMounted, defineEmits, watch, VNode } from 'vue'
import api from '@/utils/api'
import { computed } from 'vue'
import fs from '@/utils/fs'
import { useSettingsStore } from '@/stores'
import FileTree from '@/components/file/FileTree.vue'
import {
  openLocalFile,
  openRemoteFile,
  createFile,
  deleteFile,
  exportFile,
} from '@/utils/filePanelOption'
import ContextMenu from '@imengyu/vue3-context-menu'
import { Component } from 'vue'

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

const repoName = computed(() => settingsStore.settings['基本配置'].repoName)
const localSelectRepoName: Ref<string> = ref(repoName.value) // 本地文件树要显示的仓库名
const localRepoNames: Ref<string[]> = ref([]) // 本地文件树的仓库名列表

const activeTreeMode = ref('mixed')

const defaultProps = {
  children: 'children',
  id: 'path',
  label: 'title',
}

interface RemoteDataItem {
  mode: string
  path: string
  sha: string
  type: string
  url: string
}

// 文件树排序
// 排序函数，将文件夹放在前面，并按字母顺序排序
const sortFileTreeItems = (items: treeItemObject[]) => {
  items.sort((a, b) => {
    if (a.isLeaf === b.isLeaf) {
      return a.title.localeCompare(b.title)
    }
    return a.isLeaf ? 1 : -1
  })

  items.forEach((item) => {
    if (!item.isLeaf && Array.isArray(item.children) && item.children.length > 0) {
      sortFileTreeItems(item.children)
    }
  })

  return items
}

// 格式化远程文件树返回内容
const formatRemteTree = (
  tree: Array<{
    mode: string
    path: string
    sha: string
    type: string
    url: string
  }>,
): Array<treeItemObject> => {
  const result: Array<treeItemObject> = []

  tree.forEach((item) => {
    const newItem: treeItemObject = {
      title: item.path.substring(item.path.lastIndexOf('/') + 1),
      isLeaf: item.type === 'blob',
      isExpanded: false,
      data: {
        path: item.path,
      },
    }

    if (newItem.isLeaf) {
      newItem.data.position = 'remote'
    }
    result.push(newItem)
  })

  return result
}

const formatLocalTree = (tree: Array<string>): Array<treeItemObject> => {
  const result: Array<treeItemObject> = []

  tree.forEach((item) => {
    const parts = item.split('/')
    for (let i = 0; i < parts.length; i++) {
      const path = parts.slice(0, i + 1).join('/')
      const node = result.find((node) => node.data.path === path)
      if (!node) {
        const newItem: treeItemObject = {
          title: parts[i],
          isLeaf: i === parts.length - 1,
          isExpanded: false,
          data: {
            path: path,
          },
        }
        if (newItem.isLeaf) {
          newItem.data.position = 'local'
        }
        result.push(newItem)
      }
    }
  })

  return result
}

const mixTree = (
  remote: Array<treeItemObject>,
  local: Array<treeItemObject>,
): Array<treeItemObject> => {
  const result: Array<treeItemObject> = []
  remote.forEach((item) => {
    const node = local.find((node) => node.data.path === item.data.path)
    if (!node) {
      result.push(item)
    }
  })
  local.forEach((item) => {
    result.push(item)
  })
  return sortFileTreeItems(result)
}

const transformTree = (tree: Array<treeItemObject>) => {
  const pathMap: { [key: string]: treeItemObject } = {}

  tree.forEach((item) => {
    pathMap[item.data.path] = { ...item, children: [] }
  })

  const result: Array<treeItemObject> = []

  tree.forEach((item) => {
    const parentPath = item.data.path.substring(0, item.data.path.lastIndexOf('/'))
    if (parentPath && pathMap[parentPath]) {
      if (!pathMap[parentPath].children) {
        pathMap[parentPath].children = []
      }
      pathMap[parentPath].children.push(pathMap[item.data.path])
    } else {
      result.push(pathMap[item.data.path])
    }
  })

  return sortFileTreeItems(result)
}

const remoteData: Ref<RemoteDataItem[]> = ref([])
const currentLocalData: Ref<string[]> = ref([])
const selectedLocalData: Ref<string[]> = ref([])
const remoteTree = computed(() => {
  const remoteTree = formatRemteTree(remoteData.value)
  return transformTree(remoteTree)
})
const currentLocalTree = computed(() => {
  const formatedLoaclTree = formatLocalTree(currentLocalData.value)
  return transformTree(formatedLoaclTree)
})
const selectedLocalTree = computed(() => {
  const formatedLoaclTree = formatLocalTree(selectedLocalData.value)
  return transformTree(formatedLoaclTree)
})
const mixedTree = computed(() => {
  const mixed: Array<treeItemObject> = mixTree(remoteTree.value, currentLocalTree.value)
  return mixed
})

const updateTreeData = async (noCache: boolean = false) => {
  loading.value = true
  localRepoNames.value = await fs.listAllRepoNames()
  const localNameSpace = 'local.inkstone' // 本地文件的命名空间
  if (!localRepoNames.value.includes(localNameSpace)) {
    localRepoNames.value.push(localNameSpace)
  }
  if (!localRepoNames.value.includes(repoName.value)) {
    localRepoNames.value.push(repoName.value)
  }
  selectedLocalData.value = await fs.list(localSelectRepoName.value)
  if (api.ready) {
    // 没有登录时不请求远程文件树
    const remote = await api.getRepoTree(noCache)
    remoteData.value = remote.tree.map((item) => ({
      mode: item.mode || '',
      path: item.path || '',
      sha: item.sha || '',
      type: item.type || '',
      url: item.url || '',
    }))
    currentLocalData.value = await fs.list(repoName.value)
  }
  loading.value = false
}

onMounted(async () => {
  updateTreeData()
  if (!api.ready) {
    activeTreeMode.value = 'local'
  }
})

// 暴露给外部的方法,在定义面板时定义

const refresh = async () => {
  await updateTreeData(true)
  ElMessage({
    type: 'success',
    message: '刷新成功!',
  })
}

defineExpose({
  createFile: () => {
    createFile(null, repoName.value, 'local', false, false, createFileCallback)
  },
  refresh,
})

/**
 * 文件选中
 */

const fileSelected = (type: string, node: treeItemObject, treeItem: treeItemObject) => {
  if (!node.isLeaf) {
    return
  }

  const path = treeItem.data.path
  const branch = settingsStore.settings['基本配置'].repoBranch

  if (type === 'mixed') {
    openLocalFile(path, repoName.value)
    currentLocalData.value.push(path)
  } else if (type === 'local') {
    openLocalFile(path, localSelectRepoName.value)
  } else if (type === 'remote') {
    openRemoteFile(path, repoName.value, branch)
  } else if (type === 'native') {
    // openNativeFile(path)
  }
}

/**
 *  右击菜单
 */

interface contextMenuItem {
  label: string
  icon?: VNode
  onClick?: (data: treeItemObject | null, repo: string, type: string) => void
  children?: Array<contextMenuItem>
}

type contextMenuItemData = Array<contextMenuItem>

const createFileCallback = (path: string, repo: string) => {
  updateTreeData()
  openLocalFile(path, repo)
}

const deleteFileCallback = () => {
  updateTreeData()
  loading.value = false
}

const buildContextMenu = (
  contexmenu: contextMenuItemData,
  data: treeItemObject | null,
  repo: string,
  type: string,
): contextMenuItemData => {
  return contexmenu.map((item) => {
    return {
      label: item.label,
      onClick: () => {
        if (item.onClick) {
          item.onClick(data, repo, type)
        }
      },
      icon: item.icon,
      children: item.children ? buildContextMenu(item.children, data, repo, type) : undefined,
    }
  })
}

const createFileMenu = {
  label: '文件',
  onClick: (
    data: treeItemObject | null,
    repo: string,
    type: string,
    post: boolean = false,
    draft: boolean = false,
    _callback: (path: string, repo: string) => void = createFileCallback,
  ) => {
    createFile(data, repo, type, post, draft, _callback)
  },
}

const createPostMenu = {
  label: '新建文章',
  onClick: (
    data: treeItemObject | null,
    repo: string,
    type: string,
    post: boolean = true,
    draft: boolean = false,
    _callback: (path: string, repo: string) => void = createFileCallback,
  ) => {
    createFile(data, repo, type, post, draft, _callback)
  },
}

const createDraftMenu = {
  label: '新建草稿',
  onClick: (
    data: treeItemObject | null,
    repo: string,
    type: string,
    post: boolean = true,
    draft: boolean = true,
    _callback: (path: string, repo: string) => void = createFileCallback,
  ) => {
    createFile(data, repo, type, post, draft, _callback)
  },
}

const createMenu = {
  label: '新建',
  children: [createPostMenu, createDraftMenu, createFileMenu],
}

const renameMenu = {
  label: '重命名',
  onClick: () => {},
}

const copyMenu = {
  label: '复制',
  onClick: () => {},
}

const deleteMenu = {
  label: '删除',
  onClick: (
    data: treeItemObject | null,
    repo: string,
    type: string,
    _callback: () => void = deleteFileCallback,
  ) => {
    loading.value = true
    deleteFile(data, repo, type, _callback)
  },
}

const exportMenu = {
  label: '导出到本机磁盘',
  onClick: async (data: treeItemObject | null, repo: string, type: string) => {
    if (!data) {
      return
    }

    if ('showSaveFilePicker' in window) {
      const fileHandle = await window.showSaveFilePicker({
        startIn: 'desktop',
        suggestedName: data.title,
      })
      exportFile(data, repo, type, fileHandle)
    } else {
      ElNotification({
        title: 'Warning',
        message: '抱歉，当前浏览器不支持打开本地文件',
        type: 'warning',
      })
    }
  },
}

const refreshMenu = {
  label: '刷新',
  onClick: refresh,
}

const copyToOtherRepoMenu = {
  label: '拷贝到',
  children: localRepoNames.value.map((item) => ({
    label: item,
    onClick: () => {
      console.log('拷贝到', item)
    },
  })),
}

const openNativeFileMenu = {
  label: '打开本机文件',
  onClick: async () => {
    if ('showOpenFilePicker' in window) {
      const [fileHandle] = await window.showOpenFilePicker({ startIn: 'desktop' })
      console.log(fileHandle)
    } else {
      ElNotification({
        title: 'Warning',
        message: '抱歉，当前浏览器不支持打开本地文件',
        type: 'warning',
      })
    }
  },
}

const createNativeFileMenu = {
  label: '创建本机文件',
  onClick: () => {
    console.log('新建')
  },
}

const fileRightClick = (
  type: string,
  e: MouseEvent,
  data: treeItemObject | null = null,
  node: HTMLElement | null = null,
  component: Component | null = null,
) => {
  e.preventDefault()

  console.log('右击', type, data, node, component)
  let contexmenu: contextMenuItemData = []
  let repo = repoName.value
  if (type === 'mixed') {
    if (data) {
      if (data.isLeaf) {
        contexmenu = [
          createMenu,
          renameMenu,
          copyMenu,
          deleteMenu,
          exportMenu,
          createNativeFileMenu,
          openNativeFileMenu,
          refreshMenu,
        ]
      } else {
        contexmenu = [createMenu, createNativeFileMenu, openNativeFileMenu, refreshMenu]
      }
    } else {
      contexmenu = [createMenu, createNativeFileMenu, openNativeFileMenu, refreshMenu]
    }
  } else if (type === 'local') {
    if (data) {
      if (data.isLeaf) {
        contexmenu = [
          createMenu,
          renameMenu,
          copyMenu,
          deleteMenu,
          exportMenu,
          createNativeFileMenu,
          openNativeFileMenu,
          refreshMenu,
          copyToOtherRepoMenu,
        ]
      } else {
        contexmenu = [createMenu, createNativeFileMenu, openNativeFileMenu, refreshMenu]
      }
    } else {
      contexmenu = [createMenu, createNativeFileMenu, openNativeFileMenu, refreshMenu]
    }
    repo = localSelectRepoName.value
  } else if (type === 'remote') {
    if (data) {
      if (data.isLeaf) {
        contexmenu = [exportMenu, createNativeFileMenu, openNativeFileMenu, refreshMenu]
      } else {
        contexmenu = [createNativeFileMenu, openNativeFileMenu, refreshMenu]
      }
    } else {
      contexmenu = [createNativeFileMenu, openNativeFileMenu, refreshMenu]
    }
  }

  ContextMenu.showContextMenu({
    x: e.clientX,
    y: e.clientY,
    // theme: 'default dark',
    items: buildContextMenu(contexmenu, data, repo, type),
    zIndex: 2017,
  })
}
</script>
<template>
  <div :class="{ tipLoad: tipLoad, 'file-tree-box': true, noLogin: !api.ready }">
    <div :class="{ current: activeTreeMode === 'mixed', item: true }" v-if="api.ready">
      <div class="title" @click="activeTreeMode = 'mixed'">
        混合文件树
        <div class="icon">
          <font-awesome-icon class="icon-left" :icon="['fas', 'chevron-right']" />
          <font-awesome-icon class="icon-down" :icon="['fas', 'chevron-down']" />
        </div>
      </div>
      <div class="content">
        <FileTree
          type="mixed"
          :dataSource="mixedTree"
          :defaultProps="defaultProps"
          :nodeClick="
            (node: treeItemObject, treeItem: treeItemObject) =>
              fileSelected('mixed', node, treeItem)
          "
          :nodeContextmenu="
            (e: MouseEvent, data: treeItemObject, node: HTMLElement, component: Component) => {
              fileRightClick('mixed', e, data, node, component)
              console.log(e, data, node, component)
            }
          "
          @contextmenu="(e: MouseEvent) => fileRightClick('local', e)"
        />
      </div>
    </div>
    <div :class="{ current: activeTreeMode === 'local', item: true }">
      <div class="title" @click="activeTreeMode = 'local'">
        <div class="title-item">
          本地缓存文件
          <div class="selects">
            <el-select
              class="select-local-tree-repo"
              v-model="localSelectRepoName"
              collapse-tags
              placeholder="Select"
              popper-class="custom-header"
              :max-collapse-tags="4"
              @change="updateTreeData"
            >
              <el-option v-for="item in localRepoNames" :key="item" :label="item" :value="item" />
            </el-select>
          </div>
        </div>

        <div class="icon">
          <font-awesome-icon class="icon-left" :icon="['fas', 'chevron-right']" />
          <font-awesome-icon class="icon-down" :icon="['fas', 'chevron-down']" />
        </div>
      </div>
      <div class="content">
        <FileTree
          type="local"
          :dataSource="selectedLocalTree"
          :defaultProps="defaultProps"
          :nodeClick="
            (node: treeItemObject, treeItem: treeItemObject) =>
              fileSelected('local', node, treeItem)
          "
          :nodeContextmenu="
            (e: MouseEvent, data: treeItemObject, node: HTMLElement, component: Component) => {
              fileRightClick('local', e, data, node, component)
              console.log(e, data, node, component)
            }
          "
          @contextmenu="(e: MouseEvent) => fileRightClick('local', e)"
        />
      </div>
    </div>
    <div :class="{ current: activeTreeMode === 'remote', item: true }">
      <div class="title" @click="activeTreeMode = 'remote'">
        远程仓库文件（只读）
        <div class="icon">
          <font-awesome-icon class="icon-left" :icon="['fas', 'chevron-right']" />
          <font-awesome-icon class="icon-down" :icon="['fas', 'chevron-down']" />
        </div>
      </div>
      <div class="content">
        <FileTree
          type="remote"
          :dataSource="remoteTree"
          :defaultProps="defaultProps"
          :nodeClick="
            (node: treeItemObject, treeItem: treeItemObject) =>
              fileSelected('remote', node, treeItem)
          "
          :nodeContextmenu="
            (e: MouseEvent, data: treeItemObject, node: HTMLElement, component: Component) => {
              fileRightClick('remote', e, data, node, component)
              console.log(e, data, node, component)
            }
          "
          @contextmenu="(e: MouseEvent) => fileRightClick('remote', e)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.file-tree-box {
  width: 100%;
  height: 100%;

  .item {
    .title {
      font-size: 14px;
      // font-weight: bold;
      padding: 5px 10px;
      width: 100%;
      height: 40px;
      border-top: 1px solid var(--el-border-color);
      border-bottom: 1px solid var(--el-border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title-item {
        display: flex;
        align-items: center;
        gap: 10px;

        .selects {
          width: 140px;
        }
      }

      .icon {
        font-size: 12px;
        .icon-left {
          display: block;
        }
        .icon-down {
          display: none;
        }
      }
    }
    .content {
      display: none;
    }
  }

  .item.current {
    width: 100%;
    height: calc(100% - 40px * 2);

    .title {
      .icon-left {
        display: none;
      }
      .icon-down {
        display: block;
      }
    }
    .content {
      display: block;
      width: 100%;
      height: calc(100% - 40px);
      padding: 10px;
      overflow: auto;
    }
  }
}

.file-tree-box.noLogin {
  .item.current {
    height: calc(100% - 40px);
    .content {
      height: calc(100% - 40px);
    }
  }
}
</style>

<style lang="scss">
.file-tree-box {
  .item {
    .title {
      .el-select__wrapper {
        box-shadow: none;
      }
    }
  }
}
</style>
