/**
 * 视频状态管理 Hook
 * 替代之前的 pinia store，接受 platformType 参数
 */

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { VideoType, SubtitleItem, SubtitleLanguageInfo, SubtitleInfo, getSubtitlesByUrl } from '@/utils/subtitlesApi'
import { BaseSubtitleManager } from '@/managers/BaseSubtitleManager'
import { useVideoTimeTracker } from '@/hooks/useVideoTimeTracker'

export function useVideoStore(platformType: VideoType) {
  // State
  const currentUrl = ref(window.location.href)
  const currentTime = ref(0)
  const autoScroll = ref(true)
  const activeSubtitleIndex = ref<number | null>(null)
  const subtitles = ref<SubtitleItem[]>([])
  const currentSubtitleInfo = ref<SubtitleInfo | null>(null)
  const availableLanguages = ref<SubtitleLanguageInfo[]>([])
  const videoTitle = ref('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const subtitleManager = ref<BaseSubtitleManager | null>(null)

  const videoTracker = useVideoTimeTracker({
    platformType,
    onUpdate: (time: number) => {
      currentTime.value = time
      if (autoScroll.value) {
        updateActiveSubtitleIndex()
      }
    }
  })

  // Getters
  const videoId = computed(() => {
    if (!currentUrl.value) return null

    try {
      const url = new URL(currentUrl.value)

      if (platformType === VideoType.BILIBILI) {
        const videoIdMatch = url.pathname.match(/\/video\/(BV[\w]+)/)
        return videoIdMatch ? videoIdMatch[1] : null
      }

      if (platformType === VideoType.YOUTUBE) {
        return url.searchParams.get('v')
      }

      return null
    } catch (e) {
      console.error('[Tuple-GPT] Error parsing video ID:', e)
      return null
    }
  })

  const subtitlesContent = computed(() => {
    return subtitles.value.map(item => item.text).join(' ') ?? ''
  })

  // Actions
  function setCurrentUrl(url: string, newPlatformType: VideoType) {
    currentUrl.value = url
    console.log(`[Tuple-GPT] Video store URL updated: ${url} (${newPlatformType})`)
  }

  async function switchSubtitleManager(newPlatformType: VideoType) {
    if (subtitleManager.value) {
      subtitleManager.value.cleanup()
      subtitleManager.value = null
    }

    const { createSubtitleManager } = await import('@/managers/SubtitleManagerFactory')
    const newManager = createSubtitleManager(newPlatformType, {
      updateCurrentTime,
      updateSubtitles,
      updateCurrentSubtitleInfo,
      findSubtitleIndexByTime,
      jumpToTime,
      loadSubtitlesByLanguage,
      setAvailableLanguages,
      setLoading,
      setError,
      setVideoTitle
    })

    if (newManager) {
      subtitleManager.value = newManager
      await newManager.initialize()
      videoTitle.value = newManager.getVideoTitle()
      availableLanguages.value = newManager.getAvailableLanguages()
    }
  }

  function updateCurrentTime(time: number) {
    currentTime.value = time
    if (autoScroll.value) {
      updateActiveSubtitleIndex()
    }
  }

  function setAutoScroll(enabled: boolean) {
    autoScroll.value = enabled
    if (enabled) {
      updateActiveSubtitleIndex()
    }
  }

  function setActiveSubtitleIndex(index: number | null) {
    activeSubtitleIndex.value = index
  }

  function updateSubtitles(newSubtitles: SubtitleItem[]) {
    subtitles.value = newSubtitles
  }

  function updateCurrentSubtitleInfo(subtitleInfo: SubtitleInfo) {
    currentSubtitleInfo.value = subtitleInfo
    subtitles.value = subtitleInfo.subtitles
    activeSubtitleIndex.value = null
  }

  function updateActiveSubtitleIndex() {
    if (!subtitles.value.length) return

    const newIndex = findSubtitleIndexByTime(currentTime.value)
    if (newIndex !== null && newIndex !== activeSubtitleIndex.value) {
      activeSubtitleIndex.value = newIndex
    }
  }

  function findSubtitleIndexByTime(timeInSeconds: number): number | null {
    if (!subtitles.value || subtitles.value.length === 0) return null

    return subtitles.value.findIndex((subtitle, index, array) => {
      const startTimeInSeconds = subtitle.startTime / 1000

      let endTimeInSeconds
      if (index < array.length - 1) {
        endTimeInSeconds = array[index + 1].startTime / 1000
      } else {
        endTimeInSeconds = startTimeInSeconds + 5
      }

      return timeInSeconds >= startTimeInSeconds && timeInSeconds < endTimeInSeconds
    })
  }

  function jumpToTime(timeInMs: number) {
    videoTracker.jumpToTime(timeInMs / 1000)
  }

  function jumpToTimeString(timeStr: string) {
    if (!timeStr) return
    // 解析时间字符串 mm:ss 或 h:mm:ss 并转换为毫秒
    const parts = timeStr.split(':').map(Number)
    let totalSeconds = 0
    if (parts.length === 2) { // mm:ss
      totalSeconds = parts[0] * 60 + parts[1]
    } else if (parts.length === 3) { // h:mm:ss
      totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    videoTracker.jumpToTime(totalSeconds)
  }

  async function loadSubtitlesByLanguage(language: SubtitleLanguageInfo) {
    if (!language.subtitle_url) {
      console.error('语言信息中没有字幕URL:', language)
      throw new Error('该语言没有可用的字幕URL')
    }

    try {
      console.log(`[Tuple-GPT] 正在加载 ${language.lan_doc} 字幕...`)
      const subtitleInfo = await getSubtitlesByUrl(language.subtitle_url, language.lan)

      updateCurrentSubtitleInfo(subtitleInfo)

      console.log(`[Tuple-GPT] 字幕加载完成: ${language.lan_doc}, 共 ${subtitleInfo.subtitles.length} 条字幕`)
      return subtitleInfo
    } catch (error) {
      console.error(`[Tuple-GPT] 加载字幕失败:`, error)
      throw new Error(`加载字幕失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  function setAvailableLanguages(languages: SubtitleLanguageInfo[]) {
    availableLanguages.value = languages
  }

  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  function setError(err: string | null) {
    error.value = err
  }

  function setVideoTitle(title: string) {
    videoTitle.value = title
  }

  async function initializeSubtitles(newPlatformType: VideoType) {
    if (!subtitleManager.value || platformType.value !== newPlatformType) {
      await switchSubtitleManager(newPlatformType)
    }
  }

  function reset() {
    if (subtitleManager.value) {
      subtitleManager.value.cleanup()
    }

    // Reset all refs
    currentUrl.value = window.location.href
    currentTime.value = 0
    autoScroll.value = true
    activeSubtitleIndex.value = null
    subtitles.value = []
    currentSubtitleInfo.value = null
    availableLanguages.value = []
    videoTitle.value = ''
    isLoading.value = false
    error.value = null
    subtitleManager.value = null
  }

  // 在组件挂载时初始化字幕管理器
  onMounted(async () => {
    await switchSubtitleManager(platformType)
  })

  // Cleanup on unmount
  onUnmounted(() => {
    if (subtitleManager.value) {
      subtitleManager.value.cleanup()
    }
  })

  return {
    // State
    currentUrl,
    currentTime,
    autoScroll,
    activeSubtitleIndex,
    subtitles,
    currentSubtitleInfo,
    availableLanguages,
    videoTitle,
    isLoading,
    error,
    subtitleManager,

    // Getters
    videoId,
    subtitlesContent,

    // Actions
    setCurrentUrl,
    updateCurrentTime,
    setAutoScroll,
    setActiveSubtitleIndex,
    updateSubtitles,
    updateCurrentSubtitleInfo,
    switchSubtitleManager,
    initializeSubtitles,
    loadSubtitlesByLanguage,
    setAvailableLanguages,
    setLoading,
    setError,
    setVideoTitle,
    jumpToTime,
    jumpToTimeString,
    reset,
  }
}