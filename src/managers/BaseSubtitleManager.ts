import { VideoType, SubtitleInfo, SubtitleLanguageInfo, SubtitleItem } from '../utils/subtitlesApi'

/**
 * 字幕管理器基类
 * 定义了所有字幕管理器的通用接口和行为
 */
export abstract class BaseSubtitleManager {
  protected videoStore: any

  constructor(videoStore: any) {
    this.videoStore = videoStore
  }

  /**
   * 初始化字幕管理器
   * 子类必须实现此方法
   */
  abstract initialize(): Promise<void>

  /**
   * 清理资源
   */
  abstract cleanup(): void

  /**
   * 获取视频标题
   */
  abstract getVideoTitle(): string

  /**
   * 获取可用语言列表
   */
  abstract getAvailableLanguages(): SubtitleLanguageInfo[]

  /**
   * 根据语言加载字幕
   */
  abstract loadSubtitlesByLanguage(language: SubtitleLanguageInfo): Promise<void>

  /**
   * 获取字幕内容（拼接后的完整文本）
   */
  getSubtitlesContent(): string {
    const subtitles = this.videoStore.subtitles
    return subtitles.map(item => item.text).join(' ') ?? ''
  }

  /**
   * 获取当前字幕信息
   */
  getCurrentSubtitleInfo(): SubtitleInfo | null {
    return this.videoStore.currentSubtitleInfo
  }

  /**
   * 获取加载状态
   */
  get isLoading(): boolean {
    return this.videoStore.isLoading || false
  }

  /**
   * 获取错误信息
   */
  get error(): string | null {
    return this.videoStore.error || null
  }

  /**
   * 设置加载状态
   */
  protected setLoading(loading: boolean): void {
    this.videoStore.isLoading = loading
  }

  /**
   * 设置错误信息
   */
  protected setError(error: string | null): void {
    this.videoStore.error = error
  }

  /**
   * 更新字幕信息到store
   */
  protected updateSubtitleInfo(subtitleInfo: SubtitleInfo): void {
    this.videoStore.updateCurrentSubtitleInfo(subtitleInfo)
  }

  /**
   * 设置可用语言列表
   */
  protected setAvailableLanguages(languages: SubtitleLanguageInfo[]): void {
    this.videoStore.availableLanguages = languages
  }

  /**
   * 获取当前平台类型
   */
  protected get platformType(): VideoType {
    return this.videoStore.platformType
  }

  /**
   * 获取当前URL
   */
  protected get currentUrl(): string {
    return this.videoStore.currentUrl
  }

  /**
   * 获取视频ID（子类需要实现具体逻辑）
   */
  protected abstract getVideoId(): string | null
}