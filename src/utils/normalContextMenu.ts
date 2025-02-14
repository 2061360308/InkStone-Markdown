import { ref } from 'vue'
import ContextMenu from '@imengyu/vue3-context-menu'

const selectedTextRef = ref<string | null>(null)
const activeElementRef = ref<Element | null>(null)

const handlePaste = async () => {
  const text = await navigator.clipboard.readText()
  const activeElement = activeElementRef.value as HTMLInputElement | HTMLTextAreaElement
  if (
    activeElement &&
    (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
  ) {
    const start = activeElement.selectionStart || 0
    const end = activeElement.selectionEnd || 0
    activeElement.value =
      activeElement.value.substring(0, start) + text + activeElement.value.substring(end)
    activeElement.selectionStart = activeElement.selectionEnd = start + text.length
  } else {
    // 使用 Range API 插入文本
    const range = window.getSelection()?.getRangeAt(0)
    if (range) {
      range.deleteContents()
      range.insertNode(document.createTextNode(text))
    }
  }
}

const handleCopy = async () => {
  const selectedText = selectedTextRef.value
  if (selectedText) {
    await navigator.clipboard.writeText(selectedText)
  }
}

const handleCut = async () => {
  const selectedText = selectedTextRef.value
  if (selectedText) {
    await navigator.clipboard.writeText(selectedText)
    const activeElement = activeElementRef.value as HTMLInputElement | HTMLTextAreaElement
    if (
      activeElement &&
      (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')
    ) {
      const start = activeElement.selectionStart || 0
      const end = activeElement.selectionEnd || 0
      activeElement.value =
        activeElement.value.substring(0, start) + activeElement.value.substring(end)
      activeElement.selectionStart = activeElement.selectionEnd = start
    } else {
      // 使用 Range API 删除选中文本
      const range = window.getSelection()?.getRangeAt(0)
      if (range) {
        range.deleteContents()
      }
    }
  }
}

export const cutMenu = {
  label: '剪切',
  disabled: false,
  onClick: handleCut,
}

export const copyMenu = {
  label: '复制',
  disabled: false,
  onClick: handleCopy,
}

export const pasteMenu = {
  label: '粘贴',
  disabled: false,
  onClick: handlePaste,
}

export const handleNormalContextMenu = (event: MouseEvent) => {
  event.preventDefault()

  // 如果是文本框或文本域，处理剪切、复制、粘贴操作

  selectedTextRef.value = window.getSelection()?.toString() || null
  activeElementRef.value = document.activeElement

  if (
    activeElementRef.value?.tagName !== 'INPUT' &&
    activeElementRef.value?.tagName !== 'TEXTAREA'
  ) {
    return
  }

  if (!selectedTextRef.value) {
    cutMenu.disabled = true
    copyMenu.disabled = true
  } else {
    cutMenu.disabled = false
    copyMenu.disabled = false
  }

  ContextMenu.showContextMenu({
    x: event.clientX,
    y: event.clientY,
    items: [cutMenu, copyMenu, pasteMenu],
    zIndex: 2017,
  })
}
