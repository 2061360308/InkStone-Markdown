<script setup lang="ts">
import { defineProps, Component } from 'vue'
import FileTypeIcon from './FileTypeIcon.vue'
import { useDark } from '@vueuse/core'

const isDark = useDark()

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

defineProps({
  dataSource: {
    type: Array<treeItemObject>,
    required: true,
  },
  expendedKeys: {
    type: Array<string>,
    default: () => [],
  },
  defaultProps: {
    type: Object,
    default: () => ({
      children: 'children',
      id: 'path',
      label: 'title',
    }),
  },
  type: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  nodeClick: {
    type: Function,
    default: () => {},
  },
  nodeContextmenu: {
    type: Function,
    default: () => {},
  },
})
</script>

<template>
  <div :class="['file-tree', type]">
    <el-tree
      :data="dataSource"
      :props="defaultProps"
      node-key="id"
      default-expand-all
      :expand-on-click-node="false"
      :default-expanded-keys="expendedKeys"
      @node-contextmenu="
        (e: MouseEvent, data: treeItemObject, node: HTMLElement, component: Component) => {
          nodeContextmenu(e, data, node, component)
        }
      "
    >
      <template #default="{ node, data }">
        <span class="node-item" @click="nodeClick(node, data)">
          <FileTypeIcon
            :name="node.data.title"
            :folder="!node.isLeaf"
            :forder-open="node.expanded"
            :light="!isDark"
          />
          <span :class="{ label: true, remote: data.data.position === 'remote' }">{{
            node.label
          }}</span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<style scoped lang="scss">
.file-tree {
  width: 100%;
  height: 100%;
}

.node-item {
  display: flex;
  justify-content: center;
  align-items: center;

  .icon {
    padding: 5px;
  }
}

.file-tree.mixed {
  .label.remote {
    color: var(--el-color-warning);
  }
}
</style>
