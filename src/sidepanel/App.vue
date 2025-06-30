<template>
  <div class="app-container">
    <header class="app-header">
      <h1>视频字幕助手</h1>
    </header>
    
    <main class="app-content">
      <SubtitleContainer />
    </main>
    
    <footer class="app-footer">
      <span>© 2023 字幕助手</span>
    </footer>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import SubtitleContainer from '../components/SubtitleContainer.vue'

export default defineComponent({
  name: 'App',
  components: {
    SubtitleContainer
  }
})
</script>

<style>
body {
  margin: 0;
  padding: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.app-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  padding: 12px 16px;
  background-color: #2196f3;
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.app-content {
  flex: 1;
  overflow: hidden;
}

.app-footer {
  padding: 8px 16px;
  background-color: #f5f5f5;
  color: #666;
  font-size: 12px;
  text-align: center;
  border-top: 1px solid #e0e0e0;
}
</style> 