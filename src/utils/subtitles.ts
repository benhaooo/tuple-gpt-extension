/**
 * 字幕功能导出文件
 * 统一导出字幕相关功能，并提供自动平台检测
 */

import { VideoType } from './subtitlesApi'
import { SubtitlesHookResult } from './useSubtitlesBase'
import { useYoutubeSubtitles } from './useYoutubeSubtitles'
import { useBilibiliSubtitles } from './useBilibiliSubtitles'

/**
 * 检测当前页面平台类型
 * @returns 视频平台类型
 */
export function detectPlatform(): VideoType {
  const url = window.location.href
  
  if (url.includes('youtube.com/watch')) {
    return VideoType.YOUTUBE
  }
  
  if (url.includes('bilibili.com/video')) {
    return VideoType.BILIBILI
  }
  
  return VideoType.UNKNOWN
}

/**
 * 获取当前平台对应的字幕Hook
 * @returns 字幕Hook结果
 */
export function useSubtitles(): SubtitlesHookResult | null {
  const platform = detectPlatform()
  
  switch (platform) {
    case VideoType.YOUTUBE:
      return useYoutubeSubtitles()
    case VideoType.BILIBILI:
      return useBilibiliSubtitles()
    default:
      console.warn('不支持的视频平台')
      return null
  }
}

// 导出类型和Hook
export { VideoType }
export { useYoutubeSubtitles }
export { useBilibiliSubtitles }
export type { SubtitlesHookResult } 