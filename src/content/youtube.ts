import SiderComponent from '@/content/views/SiderComponent.vue'
import { createTwindElement, injectCustomElement } from '@/components/TwindShadowWrapper'

console.log('[Tuple-GPT] YouTube content script loaded!')

// 创建并注册自定义元素
createTwindElement(SiderComponent, 'tuple-gpt-sider')

/**
 * 将Vue自定义元素注入到YouTube页面的指定位置。
 * 该元素会自动创建并使用Shadow DOM来隔离样式。
 * 目标：在视频下方的#above-the-fold元素内部
 */
function injectComponent() {
  injectCustomElement({
    containerSelector: '#above-the-fold',
    tagName: 'tuple-gpt-sider',
    elementId: 'tuple-gpt-youtube-host',
    position: 'append',
    styles: { marginTop: '16px' }
  })
}

// 页面加载完成后执行注入
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectComponent)
} else {
  injectComponent()
}

// 监听YouTube的页面导航事件（因为YouTube是SPA）
window.addEventListener('yt-navigate-finish', injectComponent) 