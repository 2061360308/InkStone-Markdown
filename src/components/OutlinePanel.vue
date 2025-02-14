<script setup lang="ts">
import { useContexStore } from '@/stores'
import { ref } from 'vue'
import { storeToRefs } from 'pinia'

const contexStore = useContexStore()

const outlineBox = ref<HTMLElement | null>(null)

const defaultProps = {
  children: 'children',
  label: 'label',
}

const { outlineTree, outlineSelectId } = storeToRefs(contexStore)

const handleLinkClick = (id: string) => {
  outlineSelectId.value = id
}
</script>
<template>
  <div class="outline-panel">
    <div ref="outlineBox" class="outline-box" v-if="outlineTree.length > 0">
      <el-tree
        :data="outlineTree"
        :props="defaultProps"
        :default-expand-all="true"
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <span
            :class="[data.level, 'outline-item']"
            @click.prevent="handleLinkClick(data.id)"
            :key="data.id"
          >
            {{ node.label.replace(/^#+\s*/, '').trim() }}
            <span class="level">{{ data.level }}</span>
          </span>
        </template>
      </el-tree>
    </div>
    <el-empty description="没有打开的文档" v-else />
  </div>
</template>

<style scoped lang="scss">
a {
  text-decoration: none;
  color: var(--el-text-color-primary);
}

// .outlineBox {
//   margin-top: 10px;
//   padding: 15px;
//   height: calc(100% - 50px);
//   overflow: auto;
// }

.outline-box {
  .outline-item {
    font-weight: bold;
    margin-left: 10px;
  }

  .H1 {
    font-size: 18px;
    .level {
      font-size: 16px;
    }
  }

  .H2 {
    font-size: 16px;
    .level {
      font-size: 14px;
    }
  }

  .H3 {
    font-size: 14px;
    .level {
      font-size: 12px;
    }
  }

  .H4 {
    font-size: 13px;
    .level {
      font-size: 13px;
    }
  }

  .H5 {
    font-size: 12px;
    .level {
      font-size: 12px;
    }
  }

  .H6 {
    font-size: 12px;
    .level {
      font-size: 12px;
    }
  }

  .level {
    padding-left: 10px;
    font-weight: normal;
    color: var(--el-color-primary-light-3);
    box-sizing: border-box;
    margin: 0;
  }
}
</style>
