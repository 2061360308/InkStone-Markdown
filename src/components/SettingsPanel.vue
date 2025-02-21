<script lang="ts" setup>
import { ref, onMounted, watch, Ref, h, VNode } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { useSettingsStore, useContexStore } from '@/stores'
import api from '@/utils/api'
import imagehosting from '@/utils/imagehosting'
import { validateLoginAfter } from '@/utils/general'
import { useRouter } from 'vue-router'
import SettingsItem from './SettingsItem.vue'
import { storeToRefs } from 'pinia'
import { listThemes, uploadTheme, deleteTheme } from '@/utils/theme'
import { ElTooltip } from 'element-plus'

// 声明全局有document
declare const document: Document

const settingsStore = useSettingsStore()
const contexStore = useContexStore()
const router = useRouter()
const loading = ref(false)

const containerRef = ref<HTMLElement | null>(null)
const imagehostingUseable: Ref<boolean> = ref(imagehosting.ready)

const getAllReposName = async (): Promise<string[]> => {
  const result: string[] = []
  const repos = await api.getRepoNames()

  repos.forEach(
    (repo: {
      id: number
      node_id: string
      name: string
      full_name: string
      license: {
        key: string
        name: string
        url: string | null
        spdx_id: string | null
        node_id: string
        html_url?: string | undefined
      } | null
      [key: string]: unknown
    }) => {
      result.push(repo.name)
      // ;(settingsStore.selectInputOptions.repoName as unknown as string[]).push(repo.name)
    },
  )
  return result
}

const allReposName: Ref<string[]> = ref([])
const allReposBranches: Ref<string[]> = ref([])

type settingsPanelDataItemType =
  | 'line'
  | 'text'
  | 'number'
  | 'select'
  | 'color'
  | 'boolean'
  | 'custom'

interface settingsPanelDataItem {
  title: string
  settingItem: Ref<unknown>
  description: {
    html: boolean
    content: string
  }
  type: settingsPanelDataItemType
  custom?: VNode
  selectOptions?: string[]
}

const {
  themeName,
  repoName,
  repoBranch,
  repoPath,
  defaultFrontMatter,
  dateTimeFormat,
  editorDefaultMode,
  editorMaxWidth,
  editorTypewriterMode,
  editorAutoSpace,
  editorGfmAutoLink,
  bucket,
  endpoint,
  region,
  accessKeyId,
  secretAccessKey,
  rootUrl,
  defaultImageLinkString,
} = storeToRefs(settingsStore)

const AllThemesName: Ref<string[]> = ref([])

const currentHoverThemeItem: Ref<string | null> = ref(null)

