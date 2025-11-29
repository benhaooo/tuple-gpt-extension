<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { VideoType } from '@/utils/subtitlesApi'
import { createSubtitlesHook } from '@/utils/subtitlesFactory'
import { useVideoStore } from '@/stores/videoStore'
// 导入组件
import SubtitleViewer from '@/components/subtitle/SubtitleViewer.vue'
import SummaryViewer from '@/components/summary/SummaryViewer.vue'
// 导入Heroicons图标
import {
  Bars3Icon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChatBubbleLeftIcon,
  DocumentChartBarIcon,
  ChevronDownIcon
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
const selectedLanguage = ref('')
const showLanguageDropdown = ref(false)
const isLanguageLoading = ref(false)

// 使用字幕工厂函数，只获取必要的字幕数据
const {
  videoTitle,
  subtitleInfo,
  availableLanguages,
  subtitlesContent,
  isLoading,
  error,
  initialize,
  cleanup
} = createSubtitlesHook(props.platformType)

// 计算属性：获取字幕列表
const subtitles = computed(() => subtitleInfo.value?.subtitles ?? [])

// 计算属性：获取当前选择的语言信息
const currentLanguage = computed(() => {
  if (selectedLanguage.value) {
    return availableLanguages.value.find(lang => lang.lan === selectedLanguage.value)
  }
  return availableLanguages.value[0]
})

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

// 语言选择处理函数
const selectLanguage = async (language: any) => {
  if (!language.subtitle_url) {
    console.warn('该语言没有字幕URL:', language)
    showLanguageDropdown.value = false
    return
  }

  selectedLanguage.value = language.lan
  showLanguageDropdown.value = false
  isLanguageLoading.value = true

  try {
    // 使用store的新方法加载字幕
    await videoStore.loadSubtitlesByLanguage(language)
    console.log('成功切换到语言:', language.lan_doc)
  } catch (error) {
    console.error('切换语言失败:', error)
    // 可以在这里显示错误提示
  } finally {
    isLanguageLoading.value = false
  }
}

// 切换下拉框显示状态
const toggleLanguageDropdown = () => {
  showLanguageDropdown.value = !showLanguageDropdown.value
}

// 关闭下拉框
const closeLanguageDropdown = () => {
  showLanguageDropdown.value = false
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
  if (componentRef.value) {
    const rootNode = componentRef.value.getRootNode()
    if (rootNode instanceof ShadowRoot) {
      // 使用新的接口方式调用 useThemeManager
      const hostElement = rootNode.host as HTMLElement
      useThemeManager(() => hostElement)
    }
  }

  // 添加全局点击事件监听器来关闭下拉框
  document.addEventListener('click', closeLanguageDropdown)
})

// 组件卸载时清理事件监听器
onUnmounted(() => {
  document.removeEventListener('click', closeLanguageDropdown)
})

// 总��视频功能
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

        <!-- Language Selection Dropdown -->
        <div class="relative">
          <button
            @click.stop="toggleLanguageDropdown"
            :disabled="isLanguageLoading"
            class="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLanguageLoading" class="animate-pulse">加载中...</span>
            <span v-else-if="currentLanguage">{{ currentLanguage.lan_doc?.slice(0, 8) || '语言' }}</span>
            <span v-else>语言</span>
            <ChevronDownIcon v-if="!isLanguageLoading" class="h-3 w-3" />
          </button>

          <!-- 下拉框 -->
          <div
            v-if="showLanguageDropdown && availableLanguages.length > 0"
            class="absolute top-full right-0 mt-1 w-32 bg-background border border-border rounded-md shadow-lg z-50"
            @click.stop
          >
            <div class="py-1 max-h-48 overflow-y-auto">
              <button
                v-for="language in availableLanguages"
                :key="language.lan"
                @click="selectLanguage(language)"
                class="w-full text-left px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                :class="{
                  'bg-accent text-accent-foreground': selectedLanguage === language.lan
                }"
              >
                {{ language.lan_doc }}
              </button>
            </div>
          </div>
        </div>
        <button class="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground" @click="openSettings">
          <Cog6ToothIcon class="h-5 w-5" />
        </button>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="flex-grow overflow-y-auto min-h-0">
      <div v-show="activeTab === 'subtitles'" class="p-3">
      <SubtitleViewer
        :platform-type="props.platformType"
        :is-loading="isLoading"
        :error="error"
        :subtitles-content="subtitlesContent"
        :load-subtitles="loadSubtitles"
      />
      </div>
    <!-- 总结视图 -->
      <div v-show="activeTab === 'summary'" class="p-3">
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

