import { defineCustomElement, DefineComponent } from 'vue'
import install from '@twind/with-web-components'
import { defineConfig } from '@twind/core'
import presetAutoprefix from '@twind/preset-autoprefix'
import presetTailwind from '@twind/preset-tailwind'

// Twind配置
const config = defineConfig({
  presets: [presetAutoprefix(), presetTailwind()],
  hash: false, // 不对类名进行哈希处理
})

// 创建Twind的Web Components包装器
const withTwind = install(config)

/**
 * 将Vue组件转换为支持Twind的自定义元素
 * @param component Vue组件
 * @param tagName 自定义元素的标签名
 * @returns 注册好的自定义元素构造器
 */
export function createTwindElement(component: DefineComponent<any, any, any>, tagName: string) {
  // 将组件转换为自定义元素构造器
  const CustomElement = defineCustomElement(component)
  
  // 如果自定义元素尚未定义，则注册
  if (!customElements.get(tagName)) {
    // 使用Twind包装自定义元素
    customElements.define(tagName, withTwind(CustomElement))
  }
  
  return CustomElement
}

/**
 * 将自定义元素注入到页面中的指定容器
 * @param options 注入选项
 */
export function injectCustomElement(options: {
  containerSelector: string,     // 容器选择器
  tagName: string,              // 自定义元素标签名
  elementId: string,            // 注入元素的ID
  position?: 'append' | 'prepend' | 'afterElement' | 'beforeElement', // 插入位置
  targetElementSelector?: string, // 目标元素选择器（用于afterElement和beforeElement）
  timeout?: number,             // 超时时间（毫秒）
  styles?: Partial<CSSStyleDeclaration>, // 额外的样式
}) {
  const {
    containerSelector,
    tagName,
    elementId,
    position = 'append',
    targetElementSelector,
    timeout = 10000,
    styles = {}
  } = options
  
  // 等待目标容器加载完成
  let timeoutId: number | undefined
  const checkContainer = setInterval(() => {
    const container = document.querySelector(containerSelector)
    if (container) {
      clearInterval(checkContainer)
      if (timeoutId) clearTimeout(timeoutId)
      
      // 如果组件已存在，则不再注入
      if (document.getElementById(elementId)) {
        console.log(`[Tuple-GPT] Component host ${elementId} already exists.`)
        return
      }
      
      // 创建自定义元素的实例作为挂载点
      const mountPoint = document.createElement(tagName)
      mountPoint.id = elementId
      
      // 应用额外的样式
      Object.entries(styles).forEach(([prop, value]) => {
        if (value) {
          // @ts-ignore - 动态设置样式属性
          mountPoint.style[prop] = value
        }
      })
      
      // 根据指定的位置插入元素
      switch (position) {
        case 'prepend':
          container.insertBefore(mountPoint, container.firstChild)
          break
          
        case 'afterElement':
          if (targetElementSelector) {
            const targetElement = container.querySelector(targetElementSelector)
            if (targetElement) {
              targetElement.insertAdjacentElement('afterend', mountPoint)
              break
            }
          }
          // 如果没有找到目标元素，回退到append
          container.appendChild(mountPoint)
          break
          
        case 'beforeElement':
          if (targetElementSelector) {
            const targetElement = container.querySelector(targetElementSelector)
            if (targetElement) {
              targetElement.insertAdjacentElement('beforebegin', mountPoint)
              break
            }
          }
          // 如果没有找到目标元素，回退到append
          container.appendChild(mountPoint)
          break
          
        case 'append':
        default:
          container.appendChild(mountPoint)
          break
      }
      
      console.log(`[Tuple-GPT] Component injected with ID ${elementId} using Shadow DOM.`)
    }
  }, 500) // 每500ms检查一次
  
  // 设置超时，避免无限检查
  timeoutId = window.setTimeout(() => {
    clearInterval(checkContainer)
    console.log(`[Tuple-GPT] Failed to find container ${containerSelector}`)
  }, timeout)
} 