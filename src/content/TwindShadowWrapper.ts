import { defineCustomElement } from 'vue'
import { createPinia } from 'pinia'
import { waitFor } from '@/utils/domUtils'
import { useSettingsStore } from '@/stores/settingsStore'
import restStyles from '@unocss/reset/tailwind.css?inline'

/**
 * 将自定义元素注入到页面中的指定容器
 * @param options 注入选项
 */
export async function injectCustomElement(options: {
  containerSelector: string,     // 容器选择器
  tagName: string,              // 自定义元素标签名
  component: any,               // 要注入的Vue组件
  elementId: string,            // 注入元素的ID
  position?: 'append' | 'prepend' | 'afterElement' | 'beforeElement', // 插入位置
  targetElementSelector?: string, // 目标元素选择器（用于afterElement和beforeElement）
  timeout?: number,             // 超时时间（毫秒）
  styles?: Partial<CSSStyleDeclaration>, // 额外的样式
  props?: Record<string, any>,  // 传递给组件的属性
  shadowStyles?: string,        // 要注入到Shadow DOM中的CSS样式
}) {
  const {
    containerSelector,
    tagName,
    component,
    elementId,
    position = 'append',
    targetElementSelector,
    timeout = 10000,
    styles = {
      position: 'relative',
      zIndex: '9999',
      pointerEvents: 'auto',
      ...options.styles
    },
    props = {},
    shadowStyles
  } = options

  if (!customElements.get(tagName)) {
    const CustomElement = defineCustomElement({
      ...component,
      styles: [
        ...component.styles,
        shadowStyles,
        restStyles
      ],
      props: {
        ...component.props,
        ...Object.keys(props).reduce((acc, key) => {
          acc[key] = { type: null, default: () => props[key] }
          return acc
        }, {} as Record<string, any>)
      },
      setup(setupProps, ctx) {
        // 在组件内部创建并注入 Pinia
        const pinia = createPinia()
        ctx.app?.use(pinia)
        useSettingsStore(pinia)

        // 调用原组件的 setup
        if (component.setup) {
          return component.setup(setupProps, ctx)
        }
      }
    })

    customElements.define(tagName, CustomElement)
  }

  const container = await waitFor<HTMLElement>(containerSelector, timeout)

  if (!container) {
    console.log(`[Tuple-GPT] Failed to find container ${containerSelector}`)
    return
  }

  // 如果组件已存在，则不再注入
  if (document.getElementById(elementId)) {
    return
  }

  // 创建自定义元素的实例作为挂载点
  const mountPoint = document.createElement(tagName)
  mountPoint.id = elementId

  // 应用额外的样式
  Object.assign(mountPoint.style, styles)

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