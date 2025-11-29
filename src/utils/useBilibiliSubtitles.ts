import { ref, onUnmounted, watch, computed } from 'vue'
import { SubtitlesHookResult } from './useSubtitlesBase'
import {
  VideoType,
  SubtitleInfo,
  SubtitleLanguageInfo,
  getVideoId,
  VideoInfo,
  getBilibiliVideoInfo,
  getBilibiliSubtitlesByCid
} from './subtitlesApi'
import { useVideoStore } from '@/stores/videoStore'

/**
 * Bilibili字幕Hook
 * @returns 字幕操作接口
 */
export function useBilibiliSubtitles(): SubtitlesHookResult {
  const videoId = ref<string | null>(null)
  const videoTitle = ref<string>('')
  const videoInfo = ref<VideoInfo | null>(null)

  const subtitleInfo = ref<SubtitleInfo | null>(null)
  const availableLanguages = ref<SubtitleLanguageInfo[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  // 计算属性：将所有字幕文本连接成一篇文章
  const subtitlesContent = computed(() => {
    return subtitleInfo.value?.subtitles.map(item => item.text).join(' ') ?? ''
  })
  
  // 使用 Pinia store
  const videoStore = useVideoStore()

  const loadVideoInfo = async (): Promise<void> => {
    if (!videoId.value) return

    try {
      const info = await getBilibiliVideoInfo(videoId.value)
      if (!info) {
        throw new Error('获取视频信息失败')
      }
      videoInfo.value = info
      videoTitle.value = info.title
    } catch (err) {
      throw err
    }
  }

  const loadSubtitles = async (): Promise<void> => {
    if (!videoInfo.value) {
      throw new Error('视频信息未加载')
    }
    try {
      const result = await getBilibiliSubtitlesByCid(videoInfo.value)
      subtitleInfo.value = result.subtitleInfo
      availableLanguages.value = result.availableLanguages
      if (result.subtitleInfo.subtitles.length === 0) {
        throw new Error('无法获取字幕或该视频没有字幕')
      }
    } catch (err) {
      throw err
    }
  }

  const initialize = async (): Promise<void> => {
    cleanup()
    isLoading.value = true
    try {
      videoId.value = getVideoId(VideoType.BILIBILI)
      if (!videoId.value) {
        throw new Error('无法获取视频ID')
      }
      await loadVideoInfo()
      await loadSubtitles()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      console.error('B站字幕初始化失败:', error.value)
    } finally {
      isLoading.value = false
    }
  }

  const cleanup = (): void => {
    subtitleInfo.value = null
    availableLanguages.value = []
    videoInfo.value = null
    videoId.value = null
    videoTitle.value = ''
    error.value = null
    isLoading.value = false
  }
  
  watch(() => videoStore.currentUrl, (newUrl, oldUrl) => {
    if (newUrl !== oldUrl) {
      initialize()
    }
  })
  
  onUnmounted(() => {
    cleanup()
  })

  return {
    videoTitle,
    subtitleInfo,
    availableLanguages,
    subtitlesContent,
    isLoading,
    error,
    initialize,
    cleanup,
  }
} 