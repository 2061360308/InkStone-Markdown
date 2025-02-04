import api from '@/utils/api'

interface validateResult {
  tokenValid: boolean
  repoValid: boolean
  hasPushAccess: boolean
  branchValid: boolean
  installedApp: boolean
}

export const validateLogin = async (
  access_token: string,
  repo: string,
  branch: string,
): Promise<validateResult> => {
  const { tokenValid, repoValid, hasPushAccess, branchValid, installedApp } = await api.init(
    repo,
    access_token as string,
    branch,
  )

  return { tokenValid, repoValid, hasPushAccess, branchValid, installedApp }

  // if (!tokenValid) {
  //   ElMessage.error('Token无效，请重新登录')
  //   loading.value = false
  //   return
  // } else if (!repoValid || !branchValid) {
  //   ElMessage.error('仓库/分支不存在或无权限')
  //   chooseRepo.value = true
  //   const repos = await api.getRepoNames()
  //   repos.forEach((repo) => {
  //     repoList.value.push({ label: repo.name, value: repo.name })
  //   })
  //   if (repoName.value) {
  //     updateBranchList(repoName.value)
  //   }
  //   loading.value = false
  //   return
  // } else if (!hasPushAccess) {
  //   ElMessage.error('无推送权限，请重新登录')
  //   loading.value = false
  //   return
  // } else if (!installedApp) {
  //   ElMessage.error('请先安装应用')
  //   // 重定向到安装应用页面
  //   window.location.href = `https://github.com/apps/${githubAppName}/installations/new`
  //   return
  // }

  // // 登录成功

  // // 同步远程设置
  // await settingsStore.syncRemoteSettings()

  // return
}
