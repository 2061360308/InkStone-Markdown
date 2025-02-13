import { useSettingsStore } from '@/stores'
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
}

export const validateLoginAfter = async () => {
  const settingsStore = useSettingsStore()

  const start_time = Date.now()

  const access_token = decryptToken(localStorage.getItem('access_token') || '')

  // 如果存在 access_token,进行验证
  if (access_token) {
    const { tokenValid, repoValid, hasPushAccess, branchValid, installedApp } = await validateLogin(
      access_token,
      settingsStore.settings['基本配置'].repoName,
      settingsStore.settings['基本配置'].repoBranch,
    )
    if (tokenValid && repoValid && hasPushAccess && branchValid) {
      // 判断登录方式，如果是通过GithubApp自动登录的，需要验证是否安装应用
      const loginMethodValue = localStorage.getItem('loginMethod')
      if (loginMethodValue === 'github' && !installedApp) {
        localStorage.removeItem('access_token')
      }
    } else {
      // 验证失败，清除本地token
      localStorage.removeItem('access_token')
    }
  }

  console.log('API验证完成, 耗时：', Date.now() - start_time, api.ready)
}
