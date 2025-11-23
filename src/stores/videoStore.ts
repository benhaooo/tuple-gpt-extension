import { defineStore } from 'pinia'
import { VideoType, SubtitleItem } from '@/utils/subtitlesApi'

interface VideoState {
  currentUrl: string
  platformType: VideoType | null
  currentTime: number
  autoScroll: boolean
  activeSubtitleIndex: number | null
  subtitles: SubtitleItem[] // 新增字幕数据存储
  // 可以根据需要添加更多状态，如 videoId 等
}

// 创建初始状态工厂函数，方便重用
const getInitialState = (): VideoState => ({
  currentUrl: window.location.href,
  platformType: null,
  currentTime: 0,
  autoScroll: true,
  activeSubtitleIndex: null,
  subtitles: []
})

export const useVideoStore = defineStore('video', {
  state: (): VideoState => getInitialState(),
  
  actions: {
    /**
     * 更新当前 URL
     * @param url 新的 URL
     * @param platformType 平台类型
     */
    setCurrentUrl(url: string, platformType: VideoType) {
      this.currentUrl = url
      this.platformType = platformType
      console.log(`[Tuple-GPT] Video store URL updated: ${url} (${platformType})`)
    },

    /**
     * 更新当前视频播放时间
     * @param time 当前视频播放时间（秒）
     */
    updateCurrentTime(time: number) {
      this.currentTime = time
      
      // 如果启用了自动滚动，自动更新当前活跃字幕索引
      if (this.autoScroll) {
        this.updateActiveSubtitleIndex()
      }
    },

    /**
     * 设置是否启用字幕自动滚动
     * @param enabled 是否启用
     */
    setAutoScroll(enabled: boolean) {
      this.autoScroll = enabled
      
      // 如果启用了自动滚动，立即更新当前活跃字幕索引
      if (enabled) {
        this.updateActiveSubtitleIndex()
      }
    },

    /**
     * 设置当前活跃字幕索引
     * @param index 字幕索引
     */
    setActiveSubtitleIndex(index: number | null) {
      this.activeSubtitleIndex = index
    },

    /**
     * 更新字幕数据
     * @param subtitles 新的字幕数据
     */
    updateSubtitles(subtitles: SubtitleItem[]) {
      this.subtitles = subtitles
    },

    /**
     * 根据当前时间查找并更新活跃字幕索引
     */
    updateActiveSubtitleIndex() {
      if (this.subtitles.length === 0) return
      
      const newIndex = this.findSubtitleIndexByTime(this.currentTime)
      if (newIndex !== null && newIndex !== this.activeSubtitleIndex) {
        this.activeSubtitleIndex = newIndex
      }
    },

    /**
     * 查找当前播放时间对应的字幕索引
     * @param currentTime 当前时间（秒）
     * @returns 对应的字幕索引，如果没找到则返回null
     */
    findSubtitleIndexByTime(currentTime: number): number | null {
      if (!this.subtitles || this.subtitles.length === 0) return null
      
      return this.subtitles.findIndex((subtitle: SubtitleItem, index: number, array: SubtitleItem[]) => {
        // 解析当前字幕的开始时间
        const startTime = this.parseTimeString(subtitle.time)
        
        // 计算结束时间（使用下一条字幕的开始时间，或者当前开始时间+5秒）
        let endTime
        if (index < array.length - 1) {
          endTime = this.parseTimeString(array[index + 1].time)
        } else {
          endTime = startTime + 5 // 最后一条字幕假设持续5秒
        }
        
        // 检查当前时间是否在这个字幕的时间范围内
        return currentTime >= startTime && currentTime < endTime
      })
    },

    /**
     * 将时间字符串转换为秒数
     * @param timeStr 时间字符串，格式如 "01:23"
     * @returns 秒数
     */
    parseTimeString(timeStr: string): number {
      const parts = timeStr.split(':')
      return parseInt(parts[0]) * 60 + parseInt(parts[1])
    },

    /**
     * 跳转到特定时间点
     * @param time 目标时间（秒）
     */
    jumpToTime(time: number) {
      // 发送消息给content script进行跳转
      window.postMessage({ 
        type: 'tuple-jump-to-time', 
        time 
      }, '*')
    },

    /**
     * 根据字幕时间字符串跳转到对应时间点
     * @param timeStr 时间字符串，格式如 "01:23"
     */
    jumpToTimeByString(timeStr: string) {
      if (!timeStr) return
      
      const totalSeconds = this.parseTimeString(timeStr)
      this.jumpToTime(totalSeconds)
    },

    /**
     * 重置状态
     */
    reset() {
      this.currentUrl = window.location.href
      this.platformType = null
      this.currentTime = 0
      this.activeSubtitleIndex = null
      this.subtitles = []
    }
  },

  getters: {
    /**
     * 获取当前视频 ID (通用 getter)
     * 根据不同平台解析出视频 ID
     */
    videoId: (state) => {
      if (!state.currentUrl) return null
      
      try {
        const url = new URL(state.currentUrl)
        
        // B站视频 ID 解析
        if (state.platformType === VideoType.BILIBILI) {
          const videoIdMatch = url.pathname.match(/\/video\/(BV[\w]+)/)
          return videoIdMatch ? videoIdMatch[1] : null
        }
        
        // YouTube 视频 ID 解析
        if (state.platformType === VideoType.YOUTUBE) {
          return url.searchParams.get('v')
        }
        
        return null
      } catch (e) {
        console.error('[Tuple-GPT] Error parsing video ID:', e)
        return null
      }
    }
  }
}) 