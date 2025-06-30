import SiderComponent from '@/content/views/SiderComponent.ce.vue'
import { createTwindElement, injectCustomElement } from '@/components/TwindShadowWrapper'
import { VideoType } from '@/utils/subtitlesApi'
import {
  MessageType,
  sendMessageToBackground,
  registerMessageListener,
} from '@/utils/messages'
import { createPinia } from 'pinia'
import { useVideoStore } from '@/store/videoStore'
import { createVideoTimeTracker } from '@/utils/videoTimeTracker'

console.log('[Tuple-GPT] Bilibili content script loaded!')

// 初始化 Pinia store
const pinia = createPinia()

// 创建并注册自定义元素，传入 pinia 实例
const customElementOptions = { plugins: [pinia] }
createTwindElement(SiderComponent, 'tuple-gpt-sider', customElementOptions)

// 初始化 store
const videoStore = useVideoStore(pinia)
videoStore.setCurrentUrl(window.location.href, VideoType.BILIBILI)

// 创建视频时间跟踪器
const videoTimeTracker = createVideoTimeTracker({
  platformType: VideoType.BILIBILI,
  videoSelector: '#bilibili-player video',
  additionalSelectors: ['.bilibili-player-video video', '.bpx-player-video-wrap video', 'video'] // 备用选择器
})

/**
 * 将Vue自定义元素注入到B站页面的指定位置。
 * 该元素会自动创建并使用Shadow DOM来隔离样式。
 * 目标：.right-container-inner内且在.up-panel-container后面（第二个位置）
 */
function injectComponent() {
  const elementId = 'tuple-gpt-bilibili-host'

  // 如果已经存在则移除
  const existingElement = document.getElementById(elementId)
  if (existingElement) {
    existingElement.remove()
  }

  injectCustomElement({
    containerSelector: '.right-container-inner',
    tagName: 'tuple-gpt-sider',
    elementId: elementId,
    component: SiderComponent, // Pass the component here
    position: 'afterElement',
    targetElementSelector: '.up-panel-container',
    styles: {
      position: 'relative',
      zIndex: '9999',
      pointerEvents: 'auto'
    },
    props: {
      platformType: VideoType.BILIBILI
    }
  })
}

// 注册标签页
function registerTab() {
  sendMessageToBackground({
    type: MessageType.REGISTER_TAB,
    data: {
      url: window.location.href,
      platform: VideoType.BILIBILI,
    },
  })
}

// 等待页面加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectComponent();
    registerTab();
    // 初始化视频时间跟踪
    videoTimeTracker.initialize();
    // 监听URL变化
    const cleanupUrlWatch = videoTimeTracker.watchUrlChanges();
  });
} else {
  injectComponent();
  registerTab();
  // 初始化视频时间跟踪
  videoTimeTracker.initialize();
  // 监听URL变化
  const cleanupUrlWatch = videoTimeTracker.watchUrlChanges();
} 