<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/api'
import { encryptToken } from '@/utils/general'
import { githubAppClientId, githubAppName } from '@/config'
import { useSettingsStore } from '@/stores'
import { validateLogin } from '@/utils/general'

const settingsStore = useSettingsStore()
const route = useRoute()
const router = useRouter()
const loading = ref(false) // whether to show loading
// the login method that user choose(github or token)
const loginMethod = ref('github')
const chooseRepo = ref(false) // whether to choose repo
const remember = ref<boolean>(false) // whether to remember the token
// the token that user input, just for token login
const inputToken = ref<string>('')
// the list of repos that user has access to
const repoList = ref<{ label: string; value: string }[]>([])
const branchList = ref<{ label: string; value: string }[]>([])

const repoName = computed(() => settingsStore.settings.repoName)

const updateBranchList = async (repo: string) => {
  api.repo = repo
  branchList.value = []
  const branches = await api.getRepoBranches()

  if (!branches) return

  branches.forEach((branch) => {
    branchList.value.push({ label: branch.name, value: branch.name })
  })
}

watch(repoName, async (newVal) => {
  if (newVal) {
    await updateBranchList(newVal || '')
  }
})

let access_token: string

const checkLoginState = async (access_token: string) => {
  const { tokenValid, repoValid, hasPushAccess, branchValid, installedApp } = await validateLogin(
    access_token,
    settingsStore.settings.repoName,
    settingsStore.settings.repoBranch,
  )

  console.log(settingsStore.settings.repoName, settingsStore.settings.repoBranch)
  console.log(tokenValid, repoValid, hasPushAccess, branchValid, installedApp)

  if (tokenValid && remember.value) {
    // 选择了记住登录，将token保存到本地
    localStorage.setItem('access_token', encryptToken(access_token as string) || '')
  }

  if (!tokenValid) {
    ElMessage.error('Token无效，请重新登录')
    return
  } else if (!repoValid || !branchValid) {
    ElMessage.error('仓库/分支不存在或无权限')
    chooseRepo.value = true
    const repos = await api.getRepoNames()
    repos.forEach((repo) => {
      repoList.value.push({ label: repo.name, value: repo.name })
    })
    if (repoName.value) {
      updateBranchList(repoName.value)
    }
    return
  } else if (!hasPushAccess) {
    ElMessage.error('无推送权限，请重新登录')
    return
  } else if (!installedApp && loginMethod.value === 'github') {
    ElMessage.error('请先安装应用')
    // 重定向到安装应用页面
    window.location.href = `https://github.com/apps/${githubAppName}/installations/new`
    return
  }

  // 登录成功
  console.log('登录成功')

  // 同步远程设置
  await settingsStore.syncRemoteSettings()

  router.push({ name: 'launch' })
  return
}

onMounted(async () => {
  // 获取本地存储的 remember 和 loginMethod
  const rememberValue = localStorage.getItem('remember')
  remember.value = rememberValue === 'true' ? true : false

  const loginMethodValue = localStorage.getItem('loginMethod')
  loginMethod.value = loginMethodValue || 'github'

  // 获取查询参数, access_token 和 repo
  access_token = route.query.access_token as string

  // 记录repo Todo: 逻辑移动到LunchView
  // if (route.query.repo) {
  //   settingsStore.settings.repoName = route.query.repo as string
  // }

  // 如果存在 access_token,进行验证
  if (access_token) {
    loading.value = true // 清除查询参数
    router.replace({ query: {} })

    loading.value = true
    await checkLoginState(access_token as string)
    loading.value = false
  }
})

const changeRemember = (e: unknown) => {
  localStorage.setItem('remember', (e as boolean).toString())
}

const loginByToken = async () => {
  localStorage.setItem('loginMethod', 'token')
  if (!inputToken.value) {
    ElMessage.error('请输入Token')
    return
  } else {
    access_token = inputToken.value

    if (remember.value) {
      localStorage.setItem('access_token', encryptToken(access_token as string) || '')
    }
    // 验证
    loading.value = true
    await checkLoginState(access_token as string)
    loading.value = false
  }
}

const loginByGithub = async () => {
  localStorage.setItem('loginMethod', 'github')
  // 获取当前查询参数
  const params = new URLSearchParams(
    Object.entries(route.query).map(([key, value]) => [key, value as string]),
  )
  // 检查是否已经存在 time 参数
  if (params.has('time')) {
    // 更新 time 参数的值
    params.set('time', Date.now().toString())
  } else {
    // 添加新的 time 参数
    params.append('time', Date.now().toString())
  }
  // 使用 router.push 更新 URL 的查询参数而不刷新页面
  await router.push({ query: { ...route.query, time: params.get('time') } })
  await nextTick()

  const currentUrl = window.location.href
  const url = `https://github.com/login/oauth/authorize?client_id=${githubAppClientId}&state=${encodeURIComponent(
    currentUrl,
  )}`

  window.location.replace(url)
  loading.value = true
}

