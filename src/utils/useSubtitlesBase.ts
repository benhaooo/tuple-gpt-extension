import { Ref, ComputedRef } from 'vue'
import { SubtitleInfo, SubtitleLanguageInfo } from './subtitlesApi'

/**
 * 字幕Hook的通用返回结果接口
 */
export interface SubtitlesHookResult {
  videoTitle: Ref<string>
  subtitleInfo: Ref<SubtitleInfo | null>
  availableLanguages: Ref<SubtitleLanguageInfo[]>
  subtitlesContent: ComputedRef<string>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  initialize: () => Promise<void>
  cleanup: () => void
} 