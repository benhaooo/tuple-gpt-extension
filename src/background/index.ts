import { MessageType, sendMessageToTab } from '../utils/messages';

console.log('Tuple-GPT background script loaded');

// 存储活跃的标签页ID
const activeTabs = new Set<number>();

// 注册标签页
function registerTab(tabId: number): void {
  activeTabs.add(tabId);
  console.log(`Registered tab ${tabId}`);
  console.log('Active tabs:', Array.from(activeTabs));
}

// 取消注册标签页
function unregisterTab(tabId: number): void {
  if (activeTabs.delete(tabId)) {
    console.log(`Unregistered tab ${tabId}`);
  }
}

// 当标签页关闭时，移除其注册
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTabs.has(tabId)) {
    activeTabs.delete(tabId);
    console.log(`Removed registration for closed tab ${tabId}`);
  }
});

// 处理URL变化
function handleUrlChange(tabId: number, url: string): void {
  // 检查是否是注册的标签页
  if (activeTabs.has(tabId)) {
    console.log(`Notifying tab ${tabId} of URL change: ${url}`);
    
    // 发送URL变化通知
    sendMessageToTab(tabId, {
      type: MessageType.URL_CHANGE_NOTIFICATION,
      data: { url }
    }).catch(error => {
      console.error(`Failed to send notification to tab ${tabId}:`, error);
    });
  }
}

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  
  if (message.type === 'GET_TAB_ID') {
    sendResponse({ tabId });
    return true;
  }
  
  // 处理打开设置页面的请求
  if (message.action === 'openOptionsPage') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }
  
  if (!tabId) {
    sendResponse({ success: false, error: 'No tab ID in sender' });
    return true;
  }
  
  switch (message.type) {
    case MessageType.REGISTER_TAB:
      registerTab(tabId);
      sendResponse({ success: true });
      break;
      
    case MessageType.UNREGISTER_TAB:
      unregisterTab(tabId);
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
      break;
  }
  
  return true; // 保持消息通道开放
});

// 监听所有导航完成事件
chrome.webNavigation.onCompleted.addListener((details) => {
  // 仅处理主框架的导航
  if (details.frameId === 0) {
    const url = details.url;
    const tabId = details.tabId;
    
    // 处理URL变化
    handleUrlChange(tabId, url);
  }
});

// 监听URL片段变化（哈希变化，常见于SPA）
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  // 仅处理主框架的导航
  if (details.frameId === 0) {
    const url = details.url;
    const tabId = details.tabId;
    
    // 处理URL变化
    handleUrlChange(tabId, url);
  }
}); 