const setRepoLogin = async () => {
  // 验证
  console.log('repoName', settingsStore.settings.repoName)
  loading.value = true
  await checkLoginState(access_token as string)
  loading.value = false
}

const jumpLogin = () => {
  localStorage.setItem('jumpLogin', 'true') // 添加跳过登录标记
  // 更改设置中当前仓库为 inkstone.local 以便后续存储文件
  settingsStore.settings.repoName = 'inkstone.local'
  router.replace({ name: 'main' })
}
</script>

<template>
  <div class="container">
    <div class="card" v-loading="loading">
      <div class="left">
        <el-image
          style="height: 300px"
          src="/img/login_cover.jpg"
          fit="cover"
          class="cover-image"
        />
      </div>
      <div class="right" v-if="!chooseRepo">
        <div class="title-box">
          <h2>后台登录</h2>
          <el-tooltip
            class="box-item"
            effect="dark"
            content="跳过登录，只使用编辑器基础功能"
            placement="right-start"
          >
            <el-tag class="jump" type="primary" effect="light" @click="jumpLogin">跳过</el-tag>
          </el-tooltip>
        </div>
        <div>
          <el-button
            v-if="loginMethod === 'github'"
            type="primary"
            size="large"
            @click="loginByGithub"
          >
            授权登录
            <font-awesome-icon class="el-icon--right" :icon="['fab', 'github']" size="2xl" />
          </el-button>
          <el-input v-else v-model="inputToken" clearable show-password placeholder="请输入Token">
            <template #append>
              <el-button type="primary" @click="loginByToken">登录</el-button>
            </template>
          </el-input>
        </div>
        <div class="options">
          <span class="remember-me">
            <el-tooltip
              class="box-item"
              effect="dark"
              content="Token将被保存到本地，请注意秘钥安全"
              placement="top"
            >
              <el-checkbox v-model="remember" @change="changeRemember">保持登录</el-checkbox>
              <!-- <el-radio :value="true" v-model="remember" @click="changeRemember"></el-radio> -->
            </el-tooltip>
          </span>
          <span class="login-methods">
            <el-tooltip class="box-item" effect="dark" content="Github 授权登录" placement="top"
              ><font-awesome-icon
                :icon="['fab', 'github']"
                :class="loginMethod === 'github' ? 'select' : ''"
                @click="loginMethod = 'github'"
                size="xl"
                style="margin-right: 20px"
            /></el-tooltip>

            <el-tooltip class="box-item" effect="dark" content="手动输入Token登录" placement="top"
              ><font-awesome-icon
                :icon="['fas', 'key']"
                :class="loginMethod === 'token' ? 'select' : ''"
                @click="loginMethod = 'token'"
                size="xl"
            /></el-tooltip>
          </span>
        </div>
      </div>
      <div class="right" v-else>
        <div>
          <h2>选择仓库</h2>
        </div>
        <div>
          <el-select
            v-model="settingsStore.settings.repoName"
            placeholder="请选择将要使用的仓库"
            size="large"
            style="width: 240px"
          >
            <el-option
              v-for="item in repoList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>

          <el-select
            v-model="settingsStore.settings.repoBranch"
            placeholder="请选择将要使用的分支"
            size="large"
            style="width: 240px"
          >
            <el-option
              v-for="item in branchList"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
        <div>
          <el-button type="primary" size="large" @click="setRepoLogin"> 登录 </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f0f0;
}

.card {
  display: flex;
  width: 500px;
  height: 300px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
  background-color: #fff;
}

.left {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #e0e0e0;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.title-box {
  display: flex;
  justify-content: center;
  align-items: end;
  cursor: default;
}

.title-box .jump {
  margin-left: 10px;
  font-size: 14px;
}

.right {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}

.right .options {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.right .options .login-methods {
  display: flex;
  justify-content: center;
  align-items: center;
}

.right .options .login-methods font-awesome-icon {
  margin: 0 5px;
  cursor: pointer;
}

.right .options .login-methods .select {
  /* border: 3px solid var(--el-color-primary);
  border-radius: 100%; */
  color: var(--el-color-primary);
}

/* .right h2 {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
} */

.login-button {
  width: 100%;
  padding: 10px;
  margin-bottom: 20px;
  background-color: #42b983;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
}

.remember-me {
  display: flex;
  justify-content: center;
  align-items: center;
}

.remember-me input {
  margin-right: 10px;
}
</style>
