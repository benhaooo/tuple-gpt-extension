import { createApp } from 'vue'
import App from './SidePanel.vue'
import { createPinia } from 'pinia'
import '@/styles/variables.css'

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.mount('#app') 