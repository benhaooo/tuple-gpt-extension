import SiderComponent from '@/content/views/SiderComponent.ce.vue'
import { injectCustomElement } from '@/content/TwindShadowWrapper'
import { VideoType } from '@/utils/subtitlesApi'
import {
  MessageType,
  sendMessageToBackground,
  registerMessageListener,
  type AudioTranscriptionCompleteMessage,
  type AudioTranscriptionErrorMessage,
} from '@/utils/messages'
import {
  transcribeBilibiliAudio,
  transcriptionToSubtitles,
} from '@/utils/audioUtils'
import { onDOMReady } from '@/utils/domUtils'
import themeStyles from '@/styles/variables.css?inline'
import '@/styles/variables.css'
console.log('[Tuple-GPT] Bilibili content script loaded!')


/**
 * 将Vue自定义元素注入到B站页面的指定位置。
 * 该元素会自动创建并使用Shadow DOM来隔离样式。
 * 目标：.right-container-inner内且在.up-panel-container后面（第二个位置）
 */
function injectComponent() {
  const elementId = 'tuple-gpt-bilibili-host'

  injectCustomElement({
    containerSelector: '.right-container-inner',
    tagName: 'tuple-gpt-sider',
    elementId: elementId,
    component: SiderComponent,
    position: 'afterElement',
    targetElementSelector: '.up-panel-container',
    props: {
      platformType: VideoType.BILIBILI
    },
    shadowStyles: themeStyles
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
    case MessageType.TRANSCRIBE_BILIBILI_AUDIO:
      handleAudioTranscription(message.data)
      break
  }
})

// 等待页面加载完成后初始化
onDOMReady(() => {
  injectComponent()
  registerTab()
}) 