const themeDateItem: settingsPanelDataItem = {
  title: '主题',
  settingItem: themeName,
  description: {
    html: false,
    content: '主题名称：用于设置应用程序的主题样式。',
  },
  type: 'select',
  selectOptions: ['default'],
  custom: h(
    ElFormItem,
    // { label: '主题' },
    {},
    {
      label: () =>
        h(
          'div',
          { style: 'display: flex; align-items: center;' },
          {
            default: () => [
              h('div', { style: 'margin-right: 5px;' }, { default: () => '主题' }),
              h(
                ElTooltip,
                {
                  placement: 'right-start',
                  rawContent: true,
                  content: `<p>更改或管理编辑器的主题。</p><p>你可以在这里查看更多有关主题的信息<a style="color:#4dbbf7" target="_blank" href="https:inkstone.work/">官方文档</a></p>`,
                },
                { default: () => h(FontAwesomeIcon, { icon: ['fas', 'circle-question'] }) },
              ),
            ],
          },
        ),
      default: () =>
        h(
          'div',
          { style: 'display: flex; align-items: center;' },
          {
            default: () => [
              h(
                ElSelect,
                {
                  modelValue: themeName.value,
                  'onUpdate:modelValue': (val: string) => {
                    themeName.value = val
                  },
                  placeholder: '选择主题',
                  style: 'min-width: 180px;',
                },
                {
                  default: () =>
                    AllThemesName.value.map((option) =>
                      h(
                        ElOption,
                        { label: option, value: option },
                        {
                          default: () => [
                            h(
                              'div',
                              {
                                style:
                                  'display: flex; justify-content: space-between;align-items: center; gap:15px;',
                                onmouseenter: () => (currentHoverThemeItem.value = option),
                                onmouselave: () => (currentHoverThemeItem.value = null),
                              },
                              {
                                default: () => [
                                  ,
                                  h(
                                    'div',
                                    {
                                      style:
                                        'width:140px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;',
                                    },
                                    { default: () => option },
                                  ),
                                  h(
                                    ElButton,
                                    {
                                      type: 'danger',
                                      plain: true,
                                      size: 'small',
                                      style: `display: ${
                                        currentHoverThemeItem.value === option &&
                                        currentHoverThemeItem.value != 'default'
                                          ? 'block'
                                          : 'none'
                                      }`,
                                      onClick: async (event) => {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        ElMessageBox.confirm('确定要删除主题吗？', 'Warning', {
                                          confirmButtonText: '删除',
                                          cancelButtonText: '取消',
                                          type: 'warning',
                                        })
                                          .then(async () => {
                                            const result = await deleteTheme(option)
                                            if (result) {
                                              AllThemesName.value = await listThemes()
                                              ElMessage({
                                                type: 'success',
                                                message: '删除主题成功',
                                              })
                                            } else {
                                              ElMessage({
                                                type: 'error',
                                                message: '删除主题失败',
                                              })
                                            }
                                          })
                                          .catch(() => {
                                            ElMessage({
                                              type: 'info',
                                              message: 'delete canceled',
                                            })
                                          })
                                      },
                                    },
                                    {
                                      default: () => [
                                        h(FontAwesomeIcon, { icon: ['fas', 'trash'] }),
                                        '',
                                      ],
                                    },
                                  ),
                                ],
                              },
                            ),
                          ],
                        },
                      ),
                    ),
                },
              ),
              h(
                ElButton,
                {
                  type: 'primary',
                  style: 'margin-left: 10px;',
                  onClick: () => {
                    document.getElementById('themeFileInput')?.click()
                  },
                },
                {
                  default: () => [h(FontAwesomeIcon, { icon: ['fas', 'upload'] }), '加载本地主题'],
                },
              ),
              h(
                ElButton,
                { type: 'success', style: 'margin-left: 10px;' },
                { default: () => [h(FontAwesomeIcon, { icon: ['fas', 'shirt'] }), '获取更多主题'] },
              ),
              h('input', {
                id: 'themeFileInput',
                type: 'file',
                accept: '.zip',
                style: 'display: none;',
                onChange: async (event) => {
                  const input = event.target as HTMLInputElement
                  if (input.files && input.files.length > 0) {
                    const file = input.files[0]
                    const result = await uploadTheme(file)
                    if (result) {
                      AllThemesName.value = await listThemes()
                      ElMessage({
                        type: 'success',
                        message: '添加主题成功',
                      })
                    } else {
                      ElMessage({
                        type: 'error',
                        message: '添加主题失败',
                      })
                    }
                  }
                },
              }),
            ],
          },
        ),
    },
  ),
}

const repoNameDateItem: settingsPanelDataItem = {
  title: '仓库名称',
  settingItem: repoName,
  description: {
    html: false,
    content: '仓库名称：指定远程仓库的名称。',
  },
  type: 'select',
  selectOptions: allReposName.value,
}

const repoBranchDateItem: settingsPanelDataItem = {
  title: '分支名称',
  settingItem: repoBranch,
  description: {
    html: false,
    content: '分支名称：指定远程仓库的分支。',
  },
  type: 'select',
  selectOptions: allReposBranches.value,
}

const repoPathDateItem: settingsPanelDataItem = {
  title: '仓库路径',
  settingItem: repoPath,
  description: {
    html: false,
    content: '仓库路径：指定远程仓库的路径。',
  },
  type: 'line',
}

