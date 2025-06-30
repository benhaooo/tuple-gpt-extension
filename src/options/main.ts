import { createApp } from 'vue'
import App from './App.vue'
import { setupGlobalTwind } from '@/components/TwindShadowWrapper'
import { createPinia } from 'pinia'

setupGlobalTwind()
const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.mount('#app') 