import { VideoType } from '../utils/subtitlesApi'
import { BaseSubtitleManager } from './BaseSubtitleManager'
import { YouTubeSubtitleManager } from './YouTubeSubtitleManager'
import { BilibiliSubtitleManager } from './BilibiliSubtitleManager'

/**
 * 字幕管理器工厂类
 * 根据平台类型创建对应的字幕管理器实例
 */
export class SubtitleManagerFactory {
  /**
   * 根据平台类型创建字幕管理��
   * @param platformType 平台类型
   * @param videoStore 视频store实例
   * @returns 对应的字幕管理器实例
   */
  static createManager(
    platformType: VideoType,
    videoStore: any
  ): BaseSubtitleManager | null {
    switch (platformType) {
      case VideoType.YOUTUBE:
        return new YouTubeSubtitleManager(videoStore)

      case VideoType.BILIBILI:
        return new BilibiliSubtitleManager(videoStore)

      default:
        console.warn(`[Tuple-GPT] 不支持的平台类型: ${platformType}`)
        return null
    }
  }

  /**
   * 检测当前页面平台类型并创建对应的字幕管理器
   * @param videoStore 视频store实例
   * @returns 对应的字幕管理器实例
   */
  static createManagerForCurrentPage(videoStore: any): BaseSubtitleManager | null {
    const platformType = this.detectPlatformType()
    return this.createManager(platformType, videoStore)
  }

  /**
   * 检测当前页面的平台类型
   * @returns 平台类型
   */
  static detectPlatformType(): VideoType {
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
   * 获取所有支持的平台类型
   * @returns 支持的平台类型数组
   */
  static getSupportedPlatforms(): VideoType[] {
    return [VideoType.YOUTUBE, VideoType.BILIBILI]
  }

  /**
   * 检查是否支持指定的平台类型
   * @param platformType 平台类型
   * @returns 是否支持
   */
  static isPlatformSupported(platformType: VideoType): boolean {
    return this.getSupportedPlatforms().includes(platformType)
  }
}

/**
 * 便捷函数：创建字幕管理器
 * @param platformType 平台类型
 * @param videoStore 视频store实例
 * @returns 对应的字幕管理器实例
 */
export function createSubtitleManager(
  platformType: VideoType,
  videoStore: any
): BaseSubtitleManager | null {
  return SubtitleManagerFactory.createManager(platformType, videoStore)
}

/**
 * 便捷函数：检测当前页面并创建字幕管理器
 * @param videoStore 视频store实例
 * @returns 对应的字幕管理器实例
 */
export function createSubtitleManagerForCurrentPage(videoStore: any): BaseSubtitleManager | null {
  return SubtitleManagerFactory.createManagerForCurrentPage(videoStore)
}