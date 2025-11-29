/**
 * 字幕Hook工厂函数
 * 根据平台类型，返回对应平台的字幕Hook实例
 * @param platformType 平台类型
 * @returns 统一的字幕Hook实例
 */
import { ref, computed } from 'vue'
import { VideoType } from './subtitlesApi'
import { SubtitlesHookResult } from './useSubtitlesBase'
import { useYoutubeSubtitles } from './useYoutubeSubtitles'
import { useBilibiliSubtitles } from './useBilibiliSubtitles'

export function createSubtitlesHook(platformType: VideoType): SubtitlesHookResult {
  switch (platformType) {
    case VideoType.YOUTUBE:
      return useYoutubeSubtitles()
    case VideoType.BILIBILI:
      return useBilibiliSubtitles()
    default:
      // 提供一个默认的、空的实现，以避免在不支持的页面上出错
      return {
        videoTitle: ref(''),
        subtitleInfo: ref(null),
        availableLanguages: ref([]),
        subtitlesContent: computed(() => ''),
        isLoading: ref(false),
        error: ref('不支持的平台'),
        initialize: async () => {},
        cleanup: () => {},
      }
  }
} 