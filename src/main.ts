import './assets/main.scss'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import fontAwesomeLibrary from './utils/fontAwesomeLibrary'
fontAwesomeLibrary()

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.component('FontAwesomeIcon', FontAwesomeIcon)

app.mount('#app')
