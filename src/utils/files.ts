export interface localFile {
  path: string
  repo: string
}

export interface remoteFile {
  path: string
  repo: string
  user: string
  branch: string
  content: string
}

export type nativeFile = FileSystemFileHandle