const defaultFrontMatterDateItem: settingsPanelDataItem = {
  title: '默认 front matter',
  settingItem: defaultFrontMatter,
  description: {
    html: true,
    content:
      '<p>默认 front matter：用于新建文件时的默认 front matter 配置。</p><p>书写格式见<a style="color:#4dbbf7" target="_blank" href="https:inkstone.work/">官方文档</a></p>',
  },
  type: 'text',
}

const dateTimeFormatDateItem: settingsPanelDataItem = {
  title: '日期时间格式',
  settingItem: dateTimeFormat,
  description: {
    html: false,
    content: '日期时间格式：用于设置日期时间的显示格式。',
  },
  type: 'line',
}

const editorDefaultModeDateItem: settingsPanelDataItem = {
  title: '编辑器默认模式',
  settingItem: editorDefaultMode,
  description: {
    html: false,
    content: '编辑器默认模式：用于设置编辑器的默认模式。',
  },
  type: 'select',
  selectOptions: ['wysiwyg', 'ir', 'sv'],
}

const editorMaxWidthDateItem: settingsPanelDataItem = {
  title: '编辑器最大宽度',
  settingItem: editorMaxWidth,
  description: {
    html: false,
    content: '编辑器最大宽度：用于设置编辑器的最大宽度。',
  },
  type: 'number',
}

const editorTypewriterModeDateItem: settingsPanelDataItem = {
  title: '打字机模式',
  settingItem: editorTypewriterMode,
  description: {
    html: false,
    content: '编辑器打字机模式：用于设置编辑器的打字机模式。',
  },
  type: 'boolean',
}

const editorAutoSpaceDateItem: settingsPanelDataItem = {
  title: '自动空格',
  settingItem: editorAutoSpace,
  description: {
    html: false,
    content: '编辑器自动空格：用于设置编辑器的自动空格。',
  },
  type: 'boolean',
}

const editorGfmAutoLinkDateItem: settingsPanelDataItem = {
  title: 'GFM 自动链接',
  settingItem: editorGfmAutoLink,
  description: {
    html: false,
    content: '编辑器 GFM 自动链接：用于设置编辑器的 GFM 自动链接。',
  },
  type: 'boolean',
}

const bucketDateItem: settingsPanelDataItem = {
  title: 'Bucket',
  settingItem: bucket,
  description: {
    html: false,
    content: 'bucket名字',
  },
  type: 'line',
}

const endpointDateItem: settingsPanelDataItem = {
  title: 'Endpoint',
  settingItem: endpoint,
  description: {
    html: false,
    content: 'endpoint，例如：https://cos.ap-chengdu.myqcloud.com',
  },
  type: 'line',
}

const regionDateItem: settingsPanelDataItem = {
  title: 'Region',
  settingItem: region,
  description: {
    html: false,
    content: 'region，例如：ap-chengdu',
  },
  type: 'line',
}

const accessKeyIdDateItem: settingsPanelDataItem = {
  title: 'AccessKeyId',
  settingItem: accessKeyId,
  description: {
    html: false,
    content: 'accessKeyId',
  },
  type: 'line',
}

const secretAccessKeyDateItem: settingsPanelDataItem = {
  title: 'SecretAccessKey',
  settingItem: secretAccessKey,
  description: {
    html: false,
    content: 'secretAccessKey',
  },
  type: 'line',
}

const rootUrlDateItem: settingsPanelDataItem = {
  title: 'RootUrl',
  settingItem: rootUrl,
  description: {
    html: false,
    content: '图床根的URL',
  },
  type: 'line',
}

const defaultImageLinkStringDateItem: settingsPanelDataItem = {
  title: '默认图片链接字符串',
  settingItem: defaultImageLinkString,
  description: {
    html: true,
    content:
      '<p>默认插入图片链接的字符串</p><p>书写格式见<a style="color:#4dbbf7" target="_blank" href="https:inkstone.work/">官方文档</a></p>',
  },
  type: 'line',
}

