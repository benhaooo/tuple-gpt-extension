import { ref, type Ref } from 'vue'
import { marked } from 'marked'

export interface AIContentOptions {
  processLinks?: boolean
}

export function useAIContent(options: AIContentOptions = {}) {
  const content = ref('')
  const isGenerating = ref(false)
  const error = ref('')
  const copySuccess = ref(false)

  // 解析Markdown内容
  const parsedContent = () => {
    // 如果内容为空，返回空字符串
    if (!content.value) return ''
    
    // 使用 marked 解析 Markdown 内容
    // 使用正确的 API 调用方式
    const parsed = marked.parse(content.value, { async: false }) as string
    
    // 如果需要处理链接（概览部分），则进行特殊处理
    if (options.processLinks) {
      // 这里不需要再次处理，因为已经在 generateContent 中处理过了
      // 但我们可以确保链接有正确的类名
      return parsed.replace(/<a href="#"/g, '<a href="#" class="time-link"')
    }
    
    return parsed
  }

  // 使用流式API处理文本内容
  const generateContent = async (prompt: string): Promise<string> => {
    try {
      isGenerating.value = true
      content.value = '' // 清空之前的内容
      
      // 创建 fetch 请求
      const response = await fetch('https://api.302.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-KczEawHZsejJCgv4SDoy2PEjRsnakEjdsTWpIpOeirNjFH2I'
        },
        body: JSON.stringify({
          model: 'gemini-2.5-pro-preview-05-06',
          messages: [
            { role: 'user', content: prompt }
          ],
          stream: true // 启用流式输出
        })
      })
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`)
      }
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }
      
      // 读取流数据
      const decoder = new TextDecoder()
      let done = false
      
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
      
        // 解析SSE数据，从流中提取内容
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const data = JSON.parse(line.substring(6)) // 去掉 "data: "
              if (data.choices && data.choices[0]?.delta?.content) {
                content.value += data.choices[0].delta.content
              }
            } catch (e) {
              console.error('解析流数据失败', e)
            }
          }
        }
      }
      
      // 当内容是概览时，处理链接
      if (options.processLinks) {
        content.value = processOverviewLinks(content.value)
      }
      
      return content.value
    } catch (error) {
      console.error('处理API请求失败:', error)
      throw error
    } finally {
      isGenerating.value = false
    }
  }

  // 处理概览部分 - 将时间标记转换为可点击链接
  const processOverviewLinks = (content: string) => {
    // 替换 [标题](时间点) 格式为可点击的链接
    return content.replace(/\[(.*?)\]\((\d+:\d+(?::\d+)?)\)/g, (match, title, time) => {
      return `<a href="#" class="time-link" data-time="${time}">${title}</a>`
    })
  }

  // 复制文本到剪贴板
  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      copySuccess.value = true
      setTimeout(() => {
        copySuccess.value = false
      }, 2000)
      return Promise.resolve()
    } catch (err) {
      console.error('复制失败:', err)
      return Promise.reject(err)
    }
  }

  return {
    content,
    isGenerating,
    error,
    copySuccess,
    parsedContent,
    generateContent,
    copyToClipboard
  }
} 