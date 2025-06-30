import { defineCustomElement, createApp } from 'vue'
import { createPinia } from 'pinia'
import install from '@twind/with-web-components'
import { setup } from '@twind/core'
import twindConfig from '../../twind.config'

// 创建Twind的Web Components包装器
// install 会处理好隔离，无需全局 setup
const withTwind = install(twindConfig)

/**
 * 为普通页面（非Shadow DOM）设置Twind
 * 这适用于扩展的选项页和弹出页等
 */
export function setupGlobalTwind() {
  setup(twindConfig)
}

/**
 * 将Vue组件转换为支持Twind的自定义元素
 * @param component Vue组件
 * @param tagName 自定义元素的标签名
 * @param options 额外选项，如插件等
 * @returns 注册好的自定义元素构造器
 */
export function createTwindElement(component: any, tagName: string, options?: { plugins?: any[] }) {
  // 注意：这个函数现在主要用于那些不需要Pinia注入的简单场景，
  // 或者Pinia在组件内部自己处理。
  // 对于需要共享store的注入，injectCustomElement中的方法更可靠。

  // 将组件转换为自定义元素构造器（内部使用 Shadow DOM）
  const CustomElement = defineCustomElement({
    ...component,
  })
  
  // 如果自定义元素尚未定义，则注册
  if (!customElements.get(tagName)) {
    // 使用Twind包装自定义元素
    const TwindElement = withTwind(CustomElement)
    
    // 定义自定义元素
    customElements.define(tagName, TwindElement)
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
  component: any,               // 要注入的Vue组件
  elementId: string,            // 注入元素的ID
  position?: 'append' | 'prepend' | 'afterElement' | 'beforeElement', // 插入位置
  targetElementSelector?: string, // 目标元素选择器（用于afterElement和beforeElement）
  timeout?: number,             // 超时时间（毫秒）
  styles?: Partial<CSSStyleDeclaration>, // 额外的样式
  props?: Record<string, any>,  // 传递给组件的属性
}) {
  const {
    containerSelector,
    tagName,
    component,
    elementId,
    position = 'append',
    targetElementSelector,
    timeout = 10000,
    styles = {},
    props = {}
  } = options

  // 定义一个Web Component，它在内部渲染我们的Vue组件并提供Pinia
  if (!customElements.get(tagName)) {
    // 使用Twind包装器
    const TwindElement = withTwind(class extends HTMLElement {
      constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });

        // 创建一个宿主元素，因为app.mount需要一个常规元素
        const appHost = document.createElement('div');
        shadowRoot.appendChild(appHost);

        const app = createApp(component, props);
        app.use(createPinia()); // 为这个组件实例创建一个新的Pinia
        app.mount(appHost);
      }
    });

    customElements.define(tagName, TwindElement);
  }
  
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
      
      // 设置props
      if (props) {
        Object.entries(props).forEach(([key, value]) => {
          // 将驼峰命名转换为kebab-case (例如 platformType -> platform-type)
          const kebabKey = key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
          // 对于复杂类型，转换为JSON字符串
          const propValue = typeof value === 'object' ? JSON.stringify(value) : value
          mountPoint.setAttribute(kebabKey, propValue)
        })
      }
      
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