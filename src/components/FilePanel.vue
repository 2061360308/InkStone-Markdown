<script setup lang="ts">
import { defineExpose, ref, Ref } from 'vue'

const createFile = () => {
  console.log('create file')
}

defineExpose({
  createFile,
})

interface Tree {
  id: number
  label: string
  isLeaf: boolean
  data: {
    path: string
  }
  children?: Tree[]
}

const dataSource = ref<Tree[]>([
  {
    id: 1,
    label: '/',
    isLeaf: false,
    data: {
      path: '',
    },
    children: [
      {
        id: 4,
        label: 'test.md',
        isLeaf: true,
        data: {
          path: '',
        },
        children: [
          {
            id: 9,
            label: 'Level three 1-1-1',
            isLeaf: true,
            data: {
              path: '',
            },
          },
        ],
      },
    ],
  },
])

const defaultProps = {
  children: 'children',
  label: 'label',
}
</script>
<template>
  <el-collapse accordion class="file-tree-box">
    <el-collapse-item name="1">
      <template #title>
        混合文件树
        <el-icon class="header-icon">
          <info-filled />
        </el-icon>
      </template>
      <div class="content">
        Consistent within interface: all elements should be consistent, such as: design style, icons
        and texts, position of elements, etc. Consistent within interface: all elements should be
        consistent, such as: design style, icons and texts, position of elements, etc. Consistent
        within interface: all elements should be consistent, such as: design style, icons and texts,
        position of elements, etc. Consistent within interface: all elements should be consistent,
        such as: design style, icons and texts, position of elements, etc. Consistent within
        interface: all elements should be consistent, such as: design style, icons and texts,
        position of elements, etc. Consistent within interface: all elements should be consistent,
        such as: design style, icons and texts, position of elements, etc. Consistent within
        interface: all elements should be consistent, such as: design style, icons and texts,
        position of elements, etc. Consistent within interface: all elements should be consistent,
        such as: design style, icons and texts, position of elements, etc. Consistent within
        interface: all elements should be consistent, such as: design style, icons and texts,
        position of elements, etc.
      </div>
    </el-collapse-item>
    <el-collapse-item name="2">
      <template #title>
        本地缓存文件
        <el-icon class="header-icon">
          <info-filled />
        </el-icon>
      </template>
      <div class="content">
        <el-tree
          style="max-width: 600px"
          :data="dataSource"
          :props="defaultProps"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
        >
          <template #default="{ node, data }">
            <span class="node-item">
              <FontAwesomeIcon
                v-if="node.isLeaf && node.label.endsWith('.md')"
                :icon="['fas', 'square-pen']"
                style="color: var(--el-color-primary)"
                class="icon"
              />
              <FontAwesomeIcon v-else-if="node.isLeaf" :icon="['fas', 'file']" class="icon" />
              <FontAwesomeIcon v-else :icon="['fas', 'folder']" class="icon" />
              <span class="label">{{ node.label }}</span>
            </span>
          </template>
        </el-tree>
      </div>
    </el-collapse-item>
    <el-collapse-item name="3">
      <template #title>
        远程仓库文件（只读）
        <el-icon class="header-icon">
          <info-filled />
        </el-icon>
      </template>
      <div class="content">
        Simplify the process: keep operating process simple and intuitive; Definite and clear:
        enunciate your intentions clearly so that the users can quickly understand and make
        decisions; Easy to identify: the interface should be straightforward, which helps the users
        to identify and frees them from memorizing and recalling.
      </div>
    </el-collapse-item>
    <el-collapse-item name="4">
      <template #title>
        最近打开（本机文件）
        <el-icon class="header-icon">
          <info-filled />
        </el-icon>
      </template>
      <div class="content">
        Decision making: giving advices about operations is acceptable, but do not make decisions
        for the users; Controlled consequences: users should be granted the freedom to operate,
        including canceling, aborting or terminating current operation.
      </div>
    </el-collapse-item>
  </el-collapse>
</template>

<style scoped lang="scss">
.file-tree-box {
  width: 100%;
  height: 100%;
}

.content {
  width: 100%;
  height: calc(100vh - 270px);
  overflow-x: visible;
  overflow-y: auto;

  .icon {
    padding: 5px;
  }
}

.node-item {
  display: flex;
  justify-content: center;
}
</style>
