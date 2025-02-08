<script setup lang="ts">
import { ref, defineProps, defineEmits, watch } from 'vue'
import { useSettingsStore } from '@/stores'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuGroup,
  ContextMenuSeparator,
} from '@imengyu/vue3-context-menu'
import { format } from 'date-fns'
import yaml from 'js-yaml'

const settingsStore = useSettingsStore()

const props = defineProps<{ frontMatterString: string }>()
const emit = defineEmits(['change'])

// frontMatter
const frontMatter = ref<Array<{ name: string; type: fronMatterValueType; value: any }>>([])

// frontMatter的备份数据
// 如果用户输入的不合法将从此数组中恢复（如果有）
// 只需要备份属性名即可
let frontMatterBack: Array<string> = []

// frontMatter 原始yaml对象，
// 无法可视化的数据（复杂嵌套数据），会保存在这里
// 写回文件时会将这里的数据转换为yaml字符串
let frontMatterObject = <Record<string, any>>{}

// frontMatter 属性值类型
enum fronMatterValueType {
  string = 'string',
  array = 'array',
  number = 'number',
  boolean = 'boolean',
  dateTime = 'dateTime',
}

// 文章标题
const fileName = ref('')

// 属性类型选择菜单弹出坐标
const optionsComponent = ref<{ x: number; y: number }>({ x: 0, y: 0 })

// 属性类型选择菜单是否显示标识
const menuVisible = ref(true)

// 当前正在编辑的 frontMatter 索引
let currentFrontMatterIndex = 0

const isFrontMatterFold = ref(false) // 文档属性折叠标识

let firstWatch = true

watch(
  () => props.frontMatterString,
  (newVal) => {
    // 只监听一次
    if (firstWatch) {
      firstWatch = false
    } else {
      return
    }

    // 解析 frontMatter
    if (newVal) {
      const result = parseFrontMatter(newVal)
      frontMatterObject = result ? result : {}
    }

    // 生成 frontMatter
    for (const key in frontMatterObject) {
      const value = frontMatterObject[key]
      const type = typeof value

      let item_type: fronMatterValueType = fronMatterValueType.string

      if (type === 'string') {
        item_type = fronMatterValueType.string
      } else if (type === 'number') {
        item_type = fronMatterValueType.number
      } else if (type === 'boolean') {
        item_type = fronMatterValueType.boolean
      } else if (type === 'object') {
        if (Array.isArray(value)) {
          item_type = fronMatterValueType.array
        } else if (value instanceof Date) {
          item_type = fronMatterValueType.dateTime
        }
      } else {
        continue // 其他类型不处理, 暂时不支持
      }

      frontMatter.value.push({
        name: key,
        type: item_type,
        value: value,
      })
    }

    frontMatterBack = frontMatter.value.map((item) => item.name)
  },
)

const showTypeSelectMenu = (event: MouseEvent, index: number) => {
  /**
   * 显示属性类型选择菜单
   */
  console.log('showTypeSelectMenu')
  currentFrontMatterIndex = index
  optionsComponent.value = { x: event.clientX, y: event.clientY }
  menuVisible.value = true
}

