import { Component } from 'vue'

interface panel {
  name: string
  title: string
  icon: string
  component: Component
  onActive: () => void
}

const panels: panel[] = [];  // 全局的面板
