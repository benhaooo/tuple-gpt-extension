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

// 处理 AI 内容生成请求
async function handleAIContentGeneration(prompt: string, tabId: number, sendResponse: (response: any) => void): Promise<void> {
  try {
    const response = await fetch('https://pikachu.claudecode.love/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sk-8d47de117a1a7e9db9827885b52c0cfef43f33f1462c45893b368d16a0a53367'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        messages: [
          { role: 'user', content: prompt }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      sendResponse({
        success: false,
        error: `API请求失败: ${response.status}`
      });
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      sendResponse({
        success: false,
        error: '无法获取响应流'
      });
      return;
    }

    // 开始流式响应
    sendResponse({ success: true, streaming: true });

    // 读取流数据
    const decoder = new TextDecoder();
    let done = false;
    let buffer = ''; // 用于处理跨块的数据

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // 解析 Claude API 的 SSE 数据
      const lines = buffer.split('\n');
      // 保留最后一行（可能不完整）
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const jsonStr = line.substring(6).trim();
            if (!jsonStr) continue; // 跳过空数据行

            const data = JSON.parse(jsonStr);

            // Claude API 的流式响应格式 - 只处理 content_block_delta
            if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta' && data.delta?.text) {
              // 发送到特定的 tab
              chrome.tabs.sendMessage(tabId, {
                type: 'AI_CONTENT_CHUNK',
                chunk: data.delta.text
              }).catch(err => {
                console.error('发送消息到 tab 失败:', err);
              });
            }
          } catch (e) {
            console.error('解析流数据失败', e, line);
          }
        }
      }
    }

    // 发送完成信号到特定的 tab
    chrome.tabs.sendMessage(tabId, {
      type: 'AI_CONTENT_COMPLETE'
    }).catch(err => {
      console.error('发送完成消息到 tab 失败:', err);
    });

  } catch (error) {
    console.error('处理API请求失败:', error);
    const err = error as Error;
    sendResponse({
      success: false,
      error: err.message
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

    case MessageType.TRANSCRIBE_BILIBILI_AUDIO:
      // 转发音频转录消息到对应的content script
      sendMessageToTab(tabId, message).then(response => {
        sendResponse(response);
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      break;

    case 'GENERATE_AI_CONTENT':
      // 处理 AI 内容生成请求
      handleAIContentGeneration(message.prompt, tabId, sendResponse);
      return true; // 保持异步响应通道开放

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
      break;
  }
  
  return true; // 保持消息通道开放
});

// 监听标签页更新事件（包括URL变化）
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // 当URL发生变化时
  if (changeInfo.url) {
    console.log(`Tab ${tabId} URL changed to: ${changeInfo.url}`);
    
    // 直接发送消息到 content script
    chrome.tabs.sendMessage(tabId, {
      type: 'URL_CHANGE_NOTIFICATION',
      data: { url: changeInfo.url }
    })
  }
}); 