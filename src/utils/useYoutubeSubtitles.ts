import { ref, onUnmounted, watch, computed } from 'vue'
import { SubtitlesHookResult } from './useSubtitlesBase'
import { VideoType, SubtitleInfo, SubtitleLanguageInfo, getYouTubeSubtitles, getVideoId } from './subtitlesApi'
import { useVideoStore } from '@/stores/videoStore'

/**
 * YouTube字幕Hook
 * @returns 字幕操作接口
 */
export function useYoutubeSubtitles(): SubtitlesHookResult {
  const videoId = ref<string | null>(null)
  const videoTitle = ref<string>('')

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

  const loadSubtitles = async (): Promise<void> => {
    if (!videoId.value) return
    try {
      const subs = await getYouTubeSubtitles(videoId.value)
      if (subs.length === 0) {
        throw new Error('无法获取字幕或该视频没有字幕')
      }
      subtitleInfo.value = {
        lang: 'auto',
        subtitles: subs
      }
    } catch (err) {
      throw err
    }
  }

  const initialize = async (): Promise<void> => {
    cleanup()
    isLoading.value = true
    try {
      videoId.value = getVideoId(VideoType.YOUTUBE)
      if (!videoId.value) {
        throw new Error('无法获取视频ID')
      }
      videoTitle.value = document.title.replace(' - YouTube', '').trim()
      await loadSubtitles()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '未知错误'
      console.error('YouTube字幕初始化失败:', error.value)
    } finally {
      isLoading.value = false
    }
  }

  const cleanup = (): void => {
    subtitleInfo.value = null
    availableLanguages.value = []
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