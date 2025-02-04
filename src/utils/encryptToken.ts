import CryptoJS from 'crypto-js'

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
