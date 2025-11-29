import { BaseSubtitleManager } from './BaseSubtitleManager'
import {
  VideoType,
  SubtitleInfo,
  SubtitleLanguageInfo,
  SubtitleItem,
  VideoInfo,
  getVideoId,
  getBilibiliVideoInfo,
  getBilibiliSubtitlesByCid
} from '../utils/subtitlesApi'

/**
 * Bilibili 字幕管理器
 * 专门处理 Bilibili 平台的字幕逻辑
 */
export class BilibiliSubtitleManager extends BaseSubtitleManager {
  private videoTitle: string = ''
  private currentVideoId: string | null = null
  private videoInfo: VideoInfo | null = null

  /**
   * 初始化 Bilibili 字幕管理器
   */
  async initialize(): Promise<void> {
    try {
      this.cleanup()
      this.setLoading(true)
      this.setError(null)

      this.currentVideoId = this.getVideoId()
      if (!this.currentVideoId) {
        throw new Error('无法获取Bilibili视频ID')
      }

      // 加载视频信息
      await this.loadVideoInfo()

      // 加载字幕
      await this.loadAllSubtitles()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      this.setError(errorMessage)
      console.error('[Tuple-GPT] B站字幕初始化失败:', errorMessage)
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
    this.videoInfo = null
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

    if (!this.videoInfo) {
      throw new Error('视频信息未加载')
    }

    try {
      this.setLoading(true)
      console.log(`[Tuple-GPT] 正在加载B站字幕: ${language.lan_doc}`)

      // 直接使用字幕URL加载
      const response = await fetch(language.subtitle_url)
      if (!response.ok) {
        throw new Error(`网络请求失败: ${response.status}`)
      }

      const subtitleData = await response.json()
      const subtitles = this.parseBilibiliSubtitleData(subtitleData)

      if (subtitles.length === 0) {
        throw new Error('无法获取字幕或该视频没有字幕')
      }

      const subtitleInfo: SubtitleInfo = {
        lang: language.lan,
        subtitles
      }

      this.updateSubtitleInfo(subtitleInfo)
      console.log(`[Tuple-GPT] B站字幕加载完成: ${language.lan_doc}, 共 ${subtitles.length} 条字幕`)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      this.setError(`加载B站字幕失败: ${errorMessage}`)
      throw error
    } finally {
      this.setLoading(false)
    }
  }

  /**
   * 加载视频信息
   */
  private async loadVideoInfo(): Promise<void> {
    if (!this.currentVideoId) return

    try {
      const info = await getBilibiliVideoInfo(this.currentVideoId)
      if (!info) {
        throw new Error('获取B站视频信息失败')
      }
      this.videoInfo = info
      this.videoTitle = info.title
    } catch (error) {
      throw error
    }
  }

  /**
   * 加载所有字幕
   */
  private async loadAllSubtitles(): Promise<void> {
    if (!this.videoInfo) {
      throw new Error('视频信息未加载')
    }

    try {
      const result = await getBilibiliSubtitlesByCid(this.videoInfo)
      this.updateSubtitleInfo(result.subtitleInfo)
      this.setAvailableLanguages(result.availableLanguages)

      if (result.subtitleInfo.subtitles.length === 0) {
        console.warn('[Tuple-GPT] 该B站视频没有字幕')
      } else {
        console.log(`[Tuple-GPT] B站字幕加载完成: ${result.subtitleInfo.lang}, 共 ${result.subtitleInfo.subtitles.length} 条字幕`)
      }

    } catch (error) {
      throw error
    }
  }

  /**
   * 解析B站字幕数据
   */
  private parseBilibiliSubtitleData(data: any): SubtitleItem[] {
    if (!data.body) return []

    return data.body.map((item: any) => ({
      time: this.formatBilibiliTime(item.from),
      text: item.content
    }))
  }

  /**
   * 格式化B站时间戳
   */
  private formatBilibiliTime(timestamp: number): string {
    const minutes = Math.floor(timestamp / 60)
    const seconds = Math.floor(timestamp % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  /**
   * 获取B站视频ID
   */
  protected getVideoId(): string | null {
    return getVideoId(VideoType.BILIBILI)
  }
}