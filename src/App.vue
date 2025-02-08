<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'

onMounted(() => {
  const handleContextMenu = (event: MouseEvent) => {
    event.preventDefault()
  }

  // 添加全局的 contextmenu 事件监听器
  window.addEventListener('contextmenu', handleContextMenu)

  // 在组件卸载前移除事件监听器
  onBeforeUnmount(() => {
    window.removeEventListener('contextmenu', handleContextMenu)
  })
})
</script>

<template>
  <router-view></router-view>
</template>
