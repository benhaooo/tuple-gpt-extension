import { ref, computed, watch, onMounted } from 'vue'
import { VideoType, SubtitleLanguageInfo } from '@/utils/subtitlesApi'
import { BaseSubtitleManager } from '@/managers/BaseSubtitleManager'
import { createSubtitleManager } from '@/managers/SubtitleManagerFactory'
import { useVideoTimeTracker } from '@/hooks/useVideoTimeTracker'

export function useVideoStore(platformType: VideoType) {
  console.log("🚀 ~ useVideoStore ~ platformType:", platformType)
  const autoScroll = ref(true)
  const activeSubtitleIndex = ref<number | null>(null)
  const availableSubtitles = ref<SubtitleLanguageInfo[]>([])
  const selectedLanguage = ref<string>('')
  const videoTitle = ref('')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const subtitleManager = ref<BaseSubtitleManager>(createSubtitleManager(platformType))


  const videoTracker = useVideoTimeTracker({
    platformType,
    onUpdate: (time: number) => {
      if (autoScroll.value) {
        updateActiveSubtitleIndex(time)
      }
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
    if (!newLan || !selectedSubtitle.value) return

    isLoading.value = true
    error.value = null

    const subtitleInfo = await subtitleManager.value.loadSubtitlesByLanguage(selectedSubtitle.value)

    selectedSubtitle.value.subtitles = subtitleInfo
    isLoading.value = false
  })

  async function initializeSubtitles() {
    isLoading.value = true
    error.value = null

    const result = await subtitleManager.value.initialize()

    availableSubtitles.value = result.availableLanguages
    videoTitle.value = result.videoTitle

    // 自动选择第一个语言（如果有）
    if (result.availableLanguages.length > 0) {
      selectedLanguage.value = result.availableLanguages[0].lan
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


  function updateActiveSubtitleIndex(time: number) {
    const newIndex = findSubtitleIndexByTime(time)
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


  onMounted(() => {
    initializeSubtitles()
  })

  return {
    autoScroll,
    activeSubtitleIndex,
    selectedLanguage,
    videoTitle,
    isLoading,
    error,
    availableSubtitles,

    // Getters
    subtitlesContent,
    selectedSubtitle,

    // Actions
    setAutoScroll,
    setActiveSubtitleIndex,
    initializeSubtitles,
    jumpToTime,
    jumpToTimeString,
  }
}