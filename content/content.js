// content/content.js
import { TextProcessor } from './text-processor.js';
import { FloatingPopup } from './floating-popup.js';
import { SidebarManager } from './sidebar.js';

class ContentScript {
  constructor() {
    this.textProcessor = new TextProcessor();
    this.floatingPopup = new FloatingPopup();
    this.sidebarManager = new SidebarManager();
    this.config = null;
    this.lastSelection = null;
    
    this.init();
  }

  async init() {
    // 加载配置
    await this.loadConfig();
    
    // 绑定事件
    this.bindEvents();
    
    // 监听来自background的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
    
    console.log('Content script initialized');
  }

  async loadConfig() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      if (response.success) {
        this.config = response.data;
        this.textProcessor.wordThreshold = this.config.wordThreshold;
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  bindEvents() {
    // 鼠标释放时检测划词
    document.addEventListener('mouseup', (e) => {
      if (this.config?.autoTranslate !== false) {
        setTimeout(() => this.handleSelection(e), 10);
      }
    });

    // 点击空白处关闭弹窗
    document.addEventListener('mousedown', (e) => {
      if (!this.floatingPopup.contains(e.target)) {
        this.floatingPopup.hide();
      }
    });

    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.floatingPopup.hide();
        this.sidebarManager.close();
      }
    });

    // 监听配置变化
    window.addEventListener('focus', () => {
      this.loadConfig();
    });
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'triggerTranslate':
        this.triggerTranslate();
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  }

  handleSelection(e) {
    const selection = window.getSelection();
    const result = this.textProcessor.analyzeSelection(selection);
    
    if (!result) {
      this.floatingPopup.hide();
      return;
    }

    this.lastSelection = result;

    if (result.isWord) {
      // 显示悬浮弹窗
      this.floatingPopup.show(result.text, result.position);
    } else {
      // 打开侧边栏
      this.sidebarManager.open(result.text);
      this.floatingPopup.hide();
    }
  }

  triggerTranslate() {
    const selection = window.getSelection();
    const result = this.textProcessor.analyzeSelection(selection);
    
    if (!result) return;

    this.lastSelection = result;

    if (result.isWord) {
      this.floatingPopup.show(result.text, result.position);
    } else {
      this.sidebarManager.open(result.text);
    }
  }
}

// 初始化
new ContentScript();