interface SettingsPanelCategoryItem {
  id: string
  title: string
  vnodeTitle?: VNode
  items: settingsPanelDataItem[]
  startCustom?: VNode
  endCustom?: VNode
}

const baseCategory: SettingsPanelCategoryItem = {
  id: 'base',
  title: '基础设置',
  items: [themeDateItem, repoNameDateItem, repoBranchDateItem, repoPathDateItem],
}

const editorCategory: SettingsPanelCategoryItem = {
  id: 'editor',
  title: '编辑器设置',
  items: [
    defaultFrontMatterDateItem,
    dateTimeFormatDateItem,
    editorDefaultModeDateItem,
    editorMaxWidthDateItem,
    editorTypewriterModeDateItem,
    editorAutoSpaceDateItem,
    editorGfmAutoLinkDateItem,
  ],
}

const imagehostingCategory: SettingsPanelCategoryItem = {
  id: 'imagehosting',
  title: '图床设置',
  vnodeTitle: h(
    'div',
    {
      style:
        'font-size: 20px; font-weight: bold; margin-bottom: 10px; padding: 10px; border-bottom: 2px solid var(--el-border-color);',
    },
    {
      default: () => {
        if (imagehostingUseable.value) {
          return [
            '图床设置',
            h('span', {
              class: `pilot-lamp useable`,
              style:
                'display: inline-block;width: 15px; height: 15px; border-radius: 50%; margin-left: 5px; background-color: var(--el-color-success);',
            }),
            h(ElTag, { type: 'success', style: 'margin-left: 10px;' }, '当前配置：可用'),
          ]
        } else {
          return [
            '图床设置',
            h('span', {
              class: `pilot-lamp useable`,
              style:
                'display: inline-block; width: 15px; height: 15px; border-radius: 50%; margin-left: 5px; background-color: var(--el-color-danger);',
            }),
            h(ElTag, { type: 'danger', style: 'margin-left: 10px;' }, '当前配置：不可用'),
          ]
        }
      },
    },
  ),
  items: [
    bucketDateItem,
    endpointDateItem,
    regionDateItem,
    accessKeyIdDateItem,
    secretAccessKeyDateItem,
    rootUrlDateItem,
    defaultImageLinkStringDateItem,
  ],
}

const categories: SettingsPanelCategoryItem[] = [baseCategory, editorCategory, imagehostingCategory]

watch(
  [bucket, endpoint, region, accessKeyId, secretAccessKey],
  async ([newBucket, newEndpoint, newRegion, newAccessKeyId, newSecretAccessKey]) => {
    const result = await imagehosting.init(
      newBucket as string,
      newEndpoint as string,
      newRegion as string,
      newAccessKeyId as string,
      newSecretAccessKey as string,
    )

    // Todo: 更新图床可用状态
    if (!result) {
      imagehostingUseable.value = false
    } else {
      imagehostingUseable.value = true
    }
  },
)

const updataBranchesOptions = async () => {
  allReposBranches.value = []
  const branches = await api.getRepoBranches()

  if (!branches) return

  branches.forEach((branch: { name: string; commit: { sha: string; url: string } }) => {
    allReposBranches.value.push(branch.name)
  })
}

const updateRepo = async () => {
  // 更新api配置
  const access_token = localStorage.getItem('access_token')
  if (!access_token) {
    router.replace({ name: 'launch' })
    return
  }

  loading.value = true
  validateLoginAfter()

  await updataBranchesOptions()

  // 当前分支不在分支选项中时，自动选择第一个分支
  const currentBranch = settingsStore.settings.repoBranch.value

  if (!allReposBranches.value.includes(currentBranch)) {
    if (allReposBranches.value.length > 0) {
      repoBranch.value = allReposBranches.value[0]
      api.branch = repoBranch.value // 更新api配置
    }
  }

  loading.value = false
}

watch(repoName, updateRepo)

