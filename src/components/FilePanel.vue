<script setup lang="ts">
import { defineExpose, ref, Ref, onMounted, defineEmits } from 'vue'
import api from '@/utils/api'
import { computed } from 'vue'
import fs from '@/utils/fs'
import { useSettingsStore } from '@/stores'
import FileTree from '@/components/FileTree.vue'
import { watch } from 'vue'

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
const activeTreeMode = ref('mixed')

const defaultProps = {
  children: 'children',
  id: 'path',
  label: 'title',
}

interface treeItemObject {
  title: string
  isLeaf: boolean
  isExpanded: boolean
  data: {
    path: string
    position?: 'remote' | 'local'
  }
  children?: treeItemObject[]
}

interface RemoteDataItem {
  mode: string
  path: string
  sha: string
  type: string
  url: string
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
  return result
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

  // 排序函数，将文件夹放在前面，并按字母顺序排序
  const sortItems = (items: treeItemObject[]) => {
    items.sort((a, b) => {
      if (a.isLeaf === b.isLeaf) {
        return a.title.localeCompare(b.title)
      }
      return a.isLeaf ? 1 : -1
    })

    items.forEach((item) => {
      if (!item.isLeaf && Array.isArray(item.children) && item.children.length > 0) {
        sortItems(item.children)
      }
    })
  }

  sortItems(result)

  return result
}

const remoteData: Ref<RemoteDataItem[]> = ref([])
const localData: Ref<string[]> = ref([])
const remoteTree = computed(() => {
  const remoteTree = formatRemteTree(remoteData.value)
  return transformTree(remoteTree)
})
const localTree = computed(() => {
  const formatedLoaclTree = formatLocalTree(localData.value)
  return transformTree(formatedLoaclTree)
})
const mixedTree = computed(() => {
  const mixed: Array<treeItemObject> = mixTree(remoteTree.value, localTree.value)
  return mixed
})

const updateTreeData = async (noCache: boolean = false) => {
  loading.value = true
  localData.value = await fs.list(repoName.value)
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
  }
  setTimeout(() => {
    loading.value = false
  }, 500)
}

onMounted(async () => {
  updateTreeData()
  if (!api.ready) {
    activeTreeMode.value = 'local'
  }
})

// 暴露给外部的方法,在定义面板时定义
const createFile = () => {
  console.log('create file')
}

const refresh = () => {
  updateTreeData(true)
}

defineExpose({
  createFile,
  refresh,
})
</script>
<template>
  <div :class="{ tipLoad: tipLoad, 'file-tree-box': true }">
    <div :class="{ current: activeTreeMode === 'mixed', item: true }">
      <div class="title" @click="activeTreeMode = 'mixed'">
        混合文件树
        <div class="icon">
          <font-awesome-icon class="icon-left" :icon="['fas', 'chevron-right']" />
          <font-awesome-icon class="icon-down" :icon="['fas', 'chevron-down']" />
        </div>
      </div>
      <div class="content">
        <FileTree :dataSource="mixedTree" :defaultProps="defaultProps" />
      </div>
    </div>
    <div :class="{ current: activeTreeMode === 'local', item: true }">
      <div class="title" @click="activeTreeMode = 'local'">
        本地缓存文件
        <div class="icon">
          <font-awesome-icon class="icon-left" :icon="['fas', 'chevron-right']" />
          <font-awesome-icon class="icon-down" :icon="['fas', 'chevron-down']" />
        </div>
      </div>
      <div class="content">
        <FileTree :dataSource="localTree" :defaultProps="defaultProps" />
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
        <FileTree :dataSource="remoteTree" :defaultProps="defaultProps" />
      </div>
    </div>
    <div :class="{ current: activeTreeMode === 'native', item: true }">
      <div class="title" @click="activeTreeMode = 'native'">
        最近打开（本机文件）
        <div class="icon">
          <font-awesome-icon class="icon-left" :icon="['fas', 'chevron-right']" />
          <font-awesome-icon class="icon-down" :icon="['fas', 'chevron-down']" />
        </div>
      </div>
      <div class="content"></div>
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
    height: calc(100% - 40px * 3);

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
</style>