const changeAttributeType = (type: fronMatterValueType) => {
  /**
   * 修改属性类型
   */
  if (frontMatter.value[currentFrontMatterIndex].value) {
    ElMessageBox.confirm('修改属性类将导致原有值被丢弃，确认修改吗？', 'Warning', {
      confirmButtonText: '修改',
      cancelButtonText: '保留原值',
      type: 'warning',
    })
      .then(() => {
        // 清空对应的属性值
        const newValue: any = ''
        if (type === fronMatterValueType.array) {
          frontMatter.value[currentFrontMatterIndex].value = []
        } else if (type === fronMatterValueType.number) {
          frontMatter.value[currentFrontMatterIndex].value = 0
        } else if (type === fronMatterValueType.boolean) {
          frontMatter.value[currentFrontMatterIndex].value = false
        } else if (type === fronMatterValueType.dateTime) {
          frontMatter.value[currentFrontMatterIndex].value = new Date()
        } else {
          frontMatter.value[currentFrontMatterIndex].value = ''
        }

        frontMatter.value[currentFrontMatterIndex].value = newValue

        // 修改属性类型
        frontMatter.value[currentFrontMatterIndex].type = type
        // 修改属性类型后，更新 frontMatterObject
        // frontMatterObject[frontMatter.value[currentFrontMatterIndex].name] =
        //   frontMatter.value[currentFrontMatterIndex].value;

        frontMatterChange()
        ElMessage({
          type: 'success',
          message: '属性修改成功',
        })
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '取消修改',
        })
      })
  } else {
    const newValue: any = ''
    if (type === fronMatterValueType.array) {
      frontMatter.value[currentFrontMatterIndex].value = []
    } else if (type === fronMatterValueType.number) {
      frontMatter.value[currentFrontMatterIndex].value = 0
    } else if (type === fronMatterValueType.boolean) {
      frontMatter.value[currentFrontMatterIndex].value = false
    } else if (type === fronMatterValueType.dateTime) {
      frontMatter.value[currentFrontMatterIndex].value = new Date()
    } else {
      frontMatter.value[currentFrontMatterIndex].value = ''
    }

    frontMatter.value[currentFrontMatterIndex].value = newValue

    // 修改属性类型
    frontMatter.value[currentFrontMatterIndex].type = type
    // 修改属性类型后，更新 frontMatterObject
    // frontMatterObject[frontMatter.value[currentFrontMatterIndex].name] =
    //   frontMatter.value[currentFrontMatterIndex].value;
  }

  menuVisible.value = false
}

const addPostAttribute = () => {
  /**
   * 添加文档属性
   */
  if (frontMatter.value.length !== 0 && !frontMatter.value[frontMatter.value.length - 1].name) {
    return
  }

  frontMatter.value.push({
    name: '',
    type: fronMatterValueType.string,
    value: '',
  })

  frontMatterChange()
}

const attributeNameInputComplate = (index: number) => {
  /**
   * 属性名输入框完成时触发
   * 用于验证属性名输入框的数据
   */
  const restoreOrRemoveAttribute = (index: number) => {
    /**
     * 恢复或删除错误的文档属性
     */
    if (frontMatterBack[index]) {
      frontMatter.value[index].name = frontMatterBack[index]
    } else {
      frontMatter.value.splice(index, 1)
    }
  }

  if (!frontMatter.value[index].name) {
    // 查看之前是否有值，有值恢复, 没有值删除
    restoreOrRemoveAttribute(index)
  } else {
    const existingIndex = frontMatterBack.findIndex(
      (item) => item === frontMatter.value[index].name,
    )
    if (existingIndex !== -1) {
      // 查看之前是否有值，有值恢复, 没有值删除
      restoreOrRemoveAttribute(index)
      return
    } else {
      // 达成条件，更新 frontMatterBack 和 frontMatterObject
      const originName = frontMatterBack[index]
      frontMatterBack[index] = frontMatter.value[index].name
      // 删除原来的键值
      delete frontMatterObject[originName]
      // 添加新的键值
      // frontMatterObject[frontMatter.value[index].name] =
      //   frontMatter.value[index].value;
    }
  }

  frontMatterChange()
}

const attributeValueInputComplate = (index: number) => {
  /**
   * 属性值输入框完成时触发
   * 用于验证属性值输入框的数据
   */

  // 直接更新值就好
  // frontMatterObject[frontMatter.value[index].name] =
  //   frontMatter.value[index].value;

  frontMatterChange()
}

const parseFrontMatter = (content: string) => {
  let parsedYaml = <Record<string, any>>{}
  if (content) {
    try {
      const match = content.match(/---\s*([\s\S]*?)\s*---/)
      if (match && match[1]) {
        parsedYaml = yaml.load(match[1]) as Record<string, any>
      } else {
        parsedYaml = {}
      }
    } catch (e) {
      console.error('Error parsing YAML:', e)
    }
  }

  return parsedYaml
}

