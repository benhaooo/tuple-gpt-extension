import SiderComponent from '@/content/views/SiderComponent.ce.vue'
import { createTwindElement, injectCustomElement } from '@/components/TwindShadowWrapper'
import { VideoType } from '@/utils/subtitlesApi'
import {
  MessageType,
  sendMessageToBackground,
  registerMessageListener,
  type TranscribeBilibiliAudioMessage,
  type AudioTranscriptionCompleteMessage,
  type AudioTranscriptionErrorMessage,
} from '@/utils/messages'
import { createPinia } from 'pinia'
import { useVideoStore } from '@/stores/videoStore'
import { createVideoTimeTracker } from '@/utils/videoTimeTracker'
import {
  transcribeBilibiliAudio,
  transcriptionToSubtitles,
  type TranscriptionResult
} from '@/utils/audioUtils'

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

// 处理音频转录请求
async function handleAudioTranscription(data: any) {
  try {
    console.log('[Tuple-GPT] 开始处理音频转录请求:', data)

    const transcriptionResult = await transcribeBilibiliAudio({
      whisperApiKey: data.whisperApiKey,
      whisperApiEndpoint: data.whisperApiEndpoint
    })

    console.log('[Tuple-GPT] 转录原始结果:', transcriptionResult)

    const subtitles = transcriptionToSubtitles(transcriptionResult)
    console.log('[Tuple-GPT] 转换后的字幕:', subtitles)

    // 发送转录完成消息
    const completeMessage: AudioTranscriptionCompleteMessage = {
      type: MessageType.AUDIO_TRANSCRIPTION_COMPLETE,
      data: {
        transcriptionResult,
        subtitles
      }
    }

    // 发送到所有监听器
    window.postMessage(completeMessage, '*')
    console.log('[Tuple-GPT] 音频转录完成，已发送', subtitles.length, '条字幕')
  } catch (error) {
    console.error('[Tuple-GPT] 音频转录失败:', error)

    // 发送错误消息
    const errorMessage: AudioTranscriptionErrorMessage = {
      type: MessageType.AUDIO_TRANSCRIPTION_ERROR,
      data: {
        error: (error as Error).message
      }
    }

    // 发送到所有监听器
    window.postMessage(errorMessage, '*')
  }
}

// 监听来自background的消息
registerMessageListener((message, sender) => {
  console.log('[Tuple-GPT] Bilibili收到消息:', message.type)

  switch (message.type) {
    case MessageType.URL_CHANGE_NOTIFICATION:
      const url = message.data.url
      if (url.includes('bilibili.com/video')) {
        console.log('[Tuple-GPT] Received URL change notification for Bilibili:', url)
        videoStore.setCurrentUrl(url, VideoType.BILIBILI)
      }
      break

    case MessageType.TRANSCRIBE_BILIBILI_AUDIO:
      handleAudioTranscription(message.data)
      break
  }
})

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