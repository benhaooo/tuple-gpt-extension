# 项目主题系统文档

本文档详细介绍了本项目现代化、基于 CSS 变量的主题系统。该系统旨在实现高度的可维护性、可扩展性和优秀的开发体验。

---

## 1. 核心理念

本主题系统的核心是**分离关注点**：

1.  **颜色定义 (The "What")**: 在一个中心化的位置定义所有主题（如亮色、暗色）的颜色值。
2.  **样式应用 (The "How")**: 组件在应用样式时，不关心具体的颜色值，而是使用代表其功能的**语义化名称**（如 `primary`, `background`）。
3.  **动态注入 (The "Magic")**: 通过一个管理器，根据用户的选择，将对应主题的颜色值作为 **CSS 变量**动态注入到 DOM 中，从而实现主题的即时切换。

---

## 2. 技术栈

*   **Twind**: 一个 CSS-in-JS 库，它让我们可以在 JavaScript/TypeScript 文件中编写类似 Tailwind CSS 的功能类，并提供了强大的配置能力。
*   **Pinia**: Vue 的官方状态管理库，用于存储和管理用户选择的主题等全局设置。
*   **CSS Custom Properties (Variables)**: 主题切换的核心技术。我们通过改变 CSS 变量的值来改变整个应用的颜色。

---

## 3. 架构与关键文件

主题系统由以下几个文件协同工作：

| 文件 | 角色 | 职责 |
| :--- | :--- | :--- |
| **`src/constants/themes.ts`** | **颜色蓝图 (Source of Truth)** | 定义所有可用主题（`light`, `dark`）及其对应的 HSL 颜色值。 |
| **`twind.config.ts`** | **样式桥梁 (The Bridge)** | 配置 Twind，将语义化的颜色名称映射到对应的 CSS 变量。 |
| **`src/store/settingsStore.ts`** | **状态中心 (State Manager)** | 使用 Pinia 存储用户当前的主题选择，并将其持久化到 `chrome.storage`。 |
| **`src/composables/useThemeManager.ts`**| **应用引擎 (The Engine)** | 监听主题状态变化，并负责将颜色值作为 CSS 变量动态注入到 DOM 中。 |

---

## 4. 工作流程

下图展示了当用户切换主题时，系统内部的完整工作流程：

```mermaid
graph TD
    subgraph "用户界面 (Vue Component)"
        A[用户点击切换主题按钮] --> B{调用 `settingsStore.updateSettings`}
    end

    subgraph "状态管理 (Pinia)"
        B --> C[settings.theme 状态改变]
    end

    subgraph "主题应用核心"
        C -->|触发 watch| D(useThemeManager)
        D -->|读取颜色值| E[src/constants/themes.ts]
        D -->|注入 CSS 变量| F[DOM (<html> 或 Shadow Host)]
    end
    
    subgraph "浏览器渲染"
       F -->|读取新变量值| G[Twind/浏览器]
       G --> H[UI 界面颜色更新]
    end
```

### 流程详解：

1.  **用户操作**: 用户在 UI 上选择一个新主题。
2.  **状态更新**: Vue 组件调用 `settingsStore` 的 action，更新 `settings.theme` 的值。
3.  **触发监听**: `useThemeManager` 中 `watch` 函数侦测到 `settings.theme` 的变化。
4.  **应用主题**: `useThemeManager` 的 `applyTheme` 函数被执行。
5.  **获取颜色**: `applyTheme` 从 `themes.ts` 中获取新主题对应的所有颜色值。
6.  **注入变量**: `applyTheme` 将这些颜色值以 CSS 变量的形式（如 `--primary: 240 5.9% 10%`）设置到目标 DOM 元素（通常是 `<html>` 或 Shadow DOM 的宿主元素）的 `style` 属性上。
7.  **浏览器重绘**: 浏览器检测到 CSS 变量的变化，并立即重新渲染所有使用这些变量的元素，完成主题切换。

---

## 5. 如何在组件中使用主题

### 5.1 基础用法

对于绝大多数组件，只需两步：

1.  在 `<script setup>` 中调用 `useThemeManager()` 来激活主题管理。
2.  在 `<template>` 中直接使用语义化的 Tailwind CSS 类名。

**示例 (`SidePanel.vue`)**:
```vue
<script setup lang="ts">
import { useThemeManager } from '@/composables/useThemeManager';

// 1. 激活主题管理
useThemeManager();
</script>

<template>
  <!-- 2. 使用语义化类名 -->
  <div class="bg-background text-foreground">
    <button class="bg-primary text-primary-foreground">Click Me</button>
  </div>
</template>
```

### 5.2 动态用法

组件可以根据 `props` 动态选择应用不同的颜色"风味"。

**示例 (`ContentSection.vue`)**:
```vue
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  colorTheme: 'primary' | 'secondary';
}>();

const themeClasses = computed(() => {
  // 根据 prop 映射到具体的 "soft" 颜色类
  if (props.colorTheme === 'primary') {
    return { bg: 'bg-primary-soft', text: 'text-primary-soft-foreground' };
  }
  // ...
});
</script>

<template>
  <div :class="[themeClasses.bg, themeClasses.text]">
    This section has a dynamic background color.
  </div>
</template>
```

### 5.3 在 Shadow DOM 中使用

对于需要样式隔离的内容脚本，必须将 CSS 变量注入到 Shadow DOM 的宿主元素上。

**示例 (`SiderComponent.ce.vue`)**:
```typescript
onMounted(() => {
  const rootNode = componentRef.value?.getRootNode();
  if (rootNode instanceof ShadowRoot) {
    const hostElement = rootNode.host as HTMLElement;
    // 将宿主元素作为注入目标传递给 useThemeManager
    useThemeManager(() => hostElement);
  }
})
```

---

## 6. 如何扩展主题系统

扩展此系统非常简单，通常只需要修改两个文件。

### 6.1 添加一个新的颜色

假设我们需要为"成功"状态添加一个新的绿色。

1.  **在 `src/constants/themes.ts` 中定义颜色**:
    *   在 `Theme` interface 中添加新颜色名称。
    *   在 `light` 和 `dark` 对象中添加对应的 HSL 值。

    ```typescript
    export interface Theme {
      // ...
      success: string;
      'success-foreground': string;
    }

    export const themes: Record<ThemeName, Theme> = {
      light: {
        // ...
        success: '140 80% 40%',
        'success-foreground': '0 0% 100%',
      },
      dark: {
        // ...
        success: '140 70% 50%',
        'success-foreground': '0 0% 0%',
      },
    };
    ```

2.  **在 `twind.config.ts` 中映射颜色**:
    *   在 `theme.extend.colors` 对象中添加新的映射。

    ```typescript
    export default defineConfig({
      theme: {
        extend: {
          colors: {
            // ...
            success: {
              DEFAULT: 'hsl(var(--success))',
              foreground: 'hsl(var(--success-foreground))',
            },
          },
        },
      },
    })
    ```

3.  **使用新颜色**: 现在你可以在任何组件中使用 `bg-success`, `text-success-foreground` 等类名了。

### 6.2 添加一个新的主题

如果需要添加一个全新的主题（例如 `sepia` 棕褐色主题）：

1.  **在 `src/constants/themes.ts` 中**:
    *   将新主题名添加到 `ThemeName` 类型中: `export type ThemeName = 'light' | 'dark' | 'sepia';`
    *   在 `themes` 对象中添加一个完整的 `sepia` 主题颜色定义。
2.  **更新 UI**: 在允许用户选择主题的组件中（如 `src/options/App.vue`），添加新主题的选项。

系统将自动处理其余的工作。 