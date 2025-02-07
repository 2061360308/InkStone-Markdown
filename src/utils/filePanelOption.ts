import { ref } from 'vue'
import { useContexStore } from '@/stores'
import { generateRandomId } from '@/utils/general'

export const openNativeFile = async (fileHandle: FileSystemFileHandle) => {
  /**
   * 打开用户本机上的文件
   **/
  const contexStore = useContexStore()

  const path = `${fileHandle.name} @local`
  const title = ref(path.split('/').pop() || '')

  const panelName = 'nativeFile'

  // 防止重复打开, 同时处理同名文件
  for (const tab of contexStore.tabs) {
    if (tab.panel === panelName) {
      const isSame = await fileHandle.isSameEntry(tab.data.file as nativeFile)
      if (isSame) {
        contexStore.setActiveTab(tab.id)
        return
      } else {
        // 如果不是同一个文件，但是文件名相同，修改标题,添加随机id
        title.value = path + `- ${generateRandomId(4)}`
        tab.title.value = path + `- ${generateRandomId(4)}`
      }
    }
  }

  // let repo = 'instone.native'

  // 获取后缀
  const ext = fileHandle.name.split('.').pop()?.toLowerCase()

  const newtab = {
    id: '',
    panel: panelName,
    icon: ref(ext === 'md' ? 'faM' : 'faFile'),
    title,
    data: {
      file: fileHandle,
    },
  }

  contexStore.addTab(newtab)
}

export const openRemoteFile = async (path: string, repo: string, branch: string) => {
  // 打开远程的文件，远程文件为只读模式

  const contexStore = useContexStore()

  const panelName = 'remoteFile'

  const title = ref((path.split('/').pop() || '') + ' @remote')

  // 防止重复打开
  for (const tab of contexStore.tabs) {
    if (tab.panel === panelName) {
      if (
        tab.data.file &&
        (tab.data.file as remoteFile).path === path &&
        (tab.data.file as remoteFile).repo === repo
      ) {
        contexStore.setActiveTab(tab.id)
        return
      }

      // 有同名文件，展示完整路径
      if (tab.title.value === title.value) {
        title.value = path + ' @remote'
        tab.title.value = (tab.data.file as remoteFile).path + ' @remote'
      }
    }
  }

  const ext = path.split('.').pop()?.toLowerCase()

  const newtab = {
    id: '',
    panel: panelName,
    icon: ref(ext === 'md' ? 'faM' : 'faFile'),
    title,
    data: {
      file: {
        path,
        repo,
        user: '',
        branch,
        content: '',
      },
    },
  }

  contexStore.addTab(newtab)
}

export const openLocalFile = (path: string, repo: string) => {
  const contexStore = useContexStore()

  const panelName = 'localFile'

  // 防止重复打开
  for (const tab of contexStore.tabs) {
    if (tab.panel === panelName) {
      if (
        tab.data.file &&
        (tab.data.file as localFile).path === path &&
        (tab.data.file as localFile).repo === repo
      ) {
        contexStore.setActiveTab(tab.id)
        return
      }
    }
  }

  const title = ref(path.split('/').pop() || '')

  // 如果有路径文件，标题加上repo
  for (const tab of contexStore.tabs) {
    if (tab.panel === panelName) {
      if ((tab.data.file as localFile).path === path) {
        tab.title.value = tab.title + ' @ ' + (tab.data.file as localFile).repo
        title.value = path + ' @ ' + repo
      }
    }
  }

  // 防止不同目录下同名文件标题相同
  for (const tab of contexStore.tabs) {
    if (tab.panel === panelName) {
      if (tab.title.value === title.value) {
        const original_tab_title = tab.title.value
        const original_title = title.value

        if (original_tab_title.endsWith(' @ ' + (tab.data.file as localFile).repo)) {
          tab.title.value =
            (tab.data.file as localFile).path + ' @ ' + (tab.data.file as localFile).repo
        } else {
          tab.title.value = (tab.data.file as localFile).path
        }

        if (original_title.endsWith(' @ ' + repo)) {
          title.value = path + ' @ ' + repo
        } else {
          title.value = path
        }
      }
    }
  }

  // 获取后缀
  const ext = path.split('.').pop()?.toLowerCase()

  const newtab = {
    id: '',
    panel: panelName,
    icon: ref(ext === 'md' ? 'faM' : 'faFile'),
    title,
    data: {
      file: {
        path,
        repo,
      },
    },
  }

  contexStore.addTab(newtab)
}
