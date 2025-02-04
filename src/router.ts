import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'

import LaunchView from './views/LaunchView.vue'
import LoginView from './views/LoginView.vue'
import MainAppView from './views/MainAppView.vue'
import { routerMode } from './config'

// 动态获取 base 配置
const base = import.meta.env.BASE_URL

const routes = [
  // { path: `${base}`, redirect: `${base}main` },
  { path: `${base}`, component: LaunchView, name: 'launch' },
  { path: `${base}main`, component: MainAppView, name: 'main' },
  { path: `${base}login`, component: LoginView, name: 'login' },
]

const router = createRouter({
  // history: createWebHistory(),
  history: routerMode === 'history' ? createWebHistory(base) : createWebHashHistory(base),
  routes,
})

export default router
