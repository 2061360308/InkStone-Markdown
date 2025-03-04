<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCommandStore } from '@/stores'
import { onKeyStroke } from '@vueuse/core'
import { ref, Ref } from 'vue'

const commandStore = useCommandStore()
const { findCommandByShortcut, executeCommand, registerCommand } = commandStore
/**
 *   命令面板
 */

const { show: commandPaletteDrawer, activeCommand } = storeToRefs(commandStore)

const showCommandComponent: Ref<boolean> = ref(false)

// use `autoRepeat` option
onKeyStroke(
  true,
  (e: KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const shortcut = `${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`

    console.log(shortcut)
    const command = findCommandByShortcut(shortcut)
    if (command) {
      executeCommand(command)
    }
  },
  { dedupe: true },
)

registerCommand(
  '命令面板',
  'command-palette',
  'immediate',
  () => {
    commandPaletteDrawer.value = !commandPaletteDrawer.value
    activeCommand.value = ''
  },
  undefined,
  'Ctrl+Shift+P',
)
</script>

<template>
  <el-drawer
    v-model="commandPaletteDrawer"
    direction="ttb"
    modal-class="command-palette-drawer"
    size="auto"
    :with-header="false"
  >
    <el-input v-model="activeCommand" style="width: 100%" placeholder="搜索命令" clearable />
    <div v-if="showCommandComponent"></div>
    <div v-else class="command-item">
      <div class="item" v-for="command in commandStore.commands" :key="command.name">
        <div class="info">
          <div class="command-name">{{ command.name }}</div>
          <div class="command-short-name">{{ command.shortName }}</div>
        </div>
        <div class="command-option">
          <div class="command-shortcut">
            <el-tag
              type="primary"
              v-for="commandShortcutTag in command.shortcut?.split('+')"
              :key="commandShortcutTag"
              >{{ commandShortcutTag }}</el-tag
            >
          </div>
          <el-button type="primary" text>
            <font-awesome-icon :icon="['fas', 'gear']" size="lg" />
          </el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<style lang="scss" scoped>
.command-item {
  padding: 10px 0 0 0;
  .item {
    display: flex;
    justify-content: space-between;
    padding: 10px;

    .info {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 14px;
      .command-short-name {
        color: var(--el-text-color-secondary);
      }
    }
    .command-option {
      display: flex;
      align-items: center;
      gap: 10px;
      .command-shortcut {
        display: flex;
        gap: 5px;
      }
    }

    &:hover {
      background-color: var(--el-color-primary-light-5);
    }
  }
}
</style>

<style lang="scss">
.command-palette-drawer {
  background-color: #fff0;
  .el-drawer {
    max-width: 600px;
    margin: 0 auto;
    max-width: 45%;
  }

  .el-drawer__body {
    padding: 10px;
    height: auto;
  }
}
</style>
