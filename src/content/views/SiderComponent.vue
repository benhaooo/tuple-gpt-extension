<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { VideoType } from '@/utils/subtitlesApi'
import { createSubtitlesHook } from '@/utils/subtitlesFactory'
import { useVideoStore } from '@/stores/videoStore'
import { marked } from 'marked'
// 导入Heroicons图标
import { 
  ClipboardDocumentIcon, 
  ArrowPathIcon, 
  Bars3Icon, 
  DocumentTextIcon,
  Cog6ToothIcon,
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  ListBulletIcon,
  CheckIcon
} from '@heroicons/vue/24/outline'

// 获取 Pinia store
const videoStore = useVideoStore()

// 接收平台类型作为组件属性
const props = defineProps<{
  platformType: VideoType
}>()

// 视图状态（仅UI展示，无功能）
const activeTab = ref('subtitles')
const bilingualMode = ref(false)

// 使用字幕工厂函数，只获取必要的字幕数据
const {
  videoTitle,
  subtitles,
  subtitlesContent,
  isLoading,
  error,
  initialize,
  cleanup
} = createSubtitlesHook(props.platformType)

// 总结状态
const summaryLoading = ref(false)
const summaryResult = ref('')
const summaryError = ref('')
const copySuccess = ref(false)

// 解析后的Markdown内容
const parsedSummary = computed(() => {
  return summaryResult.value ? marked(summaryResult.value) : ''
})

// 复制文本到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

// 根据当前状态复制不同内容
const copyContent = () => {
  if (summaryResult.value) {
    // 总结后，复制总结结果
    copyToClipboard(summaryResult.value)
  } else {
    // 总结前，复制prompt
    const prompt = `你是一位高效的知识整理专家。请将以下文本内容转化为结构清晰、重点突出的 Markdown 笔记，便于后续复习和查阅。只返回 Markdown 格式内容，不要添加额外说明。
<text_content>
${subtitlesContent.value}
</text_content>
`
    copyToClipboard(prompt)
  }
}

// 在方法定义位置（靠近 copyContent 之后）添加
const copySubtitles = () => {
  if (subtitlesContent.value && subtitlesContent.value.trim() !== '') {
    copyToClipboard(subtitlesContent.value)
  }
}

// 获取视频平台名称（用于UI显示）
const platformName = () => {
  switch (props.platformType) {
    case VideoType.YOUTUBE:
      return 'YouTube'
    case VideoType.BILIBILI:
      return 'Bilibili'
    default:
      return '未知平台'
  }
}

// UI交互处理函数（仅UI状态更新，无实际功能）
const selectTab = (tab: 'subtitles' | 'summary') => {
  activeTab.value = tab
}

const toggleBilingual = () => {
  bilingualMode.value = !bilingualMode.value
}

const jumpToTime = () => {
  // 空函数，仅用于UI展示
}

