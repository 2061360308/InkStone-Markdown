import { useContexStore } from '@/stores'
import { generateRandomId } from '@/utils/general'
import panelsManager from '@/panels'
import { markRaw } from 'vue'

export const openNativeFile = async (fileHandle: FileSystemFileHandle) => {
  /**
   * 打开用户本机上的文件
   **/
  const contexStore = useContexStore()

  const path = `${fileHandle.name} @local`
  let title = path.split('/').pop() || ''

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
        title = path + `- ${generateRandomId(4)}`
        tab.title = path + `- ${generateRandomId(4)}`
      }
    }
  }

  // let repo = 'instone.native'

  // 获取后缀
  const ext = fileHandle.name.split('.').pop()?.toLowerCase()

  const newtab = {
    id: '',
    panel: panelsManager.getPanelComponent(panelName)
      ? markRaw(panelsManager.getPanelComponent(panelName)!)
      : null,
    icon: ext === 'md' ? 'm' : 'file',
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

  let title = (path.split('/').pop() || '') + ' @remote'

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
      if (tab.title === title) {
        title = path + ' @remote'
        tab.title = (tab.data.file as remoteFile).path + ' @remote'
      }
    }
  }

  const ext = path.split('.').pop()?.toLowerCase()

  const newtab = {
    id: '',
    panel: panelsManager.getPanelComponent(panelName)
      ? markRaw(panelsManager.getPanelComponent(panelName)!)
      : null,
    icon: ext === 'md' ? 'm' : 'file',
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

  let title = path.split('/').pop() || ''

  // 如果有路径文件，标题加上repo
  for (const tab of contexStore.tabs) {
    if (tab.panel === panelName) {
      if ((tab.data.file as localFile).path === path) {
        tab.title = tab.title + ' @ ' + (tab.data.file as localFile).repo
        title = path + ' @ ' + repo
      }
    }
  }

  // 防止不同目录下同名文件标题相同
  for (const tab of contexStore.tabs) {
    if (tab.panel === panelName) {
      if (tab.title === title) {
        const original_tab_title = tab.title
        const original_title = title

        if (original_tab_title.endsWith(' @ ' + (tab.data.file as localFile).repo)) {
          tab.title = (tab.data.file as localFile).path + ' @ ' + (tab.data.file as localFile).repo
        } else {
          tab.title = (tab.data.file as localFile).path
        }

        if (original_title.endsWith(' @ ' + repo)) {
          title = path + ' @ ' + repo
        } else {
          title = path
        }
      }
    }
  }

  // 获取后缀
  const ext = path.split('.').pop()?.toLowerCase()

  const newtab = {
    id: '',
    panel: panelsManager.getPanelComponent(panelName)
      ? markRaw(panelsManager.getPanelComponent(panelName)!)
      : null,
    icon: ext === 'md' ? 'm' : 'file',
    title,
    data: {
      file: {
        path,
        repo,
      },
    },
  }

  console.log(newtab)

  contexStore.addTab(newtab)
}
