import { createTwindElement, injectCustomElement } from '@/components/TwindShadowWrapper'
import { VideoType } from '@/utils/subtitlesApi'
import SiderComponent from './views/SiderComponent.ce.vue'
import { createVideoTimeTracker } from '@/utils/videoTimeTracker'
import { 
  MessageType, 
  registerMessageListener, 
  sendMessageToBackground 
} from '@/utils/messages'
import { createPinia } from 'pinia'
import { useVideoStore } from '@/store/videoStore'

console.log('[Tuple-GPT] YouTube content script loaded!')

// 创建 Pinia 实例
const pinia = createPinia()

// 创建并注册自定义元素，传入 pinia 实例
const customElementOptions = { plugins: [pinia] }
createTwindElement(SiderComponent, 'tuple-gpt-sider', customElementOptions)

// 初始化 store
const videoStore = useVideoStore(pinia)
// 设置初始平台类型
videoStore.setCurrentUrl(window.location.href, VideoType.YOUTUBE)

// 创建视频时间跟踪器
const videoTimeTracker = createVideoTimeTracker({
  platformType: VideoType.YOUTUBE,
  videoSelector: '#movie_player video',
  additionalSelectors: ['.html5-main-video']
})

/**
 * YouTube 页面注入逻辑
 */
export function initializeYouTube() {
  console.log('[Tuple-GPT] YouTube page detected')

  // 创建并注册Sider组件的自定义元素
  createTwindElement(SiderComponent, 'sider-component-ce')

  const videoTimeTracker = createVideoTimeTracker({
    platformType: VideoType.YOUTUBE,
    videoSelector: '#movie_player video',
    additionalSelectors: ['.html5-main-video']
  })

  function mountSiderComponent() {
    const siderId = 'tuple-gpt-sider-ce'
    if (document.getElementById(siderId)) {
      return
  }
  
  injectCustomElement({
      containerSelector: '#secondary-inner',
      tagName: 'sider-component-ce',
      elementId: siderId,
      component: SiderComponent,
    position: 'prepend',
    props: {
        platformType: VideoType.YOUTUBE
      }
    })
  }

  // 等待播放器加载完成再注入
  const observer = new MutationObserver((mutations, obs) => {
    const playerContainer = document.querySelector('#movie_player')
    const siderContainer = document.querySelector('#secondary-inner')
    if (playerContainer && siderContainer) {
      mountSiderComponent()
      videoTimeTracker.initialize()
      obs.disconnect()
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true
  })

  videoTimeTracker.watchUrlChanges()
}

// 注册标签页以接收URL变化通知
async function registerTab() {
  try {
    // 注册标签页以接收URL变化通知
    await sendMessageToBackground({
      type: MessageType.REGISTER_TAB
    });
    
    console.log('[Tuple-GPT] Registered tab for URL change notifications');
  } catch (error) {
    console.error('[Tuple-GPT] Failed to register tab:', error);
  }
}

// 监听来自background的消息
registerMessageListener((message, sender) => {
  // 处理URL变化通知
  if (message.type === MessageType.URL_CHANGE_NOTIFICATION) {
    const url = message.data.url;
    
    // 检查是否是YouTube视频页面
    if (url.includes('youtube.com/watch')) {
      console.log('[Tuple-GPT] Received URL change notification for YouTube:', url);
      
      // 使用 Pinia store 更新 URL，而不是触发自定义事件
      videoStore.setCurrentUrl(url, VideoType.YOUTUBE);
    }
  }
});

// 页面加载完成后执行注入和注册
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeYouTube();
    registerTab();
  });
} else {
  initializeYouTube();
  registerTab();
} 