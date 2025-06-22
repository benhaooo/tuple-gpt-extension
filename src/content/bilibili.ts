import SiderComponent from '@/content/views/SiderComponent.vue'
import { createTwindElement, injectCustomElement } from '@/components/TwindShadowWrapper'

console.log('[Tuple-GPT] Bilibili content script loaded!')

// 创建并注册自定义元素
createTwindElement(SiderComponent, 'tuple-gpt-sider')

/**
 * 将Vue自定义元素注入到B站页面的指定位置。
 * 该元素会自动创建并使用Shadow DOM来隔离样式。
 * 目标：.right-container-inner内且在.up-panel-container后面（第二个位置）
 */
function injectComponent() {
  injectCustomElement({
    containerSelector: '.right-container-inner',
    tagName: 'tuple-gpt-sider',
    elementId: 'tuple-gpt-bilibili-host',
    position: 'afterElement',
    targetElementSelector: '.up-panel-container'
  })
}

// 页面加载完成后执行注入
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectComponent)
} else {
  injectComponent()
} 