watch(repoBranch, async () => {
  // 更新api配置
  api.branch = repoBranch.value
})

/**
const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', 'Warning', {
    confirmButtonText: '退出',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      localStorage.removeItem('access_token')
      api.ready = false
      router.replace({ name: 'launch' })
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: 'logout canceled',
      })
    })
}
    */

const userInfo: Ref<Record<string, unknown>> = ref({})

const isNarrowscreen = storeToRefs(contexStore).isNarrowscreen

onMounted(async () => {
  // 初始化时更新仓库选项
  AllThemesName.value = await listThemes()
  console.log('AllThemesName', await listThemes())

  if (!api.ready) {
    allReposName.value = await getAllReposName()

    allReposBranches.value = []

    const result = await api.getUserInfo()
    if (result) {
      userInfo.value = result
    }
  }
})
</script>

<template>
  <div class="main" v-loading="loading">
    <div class="settings-box" ref="containerRef">
      <el-form label-position="top">
        <div v-for="category in categories" :key="category.id" :id="'category-' + category.id">
          <component v-if="category.vnodeTitle" :is="category.vnodeTitle" />
          <div class="setting-category-title" v-else>{{ category.title }}</div>
          <component v-if="category.startCustom" :is="category.startCustom" />
          <SettingsItem
            v-for="item in category.items"
            :key="item.title"
            v-model="item.settingItem.value"
            :title="item.title"
            :description="item.description.content"
            :rawContent="item.description.html"
            :type="item.type"
            :option="item.selectOptions || []"
            :custom="item.custom"
          />
          <component v-if="category.endCustom" :is="category.endCustom" />
        </div>
      </el-form>
      <div style="height: 100px"></div>
    </div>
    <div class="slider-anchors" v-if="!isNarrowscreen">
      <!--
      <div class="user-box" v-if="api.ready">
        <a :href="userInfo.html_url as string" target="_blank">
          <el-image :src="userInfo.avatar_url + '&48'" />
          <div class="info">
            <div class="name">{{ userInfo.name }}</div>
            <div class="bio">{{ userInfo.bio }}</div>
            <div class="login">{{ userInfo.login }}</div>
          </div>
        </a>
        <el-button type="danger" plain style="width: 100%" @click="logout"> 退出登录 </el-button>
      </div>
      -->
      <el-anchor :container="containerRef" direction="vertical" type="default" :offset="30">
        <el-anchor-link
          :href="'#category-' + category.id"
          @click="
            (event) => {
              event.preventDefault()
              const anchor = document.getElementById('category-' + category.id)
              if (anchor) {
                anchor.scrollIntoView()
              }
            }
          "
          v-for="category in categories.map((category) => category)"
          :key="category.id"
          :title="category.title"
        />
      </el-anchor>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main {
  display: flex;
  width: 100%;
  height: 100%;

  .settings-box {
    flex: 1;
    height: 100%;
    overflow: auto;
    padding: 20px;

    .setting-category-title {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 10px;
      padding: 10px;
      border-bottom: 2px solid var(--el-border-color);
    }
  }

  .slider-anchors {
    border-left: 1px solid var(--el-border-color);
    width: 230px;
    padding: 10px;
  }
}

.user-box {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  margin-bottom: 20px;

  .el-image {
    width: 150px;
    height: 150px;
    border-radius: 50%;
    margin-bottom: 20px;
  }
  .info {
    position: absolute;
    top: 0;
    left: auto;

    width: 150px;
    height: 150px;
    padding: 10px;
    border-radius: 50%;
    margin-top: 20px;
    background-color: rgba(0, 0, 0, 0.6);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: end;
    align-items: center;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover .info {
    opacity: 1;
  }

  .name {
    font-size: 25px;
    font-weight: bold;
  }

  .bio {
    font-size: 14px;
    /* color: var(--el-text-color-secondary); */
  }

  .login {
    font-size: 14px;
    /* color: var(--el-text-color-secondary); */
  }
}
</style>
