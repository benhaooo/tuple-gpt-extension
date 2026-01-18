import { ref, computed, watch, onMounted } from 'vue'
import { VideoType, SubtitleItem, SubtitleLanguageInfo, SubtitleInfo } from '@/utils/subtitlesApi'
import { BaseSubtitleManager } from '@/managers/BaseSubtitleManager'
import { createSubtitleManager } from '@/managers/SubtitleManagerFactory'
import { useVideoTimeTracker } from '@/hooks/useVideoTimeTracker'

export function useVideoStore(platformType: VideoType) {
  const currentUrl = ref(window.location.href)
  const currentTime = ref(0)
  const autoScroll = ref(true)
  const activeSubtitleIndex = ref<number | null>(null)
  const currentSubtitleInfo = ref<SubtitleInfo | null>(null)
  const availableSubtitles = ref<SubtitleLanguageInfo[]>([])
  const selectedLanguage = ref<string>('')
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
    const subtitles = selectedSubtitle.value?.subtitles
    return subtitles?.map(item => item.text).join(' ') ?? ''
  })

  const selectedSubtitle = computed(() => {
    return availableSubtitles.value.find(sub => {
      return sub.lan === selectedLanguage.value;
    })
  })

  // Watch 选中字幕的语言变化，自动加载对应字幕
  watch(() => selectedSubtitle.value?.lan, async (newLan) => {
    if (!newLan || !subtitleManager.value || !selectedSubtitle.value) return

    isLoading.value = true
    error.value = null

    const subtitleInfo = await subtitleManager.value.loadSubtitlesByLanguage(selectedSubtitle.value)

    selectedSubtitle.value.subtitles = subtitleInfo
    isLoading.value = false
  })

  // Actions
  function setCurrentUrl(url: string, newPlatformType: VideoType) {
    currentUrl.value = url
    console.log(`[Tuple-GPT] Video store URL updated: ${url} (${newPlatformType})`)
  }

  async function switchSubtitleManager(newPlatformType: VideoType) {
    const newManager = createSubtitleManager(newPlatformType)
    if (!newManager) return

    subtitleManager.value = newManager
    isLoading.value = true
    error.value = null

    const result = await newManager.initialize()

    availableSubtitles.value = result.availableLanguages
    videoTitle.value = result.videoTitle

    // 自动选择第一个语言（如果有）
    if (result.availableLanguages.length > 0) {
      selectedLanguage.value = result.availableLanguages[0].lan
    }

    console.log(`[Tuple-GPT] 字幕管理器切换成功: ${newPlatformType}`)
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


  function updateActiveSubtitleIndex() {
    const newIndex = findSubtitleIndexByTime(currentTime.value)
    if (newIndex !== null && newIndex !== activeSubtitleIndex.value) {
      activeSubtitleIndex.value = newIndex
    }
  }

  function findSubtitleIndexByTime(timeInSeconds: number): number | null {
    const subtitles = selectedSubtitle.value?.subtitles
    if (!subtitles?.length) return null

    return subtitles.findIndex((subtitle, index, array) => {
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

  async function initializeSubtitles(newPlatformType: VideoType) {
    if (!subtitleManager.value || platformType !== newPlatformType) {
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
    currentSubtitleInfo.value = null
    selectedLanguage.value = null
    videoTitle.value = ''
    isLoading.value = false
    error.value = null
    subtitleManager.value = null
  }

  onMounted(async () => {
    await switchSubtitleManager(platformType)
  })

  return {
    currentUrl,
    currentTime,
    autoScroll,
    activeSubtitleIndex,
    currentSubtitleInfo,
    selectedLanguage,
    videoTitle,
    isLoading,
    error,
    availableSubtitles,

    // Getters
    videoId,
    subtitlesContent,
    selectedSubtitle,

    // Actions
    setCurrentUrl,
    updateCurrentTime,
    setAutoScroll,
    setActiveSubtitleIndex,
    initializeSubtitles,
    jumpToTime,
    jumpToTimeString,
    reset,
  }
}