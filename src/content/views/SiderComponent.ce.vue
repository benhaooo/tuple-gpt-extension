<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { VideoType } from '@/utils/subtitlesApi'
import { createSubtitlesHook } from '@/utils/subtitlesFactory'
import { useVideoStore } from '@/store/videoStore'
// 导入组件
import SubtitleViewer from '@/components/subtitle/SubtitleViewer.vue'
import SummaryViewer from '@/components/summary/SummaryViewer.vue'
// 导入Heroicons图标
import { 
  Bars3Icon, 
  DocumentTextIcon,
  Cog6ToothIcon,
  ChatBubbleLeftIcon,
  DocumentChartBarIcon
} from '@heroicons/vue/24/outline'
import { useThemeManager } from '@/composables/useThemeManager'

// 获取 Pinia store
const videoStore = useVideoStore()

// 接收平台类型作为组件属性
const props = defineProps<{
  platformType: VideoType
}>()

// 视图状态
const activeTab = ref('subtitles')

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

// UI交互处理函数（仅UI状态更新，无实际功能）
const selectTab = (tab: 'subtitles' | 'summary') => {
  activeTab.value = tab
}

// 打开设置页面
const openSettings = () => {
  // 使用chrome扩展API打开设置页面
  chrome.runtime.sendMessage({ action: 'openOptionsPage' })
}

// 跳转到指定时间的功能
const jumpToTime = (timeStr: string) => {
  if (!timeStr) return
  // 使用store中的方法直接跳转
  videoStore.jumpToTimeByString(timeStr)
}

// 加载字幕的核心功能
const loadSubtitles = async () => {
  await initialize()
  // 加载完字幕后更新到store中
  if (subtitles.value.length > 0) {
    videoStore.updateSubtitles(subtitles.value)
  }
}

// 平台变化时重新加载字幕
watch(() => props.platformType, async (newType, oldType) => {
  if (newType !== oldType) {
    cleanup()
    await initialize()
    // 重新加载后更新到store中
    if (subtitles.value.length > 0) {
      videoStore.updateSubtitles(subtitles.value)
    }
  }
})

// 组件挂载时初始化
const componentRef = ref<HTMLElement | null>(null)

onMounted(() => {
  loadSubtitles()
  console.log('[Tuple-GPT] SiderComponent 已挂载，当前 URL:', videoStore.currentUrl)
  console.log('[Tuple-GPT] 当前平台:', videoStore.platformType === VideoType.YOUTUBE ? 'YouTube' : 'Bilibili')

  if (componentRef.value) {
    const rootNode = componentRef.value.getRootNode()
    if (rootNode instanceof ShadowRoot) {
      // 使用新的接口方式调用 useThemeManager
      const hostElement = rootNode.host as HTMLElement
      useThemeManager(() => hostElement)
    }
  }
})

// 总结视频功能
const summarizeVideo = () => {
  // 切换到总结选项卡
  activeTab.value = 'summary'
}
</script>

<template>
  <div ref="componentRef" class="w-full h-full bg-surface text-foreground rounded-lg shadow-lg font-sans text-sm overflow-hidden flex flex-col">
    <!-- 头部 -->
    <header class="flex justify-between items-center p-3 border-b border-border flex-shrink-0">
      <div class="flex items-center gap-2">
        <img src="../../assets/sider-logo.svg" alt="Sider" class="w-7 h-7" />
        <h1 class="text-lg font-bold text-foreground">Sider</h1>
      </div>
      <div class="flex items-center gap-3 text-foreground">
        <!-- Sliding Tab Switch -->
        <div class="relative flex items-center p-1 bg-muted rounded-lg">
          <!-- Slider -->
          <div
            class="absolute top-1 left-1 h-6 w-7 transform bg-background rounded-md shadow-sm transition-transform duration-200 ease-in-out"
            :style="{ transform: activeTab === 'summary' ? 'translateX(100%)' : 'translateX(0)' }"
          ></div>

          <!-- Subtitles Button -->
          <button @click="selectTab('subtitles')" class="relative z-10 p-1 w-7 h-6 flex justify-center items-center" :class="activeTab === 'subtitles' ? 'text-primary' : 'text-muted-foreground'">
            <Bars3Icon class="h-5 w-5" />
          </button>
          
          <!-- Summary/CC Button -->
          <button @click="selectTab('summary')" class="relative z-10 p-1 w-7 h-6 flex justify-center items-center" :class="activeTab === 'summary' ? 'text-primary' : 'text-muted-foreground'">
            <DocumentTextIcon class="h-5 w-5" />
          </button>
        </div>

        <span class="text-xs font-medium text-muted-foreground">{{ props.platformType === VideoType.YOUTUBE ? 'YT' : props.platformType === VideoType.BILIBILI ? 'BL' : '?' }}</span>
        <button class="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" @click="openSettings">
          <Cog6ToothIcon class="h-5 w-5" />
        </button>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="flex-grow overflow-y-auto">
      <div v-if="activeTab === 'subtitles'" class="p-3">
      <SubtitleViewer 
        :platform-type="props.platformType"
        :subtitles="subtitles"
        :is-loading="isLoading"
        :error="error"
        :subtitles-content="subtitlesContent"
        :load-subtitles="loadSubtitles"
      />
      </div>
    <!-- 总结视图 -->
      <div v-else-if="activeTab === 'summary'" class="p-3">
        <div class="flex justify-between items-center mb-2">
          <h2 class="text-base font-medium text-foreground">{{ videoTitle || '视频总结' }}</h2>
      </div>
      <SummaryViewer 
        :subtitles-content="subtitlesContent" 
        :video-title="videoTitle"
        @jump-to-time="jumpToTime"
      />
    </div>
    </main>

    <!-- Chat Footer -->
    <footer class="p-3 border-t border-border flex-shrink-0">
       <div class="flex items-center gap-2">
        <div class="flex-grow h-9 bg-muted rounded-lg flex items-center px-3 cursor-pointer group hover:bg-accent">
          <span class="text-sm text-muted-foreground group-hover:text-accent-foreground">与视频聊天</span>
        </div>
        <button class="p-1.5 rounded-lg bg-muted hover:bg-accent group">
          <ChatBubbleLeftIcon class="h-5 w-5 text-muted-foreground group-hover:text-accent-foreground" />
        </button>
        <button @click="summarizeVideo" class="px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 flex items-center justify-center text-sm">
          <DocumentChartBarIcon class="h-5 w-5 mr-1" />
          <span>总结</span>
        </button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* 美化滚动条 */
:deep(main::-webkit-scrollbar),
:deep(*::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(main::-webkit-scrollbar-track),
:deep(*::-webkit-scrollbar-track) {
  background: hsl(var(--muted) / 0.5);
  border-radius: 4px;
}

:deep(main::-webkit-scrollbar-thumb),
:deep(*::-webkit-scrollbar-thumb) {
  background: hsl(var(--primary) / 0.5);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}

:deep(main::-webkit-scrollbar-thumb:hover),
:deep(*::-webkit-scrollbar-thumb:hover) {
  background: hsl(var(--primary));
  background-clip: content-box;
}


</style>

