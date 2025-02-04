<script setup lang="ts">
import { useTabsStore } from '@/stores'
import { ref, onMounted, defineExpose } from 'vue'
import { ElMessage } from 'element-plus'

const tabsStore = useTabsStore()

const outlineBox = ref<HTMLElement | null>(null)

const defaultProps = {
  children: 'children',
  label: 'label',
}

const outLineTree = ref<TreeNode[]>([])
const containerRef = ref<HTMLElement | null>(null)

const noMarkdown = ref(false)

interface TreeNode {
  label: string
  id: string
  level: string
  children?: TreeNode[]
}

interface OutlineItem {
  level: number
  text: string
  id: string
}

const extractOutlineFromElement = (element: HTMLElement): OutlineItem[] => {
  const outline: OutlineItem[] = []

  function traverse(node: HTMLElement) {
    for (const child of Array.from(node.children)) {
      if (child.tagName.match(/^H[1-6]$/)) {
        const level = parseInt(child.tagName[1])
        const text = child.textContent?.trim() || ''
        const id = child.id || ''
        if (text !== '') {
          outline.push({ level, text, id })
        }
      }
      traverse(child as HTMLElement)
    }
  }

  traverse(element)
  return outline
}

const outlineRender = (contentElement: HTMLElement): TreeNode[] => {
  const outline = extractOutlineFromElement(contentElement)
  if (outline.length === 0) {
    return []
  }

  const buildTree = (outline: OutlineItem[]): TreeNode[] => {
    const root: TreeNode[] = []
    const stack: { children: TreeNode[]; level: number }[] = [{ children: root, level: 0 }]

    outline.forEach((item) => {
      const node: TreeNode = {
        label: item.text,
        id: item.id,
        level: `H${item.level}`,
        children: [],
      }
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop()
      }
      stack[stack.length - 1].children.push(node)
      stack.push({ children: node.children!, level: item.level })
    })

    return root
  }

  return buildTree(outline)
}

const updateOutline = () => {
  const current_tab = tabsStore.tabs.filter((tab) => tab.id === tabsStore.activeTabId)[0]

  if (!current_tab || current_tab.type !== tabsStore.TabType.MdFile) {
    noMarkdown.value = true
    return
  } else {
    noMarkdown.value = false
  }

  const mode = tabsStore.vditorInstance[tabsStore.activeTabId].getCurrentMode()

  let sourceClass = '.vditor-ir'

  if (mode === 'wysiwyg') {
    sourceClass = '.vditor-wysiwyg'
  } else if (mode === 'ir') {
    sourceClass = '.vditor-ir'
  } else {
    sourceClass = '.vditor-preview'
  }

  const editor_id = current_tab.id
  containerRef.value = (document.getElementById(editor_id) as HTMLElement).querySelector(
    sourceClass,
  ) as HTMLElement

  const outline = outlineRender(containerRef.value)
  outLineTree.value = outline
}

// watch(
//   () => eventStore.fileChanged,
//   () => {
//     updateOutline()
//   },
// )

const refresh = () => {
  updateOutline()
  ElMessage.success('大纲已刷新')
}

onMounted(() => {
  updateOutline()
})

defineExpose({
  refresh,
})
</script>
<template>
  <div class="outline-panel">
    <div ref="outlineBox" class="outline-box" v-if="!noMarkdown">
      <el-tree
        :data="outLineTree"
        :props="defaultProps"
        :default-expand-all="true"
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <a :href="`#${data.id}`">
            <span :class="data.level">
              {{ node.label.replace(/^#+\s*/, '').trim() }}
            </span>
          </a>
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

.outlineBox {
  margin-top: 10px;
  padding: 15px;
  height: calc(100% - 50px);
  overflow: auto;
}

.outline-box .H1,
.outline-box .H2,
.outline-box .H3,
.outline-box .H4,
.outline-box .H5,
.outline-box .H6 {
  font-weight: bold;
  margin-left: 10px;
}

.outline-box .H1::after,
.outline-box .H2::after,
.outline-box .H3::after,
.outline-box .H4::after,
.outline-box .H5::after,
.outline-box .H6::after {
  float: right;
  padding-left: 10px;
  font-weight: normal;
  color: var(--el-color-primary-light-3);
  box-sizing: border-box;
  margin: 0;
}

.outline-box .H1 {
  font-size: 24px;
}

.outline-box .H1::after {
  content: 'H1';
  font-size: 18px;
}

.outline-box .H2 {
  font-size: 20px;
}

.outline-box .H2::after {
  content: 'H2';
  font-size: 16px;
}

.outline-box .H3 {
  font-size: 16px;
}

.outline-box .H3::after {
  content: 'H3';
  font-size: 14px;
}

.outline-box .H4 {
  font-size: 12px;
}

.outline-box .H4::after {
  content: 'H4';
  font-size: 12px;
}

.outline-box .H5 {
  font-size: 10px;
}

outline-box .H5::after {
  content: 'H5';
  font-size: 10px;
}

.outline-box .H6 {
  font-size: 8px;
}

outline-box .H6::after {
  content: 'H6';
  font-size: 8px;
}
</style>
