import { BaseSubtitleManager, InitializeResult } from './BaseSubtitleManager'
import {
  VideoType,
  SubtitleInfo,
  SubtitleLanguageInfo,
  SubtitleItem,
  VideoInfo,
  getVideoId,
  getBilibiliVideoInfo,
  getBilibiliAvailableLanguages,
  getBilibiliSubtitlesByUrl
} from '../utils/subtitlesApi'

/**
 * Bilibili 字幕管理器
 * 专门处理 Bilibili 平台的字幕逻辑
 */
export class BilibiliSubtitleManager extends BaseSubtitleManager {
  private videoTitle: string = ''
  private currentVideoId: string = ''
  private videoInfo: VideoInfo | null = null

  /**
   * 初始化 Bilibili 字幕管理器
   * 只返回可用语言列表和视频标题，不加载具体字幕
   */
  async initialize(): Promise<InitializeResult> {
    this.currentVideoId = getVideoId(VideoType.BILIBILI)

    this.videoInfo = await getBilibiliVideoInfo(this.currentVideoId)

    const availableLanguages = await getBilibiliAvailableLanguages(this.videoInfo)

    console.log(`[Tuple-GPT] B站字幕初始化完成: ${this.videoInfo?.title}`)

    return {
      availableLanguages,
      videoTitle: this.videoInfo.title
    }

  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.videoTitle = ''
    this.currentVideoId = null
    this.videoInfo = null
  }

  /**
   * 根据语言加载字幕
   * 返回字幕信息
   */
  async loadSubtitlesByLanguage(subtitle: SubtitleLanguageInfo): Promise<SubtitleItem[]> {
    if (!subtitle.subtitle_url) return []
    const subtitleInfo = await getBilibiliSubtitlesByUrl(subtitle.subtitle_url)
    return subtitleInfo
  }

}