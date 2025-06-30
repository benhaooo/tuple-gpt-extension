/**
 * 视频时间跟踪工具
 * 用于在内容脚本中监听视频时间并与store通信
 */

import { VideoType } from './subtitlesApi'
import { useVideoStore } from '@/store/videoStore'

interface VideoTimeTrackerOptions {
  platformType: VideoType
  videoSelector: string
  additionalSelectors?: string[]
}

/**
 * 创建视频时间跟踪器
 * @param options 配置选项
 */
export function createVideoTimeTracker(options: VideoTimeTrackerOptions) {
  const { platformType, videoSelector, additionalSelectors = [] } = options
  
  // 合并所有可能的视频选择器
  const allSelectors = [videoSelector, ...additionalSelectors]
  
  // 初始化视频存储
  const videoStore = useVideoStore()
  
  let videoElement: HTMLVideoElement | null = null
  let observerActive = true
  
  /**
   * 设置视频元素的事件监听
   * @param element 视频元素
   */
  function setupVideoListeners(element: HTMLVideoElement) {
    console.log(`[Tuple-GPT] 为${platformType === VideoType.YOUTUBE ? 'YouTube' : 'Bilibili'}设置视频时间跟踪`)
    
    // 监听视频时间更新
    element.addEventListener('timeupdate', () => {
      videoStore.updateCurrentTime(element.currentTime)
    })
    
    // 监听跳转命令
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'tuple-jump-to-time') {
        const time = event.data.time
        if (typeof time === 'number' && element) {
          element.currentTime = time
        }
      }
    })
  }
  
  /**
   * 查找视频元素
   */
  function findVideoElement() {
    // 尝试所有选择器找到视频元素
    for (const selector of allSelectors) {
      const element = document.querySelector(selector) as HTMLVideoElement
      if (element instanceof HTMLVideoElement) {
        return element
      }
    }
    return null
  }
  
  /**
   * 初始化视频时间跟踪
   */
  function initialize() {
    // 尝试直接查找视频元素
    videoElement = findVideoElement()
    
    if (videoElement) {
      setupVideoListeners(videoElement)
    } else {
      // 如果没找到，使用MutationObserver监听DOM变化
      const observer = new MutationObserver((mutations, obs) => {
        if (!observerActive) {
          obs.disconnect()
          return
        }
        
        videoElement = findVideoElement()
        if (videoElement) {
          setupVideoListeners(videoElement)
          obs.disconnect()
        }
      })
      
      // 开始观察DOM变化
      observer.observe(document.body, {
        childList: true,
        subtree: true
      })
      
      // 设置超时保护，避免无限等待
      setTimeout(() => {
        if (observerActive) {
          observerActive = false
          observer.disconnect()
          console.log('[Tuple-GPT] 视频元素查找超时')
        }
      }, 30000) // 30秒超时
    }
  }
  
  /**
   * 清理资源
   */
  function cleanup() {
    observerActive = false
    if (videoElement) {
      videoElement.removeEventListener('timeupdate', () => {})
    }
  }
  
  /**
   * 监听URL变化
   */
  function watchUrlChanges() {
    let lastUrl = location.href
    const urlObserver = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href
        console.log('[Tuple-GPT] URL已变化，重新设置视频监听')
        cleanup()
        setTimeout(initialize, 1000) // 延迟初始化，等待页面加载
      }
    })

    urlObserver.observe(document, { subtree: true, childList: true })
    
    return () => urlObserver.disconnect()
  }
  
  return {
    initialize,
    cleanup,
    watchUrlChanges
  }
} 