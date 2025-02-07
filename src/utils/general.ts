import CryptoJS from 'crypto-js'
import api from '@/utils/api'

export const generateRandomId = (length: number) => {
  let result = ''
  const characters = 'abcdefghijklmnopqrstuvwxyz'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

// 使用用户输入的密码加密 Token
export function encryptToken(
  token: string,
  password: string = 'A1b2C3d4E5f6G7h8I9j0K!@#',
): string | null {
  try {
    const encrypted = CryptoJS.AES.encrypt(token, password).toString()
    return encrypted
  } catch (error) {
    console.error(error)
    return null
  }
}

// 使用已知 Token 和用户输入的密码解密
export function decryptToken(
  encryptedToken: string,
  password: string = 'A1b2C3d4E5f6G7h8I9j0K!@#',
): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, password)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    return decrypted
  } catch (error) {
    console.error(error)
    return null
  }
}

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
