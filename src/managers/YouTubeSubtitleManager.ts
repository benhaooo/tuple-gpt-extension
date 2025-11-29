import { BaseSubtitleManager } from './BaseSubtitleManager'
import {
  VideoType,
  SubtitleInfo,
  SubtitleLanguageInfo,
  getYouTubeSubtitles,
  getVideoId
} from '../utils/subtitlesApi'

/**
 * YouTube 字幕管理器
 * 专门处理 YouTube 平台的字幕逻辑
 */
export class YouTubeSubtitleManager extends BaseSubtitleManager {
  private videoTitle: string = ''
  private currentVideoId: string | null = null

  /**
   * 初始化 YouTube 字幕管理器
   */
  async initialize(): Promise<void> {
    try {
      this.cleanup()
      this.setLoading(true)
      this.setError(null)

      this.currentVideoId = this.getVideoId()
      if (!this.currentVideoId) {
        throw new Error('无法获取YouTube视频ID')
      }

      // 获取视频标题
      this.videoTitle = document.title.replace(' - YouTube', '').trim()

      // 自动加载默认字幕
      await this.loadDefaultSubtitles()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      this.setError(errorMessage)
      console.error('[Tuple-GPT] YouTube字幕初始化失败:', errorMessage)
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * 清理资源
   */
  cleanup(): void {
    this.videoTitle = ''
    this.currentVideoId = null
    this.updateSubtitleInfo({} as SubtitleInfo)
    this.setAvailableLanguages([])
    this.setError(null)
  }

  /**
   * 获取视频标题
   */
  getVideoTitle(): string {
    return this.videoTitle
  }

  /**
   * 获取可用语言列表
   */
  getAvailableLanguages(): SubtitleLanguageInfo[] {
    return this.videoStore.availableLanguages || []
  }

  /**
   * 根据语言加载字幕
   */
  async loadSubtitlesByLanguage(language: SubtitleLanguageInfo): Promise<void> {
    if (!language.subtitle_url) {
      throw new Error('该语言没有可用的字幕URL')
    }

    try {
      this.setLoading(true)
      console.log(`[Tuple-GPT] 正在加载YouTube字幕: ${language.lan_doc}`)

      const subtitles = await getYouTubeSubtitles(this.currentVideoId!, language.lan)

      if (subtitles.length === 0) {
        throw new Error('无法获取字幕或该视频没有字幕')
      }

      const subtitleInfo: SubtitleInfo = {
        lang: language.lan,
        subtitles
      }

      this.updateSubtitleInfo(subtitleInfo)
      console.log(`[Tuple-GPT] YouTube字幕加载完成: ${language.lan_doc}, 共 ${subtitles.length} 条字幕`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      this.setError(`加载YouTube字幕失败: ${errorMessage}`)
      throw error
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * 加载默认字幕
   */
  private async loadDefaultSubtitles(): Promise<void> {
    if (!this.currentVideoId) return

    try {
      const subtitles = await getYouTubeSubtitles(this.currentVideoId)
      if (subtitles.length === 0) {
        throw new Error('无法获取字幕或该视频没有字幕')
      }

      const subtitleInfo: SubtitleInfo = {
        lang: 'auto',
        subtitles
      }

      this.updateSubtitleInfo(subtitleInfo)
      console.log(`[Tuple-GPT] YouTube默认字幕加载完成, 共 ${subtitles.length} 条字幕`)

    } catch (error) {
      throw error
    }
  }

  /**
   * 获取YouTube视频ID
   */
  protected getVideoId(): string | null {
    return getVideoId(VideoType.YOUTUBE)
  }
}