const stringifyFrontMatter = (frontMatter: Record<string, any>) => {
  const timeData: Record<string, string> = {}

  for (const key in frontMatter) {
    const value = frontMatter[key]
    if (value instanceof Date) {
      const id = Math.random().toString(36)
      timeData[id] = format(value, settingsStore.settings['编辑器配置'].dateTimeFormat)
      frontMatter[key] = `${id}`
    }
  }

  let frontMatterString = yaml.dump(frontMatter)

  for (const key in timeData) {
    frontMatterString = frontMatterString.replace(`${key}`, timeData[key])
  }

  return `---\n${frontMatterString}---\n`
}

const frontMatterChange = () => {
  /**
   * frontMatter 内容变化时触发
   */
  for (let i = 0; i < frontMatter.value.length; i++) {
    const item = frontMatter.value[i]
    frontMatterObject[item.name] = item.value
  }
  emit('change', stringifyFrontMatter(frontMatterObject))
}
</script>

<template>
  <div class="front-matter">
    <el-input
      v-model="fileName"
      autosize
      type="textarea"
      placeholder="未命名"
      class="el-front-matter-custom post-title"
      style="margin: 20px 0"
    />
    <div class="front-matter-fold-bar" @click="isFrontMatterFold = !isFrontMatterFold">
      <span class="icon">
        <font-awesome-icon :icon="['fas', 'chevron-right']" v-if="isFrontMatterFold" />
        <font-awesome-icon :icon="['fas', 'chevron-down']" v-else />
      </span>
      <span>文档属性</span>
    </div>
    <div v-show="!isFrontMatterFold">
      <div class="front-matter-item" v-for="(item, index) in frontMatter">
        <el-input
          v-model="item.name"
          style="width: 240px"
          placeholder="输入属性名"
          class="el-front-matter-custom"
          autofocus
          @blur="attributeNameInputComplate(index)"
        >
          <template #prefix>
            <div @click="showTypeSelectMenu($event, index)">
              <font-awesome-icon
                class="type-icon"
                :icon="['fas', 'align-left']"
                size="xl"
                v-if="item.type === fronMatterValueType.string"
              />
              <font-awesome-icon
                class="type-icon"
                :icon="['fas', 'list']"
                size="xl"
                v-else-if="item.type === fronMatterValueType.array"
              />
              <font-awesome-icon
                class="type-icon"
                :icon="['fas', 'arrow-up-1-9']"
                size="xl"
                v-else-if="item.type === fronMatterValueType.number"
              />
              <font-awesome-icon
                class="type-icon"
                :icon="['fas', 'square-check']"
                size="xl"
                v-else-if="item.type === fronMatterValueType.boolean"
              />

              <font-awesome-icon
                class="type-icon"
                :icon="['fas', 'clock']"
                size="xl"
                v-else-if="item.type === fronMatterValueType.dateTime"
              />
            </div>
          </template>
        </el-input>
        <el-input
          v-model="item.value"
          placeholder="输入属性值（文本）"
          class="el-front-matter-custom"
          @blur="attributeValueInputComplate(index)"
          v-if="item.type === fronMatterValueType.string"
        />
        <el-input-tag
          v-model="item.value"
          placeholder="输入属性值（列表），Tip：回车可键入"
          class="el-front-matter-custom"
          @blur="attributeValueInputComplate(index)"
          v-if="item.type === fronMatterValueType.array"
        />
        <el-input-number
          v-model="item.value"
          controls-position="right"
          style="width: 100%"
          class="el-front-matter-custom"
          @blur="attributeValueInputComplate(index)"
          v-if="item.type === fronMatterValueType.number"
        />
        <el-switch
          v-model="item.value"
          style="
            --el-switch-on-color: #13ce66;
            --el-switch-off-color: #ff4949;
            width: 100%;
            padding: 0 10px;
          "
          @blur="attributeValueInputComplate(index)"
          v-if="item.type === fronMatterValueType.boolean"
        />

        <el-date-picker
          v-model="item.value"
          type="datetime"
          placeholder="选取日期和时间"
          style="width: 100%"
          class="el-front-matter-custom"
          @blur="attributeValueInputComplate(index)"
          v-if="item.type === fronMatterValueType.dateTime"
        />
      </div>
      <el-button style="margin: 10px" @click="addPostAttribute" type="" text>
        <template #default>
          <font-awesome-icon :icon="['fas', 'plus']" />
          添加属性
        </template>
      </el-button>
    </div>
    <context-menu v-model:show="menuVisible" :options="optionsComponent">
      <context-menu-group label="属性类型" icon="fas fa-plus">
        <context-menu-item
          label="文本"
          :clickClose="true"
          data-filetype="post"
          @click="changeAttributeType(fronMatterValueType.string)"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', 'align-left']" />
          </template>
        </context-menu-item>
        <context-menu-item
          label="列表"
          :clickClose="true"
          data-filetype="draft"
          @click="changeAttributeType(fronMatterValueType.array)"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', 'list']" />
          </template>
        </context-menu-item>

        <ContextMenuSeparator />

        <context-menu-item
          label="数字"
          :clickClose="true"
          data-filetype="file"
          @click="changeAttributeType(fronMatterValueType.number)"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', 'arrow-up-1-9']" />
          </template>
        </context-menu-item>
        <context-menu-item
          label="布尔值"
          :clickClose="true"
          data-filetype="file"
          @click="changeAttributeType(fronMatterValueType.boolean)"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', 'square-check']" />
          </template>
        </context-menu-item>

        <context-menu-item
          label="日期和时间"
          :clickClose="true"
          data-filetype="file"
          @click="changeAttributeType(fronMatterValueType.dateTime)"
        >
          <template #icon>
            <font-awesome-icon :icon="['fas', 'clock']" />
          </template>
        </context-menu-item>
      </context-menu-group>

      <context-menu-item label="剪贴" :clickClose="false">
        <template #icon>
          <font-awesome-icon :icon="['fas', 'i-cursor']" />
        </template>
      </context-menu-item>
      <context-menu-item label="复制" :clickClose="false">
        <template #icon> <font-awesome-icon :icon="['fas', 'copy']" /> </template
      ></context-menu-item>
      <context-menu-item label="粘贴" :clickClose="false">
        <template #icon> <font-awesome-icon :icon="['fas', 'paste']" /> </template
      ></context-menu-item>
      <context-menu-item label="删除" :clickClose="false">
        <template #icon>
          <font-awesome-icon :icon="['fas', 'trash']" style="color: var(--el-color-danger)" />
        </template>
      </context-menu-item>
    </context-menu>
  </div>
</template>

<style>
.el-front-matter-custom .el-input__wrapper,
.el-front-matter-custom .el-textarea__inner,
.el-front-matter-custom {
  box-shadow: none !important;
  border: none !important;
  resize: none;
}

.el-front-matter-custom .el-input__wrapper:focus-within,
.el-front-matter-custom .el-textarea__inner:focus-within,
.el-front-matter-custom:focus-within {
  background-color: var(--el-color-primary-light-7);
}
</style>

<style scoped>
.post-title {
  font-size: 28px;
  font-weight: bold;
  font-family: '微软雅黑', Courier, monospace;
}

.front-matter-fold-bar {
  margin: 20px;
  cursor: default;
  width: 100%;
  font-size: 18px;
  user-select: none;
  position: relative;
}

.front-matter-fold-bar .icon {
  position: absolute;
  font-size: 10px;
  left: -15px; /* 调整图标的位置 */
  top: 50%;
  transform: translateY(-50%);
}

.front-matter-item {
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.front-matter-item:focus-within {
  border: 1px solid var(--el-color-primary);
}

.type-icon {
  cursor: default;
}

.type-icon:hover {
  color: var(--el-color-primary);
}
</style>
