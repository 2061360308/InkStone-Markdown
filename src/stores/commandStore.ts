import { defineStore } from 'pinia'
import { Component, Ref, ref, VNode } from 'vue'

export declare interface Command {
  name: string
  shortName: string
  commandType: 'immediate' | 'deferred'
  execute?: (() => void ) // 可选的回调函数 immediate 类型的命令
  component?: Component | VNode // 可选的组件，用于在命令面板上显示 deferred 类
  shortcut?: string // 可选的快捷键
}

export const useCommandStore = defineStore('command', () => {
  const show = ref(true)
  const activeCommand: Ref<string> = ref('')
  const commands: Ref<Command[]> = ref([])
  const shortcuts: Ref<Map<string, string>> = ref(new Map())

  const displayCommand = (name: string) => {
    console.log(name)
  }

  const executeCommand = (command: Command) => {
    if (command.commandType === 'immediate') {
      if (command.execute) {
        command.execute()
      }
    } else {
      activeCommand.value = command.name
      show.value = true
    }
  }

  const registerCommand = (
    name: string,
    shortName: string,
    commandType: 'immediate' | 'deferred',
    execute?: () => void,
    component?: Component,
    shortcut?: string,
  ) => {
    if (shortcut && shortcuts.value.has(shortcut)) {
      throw new Error(`快捷键 ${shortcut} 已经被命令 ${shortcuts.value.get(shortcut)} 使用`)
    }
    commands.value.push({ name, shortName, commandType, execute, component, shortcut })
    if (shortcut) {
      shortcuts.value.set(shortcut, name)
    }
  }

  const findCommandByShortcut = (shortcut: string): Command | undefined => {
    const commandName = shortcuts.value.get(shortcut)
    return commands.value.find((command) => command.name === commandName)
  }

  return {
    show,
    activeCommand,
    commands,
    executeCommand,
    displayCommand,
    registerCommand,
    findCommandByShortcut,
  }
})
