<template>
  <main>
    <h3>TupleGPT</h3>
    <p>这是一个基于 Side Panel API 的侧边栏。</p>
    <button @click="openOptionsPage">打开配置页面</button>
  </main>
</template>

<script setup lang="ts">
function openOptionsPage() {
  chrome.runtime.openOptionsPage()
}
</script> 