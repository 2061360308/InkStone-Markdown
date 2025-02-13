import S3ImageHosting from 's3-image-hosting'
import { Settings, ImageType } from 's3-image-hosting/types/index.d'

class ImageHosting {
  static instance: ImageHosting
  s3: S3ImageHosting | null = null
  ready: boolean = false

  constructor() {
    if (ImageHosting.instance) {
      return ImageHosting.instance
    }

    ImageHosting.instance = this
  }

  init = async (
    bucket: string,
    endpoint: string,
    region: string,
    accessKeyId: string,
    secretAccessKey: string,
  ): Promise<boolean> => {
    const settings: Settings = {
      bucket, // bucket name
      endpoint, // endpoint eg: https://cos.ap-chengdu.myqcloud.com
      region, // region eg: ap-chengdu
      accessKeyId,
      secretAccessKey,
    }

    this.s3 = new S3ImageHosting(settings)

    const result = await this.s3.checkSettingsValid()

    if (result) {
      this.ready = true
      return true
    } else {
      this.ready = true
      return false
    }
  }

  upload = async (
    files: File[],
  ): Promise<{
    success: Array<{ file: File; hash: string }>
    failed: Array<File>
  }> => {
    const failed: Array<File> = []
    const success: Array<{ file: File; hash: string }> = []

    if (!this.ready || !this.s3) {
      return {
        success: [],
        failed: files,
      }
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const arrayBuffer = await file.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      // 判断文件是否已经存在
      const hash = await this.s3.calculateHash(uint8Array)
      const exist = await this.s3.isExistImage(hash)
      if (exist) {
        success.push({
          file,
          hash,
        })
        continue
      }

      const current = new Date()
      const fileExtension = file.name.split('.').pop() || '' // 文件后缀，标识图片类型的
      if (!['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
        failed.push(file)
        continue
      }
      const res = await this.s3.uploadImage(
        uint8Array,
        fileExtension as ImageType,
        current,
        current,
        '',
        [],
      )
      if (res.success) {
        success.push({
          file,
          hash: res.hash as string,
        })
      } else {
        failed.push(file)
      }
    }

    return {
      success,
      failed,
    }
  }
}

const instance = new ImageHosting()

export default instance

export const convertImagesToMarkdownBase64 = async (
  files: File[],
): Promise<Array<{ file: File; url: string }>> => {
  const promises = files.map((file) => {
    return new Promise<{ file: File; url: string }>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = reader.result as string
        resolve({ file: file, url: base64String })
      }
      reader.onerror = (error) => {
        reject(error)
      }
      reader.readAsDataURL(file)
    })
  })

  return Promise.all(promises)
}
