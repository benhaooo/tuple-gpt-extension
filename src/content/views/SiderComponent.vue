<script setup lang="ts">
// 组件的逻辑代码将在这里
import { ref } from 'vue'

const show = ref(true)
const bilingual = ref(false)

const subtitles = ref([
  { time: '00:00', text: '好咱们来看一道新鲜出炉的面试题' },
  { time: '00:02', text: '让你实现一个arrange' },
  { time: '00:03', text: '它可以是一个函数的形式' },
  { time: '00:05', text: '也可以是一个class的形式' },
  { time: '00:06', text: '无所谓的' },
  { time: '00:07', text: '它的功能是什么呢' },
  { time: '00:08', text: '它的功能就是可以不断的加入任务' },
  { time: '00:10', text: '比方说调用这个函数的时候' },
  { time: '00:12', text: '它就会加入一个任务' },
  { time: '00:13', text: '但是这个任务呢并不马上执行' },
  { time: '00:15', text: '只有调用了execute的时候才会执行' },
  { time: '00:18', text: '当他执行这个任务的时候' },
])
</script>

<template>
  <div v-if="show" class="w-80 bg-white rounded-lg border border-gray-200 p-4 font-sans text-sm text-gray-800">
    <header class="flex justify-between items-center mb-4">
      <h1 class="text-base font-medium">Sider</h1>
      <span class="text-sm font-medium text-gray-600">ZH</span>
    </header>

    <main>
      <div class="flex justify-between items-center mb-2.5">
        <h2 class="text-base font-medium">字幕</h2>
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <span>双语</span>
          <input type="checkbox" id="bilingual-checkbox" v-model="bilingual" class="hidden">
          <label for="bilingual-checkbox" class="cursor-pointer w-4 h-4 border-2 border-gray-500 rounded-sm inline-block"></label>
        </div>
      </div>

      <div class="space-y-1 text-gray-800">
        <div v-for="subtitle in subtitles" :key="subtitle.time" class="flex gap-3 leading-relaxed">
          <span class="text-gray-500 w-12 flex-shrink-0">{{ subtitle.time }}</span>
          <span>{{ subtitle.text }}</span>
        </div>
      </div>

      <button class="mt-4 px-3 py-1 border border-gray-300 rounded-md bg-transparent text-gray-700 hover:bg-gray-50">
        总结
      </button>
    </main>
  </div>
</template>