const summarizeVideo = async () => {
  try {
    if (!subtitlesContent.value || subtitlesContent.value.trim() === '') {
      summaryError.value = '没有字幕内容可供总结'
      return
    }
    
    summaryLoading.value = true
    summaryError.value = ''
    
    const prompt = `你是一位高效的知识整理专家。请将以下文本内容转化为结构清晰、重点突出、内容全面的 Markdown 笔记，便于后续复习和查阅。只返回 Markdown 格式内容，不要添加额外说明。
<text_content>
${subtitlesContent.value}
</text_content>
`

    // 这里使用你的大模型API，这是一个示例
    // 请替换为实际的API端点和请求方法
    const response = await fetch('https://api.302.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-sKF8mGzfAJTMDFBzloIrriFmn9fcMB233wVbUeEm9mEVqYhO' // 请替换为你的API密钥
      },
      body: JSON.stringify({
        model: 'gemini-2.5-pro-preview-05-06', // 可根据需要选择模型
        messages: [
          { role: 'user', content: prompt }
        ],
      })
    })
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`)
    }
    
    const data = await response.json()
    
    // 从API响应中提取内容
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      summaryResult.value = data.choices[0].message.content
    } else {
      throw new Error('API响应格式不符合预期')
    }
    
    // 自动切换到总结视图
    activeTab.value = 'summary'
  } catch (err) {
    summaryError.value = err instanceof Error ? err.message : '总结失败，请重试'
    console.error('[Tuple-GPT] 总结视频失败:', err)
  } finally {
    summaryLoading.value = false
  }
}

// 加载字幕的核心功能
const loadSubtitles = async () => {
  await initialize()
}

// 平台变化时重新加载字幕
watch(() => props.platformType, async (newType, oldType) => {
  if (newType !== oldType) {
    cleanup()
    await initialize()
  }
})

// 组件挂载时初始化
onMounted(() => {
  loadSubtitles()
  console.log('[Tuple-GPT] SiderComponent 已挂载，当前 URL:', videoStore.currentUrl)
  console.log('[Tuple-GPT] 当前平台:', videoStore.platformType === VideoType.YOUTUBE ? 'YouTube' : 'Bilibili')
})
</script>

<template>
  <div class="w-full bg-white rounded-lg shadow-lg font-sans text-sm text-gray-800">
    <!-- 头部 -->
    <header class="flex justify-between items-center p-4">
      <div class="flex items-center gap-2">
        <img src="../../assets/sider-logo.svg" alt="Sider" class="w-8 h-8" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22%237c3aed%22 /><circle cx=%2250%22 cy=%2250%22 r=%2215%22 fill=%22%23c084fc%22 /></svg>';" />
        <h1 class="text-xl font-bold">Sider</h1>
      </div>
      <div class="flex items-center gap-3">
        <!-- Sliding Tab Switch -->
        <div class="relative flex items-center p-1 bg-gray-100 rounded-lg">
          <!-- Slider -->
          <div
            class="absolute top-1 left-1 h-6 w-7 transform bg-white rounded-md shadow-sm transition-transform duration-200 ease-in-out"
            :style="{ transform: activeTab === 'summary' ? 'translateX(100%)' : 'translateX(0)' }"
          ></div>

          <!-- Subtitles Button -->
          <button @click="selectTab('subtitles')" class="relative z-10 p-1 w-7 h-6 flex justify-center items-center">
            <Bars3Icon class="h-5 w-5" />
          </button>
          
          <!-- Summary/CC Button -->
          <button @click="selectTab('summary')" class="relative z-10 p-1 w-7 h-6 flex justify-center items-center">
            <DocumentTextIcon class="h-5 w-5" />
          </button>
        </div>

        <span class="text-sm font-medium">{{ props.platformType === VideoType.YOUTUBE ? 'YT' : props.platformType === VideoType.BILIBILI ? 'BL' : '?' }}</span>
        <button class="p-1 rounded-md hover:bg-gray-100">
          <Cog6ToothIcon class="h-5 w-5" />
        </button>
      </div>
    </header>

    <!-- 主体内容 -->
    <div v-if="activeTab === 'subtitles'" class="px-4 pb-4">
      <!-- 字幕标题和双语切换 -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-base font-medium">{{ platformName() }}字幕</h2>
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">双语</span>
          <label class="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" v-model="bilingualMode" class="sr-only peer" @change="toggleBilingual">
            <div class="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <!-- 加载状态 -->
      <div v-if="isLoading" class="flex justify-center items-center py-10">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="error" class="py-6 text-center">
        <div class="text-red-500 mb-2">{{ error }}</div>
        <button @click="loadSubtitles" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center">
          <ArrowPathIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- 无字幕提示 -->
      <div v-else-if="subtitles.length === 0" class="py-6 text-center">
        <div class="text-gray-500 mb-2">未找到字幕</div>
        <button @click="loadSubtitles" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center">
          <ArrowPathIcon class="h-5 w-5" />
        </button>
      </div>

      <!-- 字幕列表 -->
      <div v-else class="space-y-2 text-gray-800 max-h-96 overflow-y-auto">
        <div 
          v-for="subtitle in subtitles" 
          :key="`${subtitle.startTime}-${subtitle.endTime}`" 
          class="flex gap-3 leading-relaxed py-1 px-2 rounded-md transition-colors duration-200"
          :class="{ 'bg-indigo-50': false }"
          @click="jumpToTime()"
        >
          <span class="text-indigo-500 w-12 flex-shrink-0">{{ subtitle.time }}</span>
          <div class="flex flex-col">
          <span>{{ subtitle.text }}</span>
            <span v-if="bilingualMode && subtitle.translatedText" class="text-gray-500 text-xs mt-1">
              {{ subtitle.translatedText }}
            </span>
          </div>
        </div>
      </div>

      <!-- Chat Footer -->
      <div class="mt-4 pt-3 border-t border-gray-200">
        <div class="flex items-center gap-2">
          <button @click="copySubtitles" class="p-2 rounded-lg hover:bg-gray-100">
            <CheckIcon v-if="copySuccess" class="h-5 w-5 text-green-500" />
            <ClipboardDocumentIcon v-else class="h-5 w-5 text-gray-500" />
          </button>
          <div class="flex-grow h-10 bg-gray-100 rounded-lg flex items-center px-4">
            <span class="text-gray-400">与视频聊天</span>
          </div>
          <button class="p-2 rounded-lg bg-gray-100 hover:bg-gray-200">
            <ChatBubbleLeftIcon class="h-5 w-5 text-gray-600" />
          </button>
          <button @click="summarizeVideo" class="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 flex items-center justify-center">
            <ListBulletIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>

    <!-- 总结视图 -->
    <div v-else-if="activeTab === 'summary'" class="flex flex-col items-center p-6">
      <!-- 加载中状态 -->
      <div v-if="summaryLoading" class="flex flex-col items-center justify-center w-full py-10">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
        <p class="text-gray-500">正在生成视频总结...</p>
      </div>
      
      <!-- 错误状态 -->
      <div v-else-if="summaryError" class="w-full text-center py-8">
        <p class="text-red-500 mb-3">{{ summaryError }}</p>
        <button @click="summarizeVideo" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center">
          <ArrowPathIcon class="h-5 w-5" />
        </button>
      </div>
      
      <!-- 无结果状态 -->
      <div v-else-if="!summaryResult" class="w-full">
        <div class="flex flex-col gap-3 w-full">
          <button @click="summarizeVideo" class="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2">
            <ArrowPathIcon class="h-5 w-5" />
          </button>
          <button @click="copyContent" class="w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition flex items-center justify-center gap-2">
            <CheckIcon v-if="copySuccess" class="h-5 w-5 text-green-500" />
            <ClipboardDocumentIcon v-else class="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <!-- 展示总结结果 -->
      <div v-else class="w-full">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium">{{ videoTitle || '视频总结' }}</h2>
          <div class="flex items-center gap-2">
            <button @click="copyContent" class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition flex items-center gap-1">
              <CheckIcon v-if="copySuccess" class="h-4 w-4 text-green-500" />
              <ClipboardDocumentIcon v-else class="h-4 w-4" />
            </button>
            <button @click="summarizeVideo" class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center justify-center">
              <ChevronDownIcon class="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <!-- 使用v-html渲染Markdown内容 -->
        <div class="prose prose-sm max-w-none overflow-y-auto max-h-[400px] p-2" v-html="parsedSummary"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 添加prose类样式支持Markdown渲染 */
:deep(.prose) {
  color: inherit;
}

:deep(.prose h1) {
  font-size: 1.5em;
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

:deep(.prose h2) {
  font-size: 1.25em;
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

:deep(.prose h3) {
  font-size: 1.125em;
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

:deep(.prose ul) {
  list-style-type: disc;
  padding-left: 1.5em;
  margin: 0.5em 0;
}

:deep(.prose ol) {
  list-style-type: decimal;
  padding-left: 1.5em;
  margin: 0.5em 0;
}

:deep(.prose p) {
  margin: 0.5em 0;
}

:deep(.prose code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}

:deep(.prose pre) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
  margin: 0.5em 0;
}

:deep(.prose blockquote) {
  border-left: 4px solid rgba(0, 0, 0, 0.1);
  padding-left: 1em;
  margin: 0.5em 0;
  color: rgba(0, 0, 0, 0.6);
}
</style>

