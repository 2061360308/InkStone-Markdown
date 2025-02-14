import { useContexStore, useSettingsStore } from '@/stores'
import { generateRandomId } from '@/utils/general'
import panelsManager from '@/panels'
import { h, markRaw, ref } from 'vue'
import { ElTooltip } from 'element-plus'
import fs from '@/utils/fs'
import api from '@/utils/api'

export const openNativeFile = async (fileHandle: FileSystemFileHandle) => {
  /**
   * 打开用户本机上的文件
   **/
  const contexStore = useContexStore()

  const path = `${fileHandle.name} @native`
  let title = path.split('/').pop() || ''

  const panelName = 'nativeFileEditor'

  // 防止重复打开, 同时处理同名文件
  for (const tab of contexStore.tabs) {
    if (tab.panelName === panelName) {
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
    panelName: panelName,
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

  const panelName = 'remoteFileEditor'

  const fileTitle = path.split('/').pop() || ''

  let title = fileTitle + ' @remote'

  // 防止重复打开
  for (const tab of contexStore.tabs) {
    if (tab.panelName === panelName) {
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
    panelName: panelName,
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
        title: fileTitle,
      },
    },
  }

  contexStore.addTab(newtab)
}

export const openLocalFile = (path: string, repo: string) => {
  const contexStore = useContexStore()

  const panelName = 'localFileEditor'

  // 防止重复打开
  for (const tab of contexStore.tabs) {
    if (tab.panelName === panelName) {
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

  const fileTitle = path.split('/').pop() || ''

  let title = fileTitle

  // 如果有路径文件，标题加上repo
  for (const tab of contexStore.tabs) {
    if (tab.panelName === panelName) {
      if ((tab.data.file as localFile).path === path) {
        tab.title = tab.title + ' @ ' + (tab.data.file as localFile).repo
        title = path + ' @ ' + repo
      }
    }
  }

  // 防止不同目录下同名文件标题相同
  for (const tab of contexStore.tabs) {
    if (tab.panelName === panelName) {
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
    panelName: panelName,
    panel: panelsManager.getPanelComponent(panelName)
      ? markRaw(panelsManager.getPanelComponent(panelName)!)
      : null,
    icon: ext === 'md' ? 'm' : 'file',
    title,
    data: {
      file: {
        path,
        repo,
        title: fileTitle,
      },
    },
  }

  console.log(newtab)

  contexStore.addTab(newtab)
}

export const createFile = async (
  data: treeItemObject | null,
  repo: string,
  type: string,
  post: boolean,
  draft: boolean,
  _callback: (path: string, repo: string) => void,
) => {
  const settingsStore = useSettingsStore()

  const fileName = ref('')
  const fileFolder = ref('')
  if (data) {
    let path = ''
    if (data.isLeaf) {
      path = data.data.path.substring(0, data.data.path.lastIndexOf('/'))
    } else {
      path = data.data.path
    }
    fileFolder.value = path ? path + '/' : ''
  }

  let title

  if (post) {
    if (draft) {
      title = '创建草稿'
    } else {
      title = '创建文章'
    }
  } else {
    title = '创建文件'
  }

  ElMessageBox({
    title: title,
    // Should pass a function if VNode contains dynamic props
    message: () =>
      h(
        ElForm,
        {
          style: 'width: 100%; min-width: 386px;',
        },
        () =>
          h(ElFormItem, { label: '文件名称', style: 'width: 100%;' }, () =>
            h(
              ElInput,
              {
                style: 'width: 100%;',
                modelValue: fileName.value,
                'onUpdate:modelValue': (val: string) => {
                  fileName.value = val
                },
                autocomplete: 'off',
              },
              {
                prepend: () =>
                  h(ElTooltip, { content: `根目录/${fileFolder.value}`, placement: 'bottom' }, () =>
                    h('span', {}, `根目录/${fileFolder.value}`.slice(0, 6)),
                  ),
              },
            ),
          ),
      ),
  }).then(async () => {
    let path = fileFolder.value + fileName.value
    // 去除多余的斜杠
    path = path = path
      .replace(/\\/g, '/')
      .replace(/\/+/g, '/')
      .replace(/^\/|\/$/g, '')
    // 校验非法字符
    if (path.match(/[<>:"|?*\x00-\x1F]/)) {
      ElMessage.error('文件路径不合法')
      return
    }

    // 如果是文章，且没有后缀名，则添加后缀名
    if (post && !path.endsWith('.md')) {
      path = path + '.md'
    }

    // 检查文件是否存在
    if (await fs.isExist(path, repo)) {
      ElMessage.error('文件已存在')
      return
    }

    let content = ''

    // 如果是文章，添加 front matter
    if (post) {
      // 获取文件名
      const fileNameWithExtension = path.substring(path.lastIndexOf('/') + 1)
      // 去掉文件后缀
      const fileName = fileNameWithExtension.substring(0, fileNameWithExtension.lastIndexOf('.'))
      content = settingsStore.getfrontMatter(fileName, draft)
    }

    fs.write(path, content, repo).then(() => {
      _callback(path, repo)
    })
  })
}

export const deleteFile = async (
  data: treeItemObject | null,
  repo: string,
  type: string,
  _callback: () => void,
) => {
  if (!data) {
    return
  }
  const contexStore = useContexStore()
  const position = data.data.position
  const path = data.data.path
  const title = path.split('/').pop() || ''
  if (position === 'remote') {
    ElMessageBox.confirm(
      `将立即执行git提交，确定删除远程文件吗？`,
      `Warning - 删除远程${title}文件`,
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
      .then(() => {
        const message = 'Delete : ' + path
        const files = [{ path: path, content: null }]
        api
          .commitChanges(files, message)
          .then(() => {
            ElMessage({
              type: 'success',
              message: '文件已删除! 若未更新请稍后刷新页面',
            })
            _callback()
          })
          .catch((error) => {
            console.error('deleteFile', error)
            if (error.message.includes('Update is not a fast forward')) {
              ElNotification({
                title: 'Error',
                message:
                  '删除失败，稍后再试。\n 错误原因：由于远程仓库内容更新有延时，请不要频繁操作',
                type: 'error',
              })
            } else {
              ElNotification({
                title: 'Error',
                message: '删除失败，稍后再试。未知错误：' + error.message,
                type: 'error',
              })
            }

            _callback()
            return
          })
      })
      .catch((e) => {
        console.error('deleteFile', e)
        ElMessage({
          type: 'info',
          message: '已取消删除',
        })
      })
    return
  } else {
    ElMessageBox.confirm('确定删除吗？本地存储文件删除后不可恢复。', 'Warning', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        fs.delete(path, repo).then(() => {
          ElMessage({
            type: 'success',
            message: '文件已删除!',
          })

          // 查看这个文件是否在打开的文件中，如果是，则关闭
          const fileTab = contexStore.tabs.filter(
            (item) =>
              item.panelName === 'localFileEditor' &&
              (item.data.file as localFile).repo === repo &&
              (item.data.file as localFile).path === path,
          )

          if (fileTab.length > 0) {
            contexStore.removeTab(fileTab[0].id)
          }
          _callback()
        })
      })
      .catch((e) => {
        console.error('deleteFile', e)
        ElMessage({
          type: 'info',
          message: '已取消删除',
        })
        _callback()
      })
  }
}

export const exportFile = async (
  data: treeItemObject | null,
  repo: string,
  type: string,
  fileHandle: FileSystemFileHandle,
) => {
  if (!data) {
    return
  }
  const path = data.data.path
  let content
  if (type === 'local' || type === 'mixed') {
    // 这里都是优先本地缓存内容
    if (await fs.isExist(path, repo)) {
      content = await fs.get(path, repo)
    } else {
      content = (await api.getFileContent(path, repo)).decodedContent
    }
  } else {
    // 直接从远程获取内容
    content = (await api.getFileContent(path, repo)).decodedContent
  }

  // 写入文件
  const writable = await fileHandle.createWritable()
  await writable.write(content)
  await writable.close()

  ElMessage({
    type: 'success',
    message: '文件已导出!',
  })
}

export const createNativeFile = async (
  post: boolean,
  draft: boolean,
  _callback: (fileHandle: FileSystemFileHandle) => void,
) => {
  if (!window.showSaveFilePicker) {
    ElMessage.error('当前浏览器不支持此功能')
    return
  }

  let fileType

  if (post) {
    fileType = [
      {
        description: 'Markdown File',
        accept: {
          'text/markdown': ['.md'],
        },
      },
    ]
  }

  const fileHandle = await window.showSaveFilePicker({
    types: fileType,
  })

  if (!fileHandle) {
    return
  }

  const file = await fileHandle.getFile()

  const settingsStore = useSettingsStore()

  let content = ''

  // 如果是文章，添加 front matter
  if (post) {
    // 去掉文件后缀
    const fileName = file.name.split('.').slice(0, -1).join('.')
    content = settingsStore.getfrontMatter(fileName, draft)
  }

  const writable = await fileHandle.createWritable()
  await writable.write(content)
  _callback(fileHandle)
  writable.close() // 比较耗时
}
