# Edge划词翻译插件实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 开发一个Edge浏览器扩展，支持划词翻译、本地大模型集成、音标显示、语音朗读功能

**架构:** 使用Chrome Extension Manifest V3架构，包含content scripts（划词检测和UI展示）、background service worker（LLM通信）、options page（配置界面）。单词使用悬浮弹窗，句子使用Chrome Side Panel API。

**Tech Stack:** JavaScript ES6+, Chrome Extension APIs (Storage, Side Panel, Tabs), Web Speech API, OpenAI-compatible API format

---

## 项目结构

```
edge-local-llm-translate-plugin/
├── manifest.json                  # 扩展清单配置
├── background/
│   ├── background.js              # Service worker主入口
│   ├── llm-client.js              # LLM引擎客户端
│   └── config-manager.js          # 配置管理器
├── content/
│   ├── content.js                 # 内容脚本（划词检测）
│   ├── floating-popup.js          # 悬浮弹窗组件
│   ├── sidebar.js                 # 侧边栏组件
│   ├── text-processor.js          # 文本处理
│   ├── styles/
│   │   ├── floating-popup.css     # 悬浮弹窗样式
│   │   └── sidebar.css            # 侧边栏样式
│   └── floating-popup.html        # 悬浮弹窗模板
├── sidepanel/
│   ├── sidepanel.html             # 侧边栏页面
│   ├── sidepanel.js               # 侧边栏逻辑
│   └── sidepanel.css              # 侧边栏样式
├── options/
│   ├── options.html               # 设置页面
│   ├── options.js                 # 设置逻辑
│   └── options.css                # 设置页面样式
├── shared/
│   ├── constants.js               # 常量定义
│   ├── utils.js                   # 工具函数
│   └── tts.js                     # TTS模块
└── icons/                         # 扩展图标
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Phase 1: 基础框架

### Task 1: 创建项目结构和Manifest V3配置

**Files:**
- Create: `manifest.json`
- Create: `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` (占位符)

- [ ] **Step 1: 创建manifest.json**

```json
{
  "manifest_version": 3,
  "name": "本地LLM划词翻译",
  "version": "1.0.0",
  "description": "使用本地大模型进行划词翻译，支持单词音标和语音朗读",
  "permissions": [
    "storage",
    "sidePanel",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "http://localhost/*"
  ],
  "background": {
    "service_worker": "background/background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content.js"],
      "css": ["content/styles/floating-popup.css"],
      "run_at": "document_end"
    }
  ],
  "side_panel": {
    "default_path": "sidepanel/sidepanel.html"
  },
  "options_page": "options/options.html",
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "本地LLM划词翻译"
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "commands": {
    "translate-selection": {
      "suggested_key": {
        "default": "Alt+T"
      },
      "description": "翻译选中的文本"
    }
  }
}
```

- [ ] **Step 2: 创建图标占位符**

```bash
# 使用ImageMagick或在线工具生成简单图标
# 这里先创建SVG占位符，后续可替换
mkdir -p icons
echo '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><rect width="128" height="128" fill="#4CAF50"/><text x="64" y="80" font-size="60" text-anchor="middle" fill="white">译</text></svg>' > icons/icon.svg
```

- [ ] **Step 3: 创建目录结构**

```bash
mkdir -p background content/styles sidepanel options shared icons
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: create extension structure and manifest v3"
```

---

### Task 2: 创建共享常量和工具函数

**Files:**
- Create: `shared/constants.js`
- Create: `shared/utils.js`

- [ ] **Step 1: 创建constants.js**

```javascript
// shared/constants.js

export const ENGINE_TYPES = {
  OLLAMA: 'ollama',
  VLLM: 'vllm',
  LMSTUDIO: 'lmstudio',
  LITELLM: 'litellm'
};

export const DEFAULT_CONFIG = {
  engineType: ENGINE_TYPES.OLLAMA,
  apiUrl: 'http://localhost:11434',
  modelName: 'qwen2.5:7b',
  sourceLanguages: ['英文'],
  targetLanguage: '中文',
  ttsVoice: 'auto',
  ttsRate: 1.0,
  autoTranslate: true,
  wordThreshold: 20,
  hotkey: 'Alt+T'
};

export const ENGINE_DEFAULTS = {
  [ENGINE_TYPES.OLLAMA]: { apiUrl: 'http://localhost:11434', apiPath: '/v1/chat/completions' },
  [ENGINE_TYPES.VLLM]: { apiUrl: 'http://localhost:8000', apiPath: '/v1/chat/completions' },
  [ENGINE_TYPES.LMSTUDIO]: { apiUrl: 'http://localhost:1234', apiPath: '/v1/chat/completions' },
  [ENGINE_TYPES.LITELLM]: { apiUrl: 'http://localhost:4000', apiPath: '/v1/chat/completions' }
};

export const LANGUAGES = [
  { code: 'en', name: '英文' },
  { code: 'zh', name: '中文' },
  { code: 'ja', name: '日文' },
  { code: 'ko', name: '韩文' },
  { code: 'fr', name: '法文' },
  { code: 'de', name: '德文' },
  { code: 'es', name: '西班牙文' },
  { code: 'ru', name: '俄文' }
];

export const CACHE_CONFIG = {
  MAX_ENTRIES: 1000,
  EXPIRY_DAYS: 7,
  KEY_PREFIX: 'cache:'
};

export const PROMPT_TEMPLATES = {
  word: (word, targetLang) => `请翻译以下单词，并提供音标。
格式要求：
- 音标：/音标/
- 释义：${targetLang}释义
- 例句：一个英文例句（${targetLang}翻译）

单词：${word}
目标语言：${targetLang}`,

  sentence: (text, targetLang) => `请将以下文本翻译成${targetLang}，保持原文的语气和风格。

原文：${text}

翻译：`
};
```

- [ ] **Step 2: 创建utils.js**

```javascript
// shared/utils.js

/**
 * 生成缓存键
 */
export function generateCacheKey(text, sourceLang, targetLang) {
  const str = `${text}:${sourceLang}:${targetLang}`;
  return hashString(str);
}

/**
 * 简单的字符串哈希
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * 从LLM响应中提取音标
 */
export function extractPhonetic(response) {
  const match = response.match(/\/[\u0250-\u02AF\u02B0-\u02FFˈˌ]+\//);
  return match ? match[0] : null;
}

/**
 * 解析单词翻译响应
 */
export function parseWordTranslation(response) {
  const phonetic = extractPhonetic(response);
  
  // 提取释义（在"释义："之后的内容）
  const meaningMatch = response.match(/释义[：:]\s*(.+)/);
  const meaning = meaningMatch ? meaningMatch[1].trim() : response;
  
  // 提取例句
  const exampleMatch = response.match(/例句[：:]\s*(.+)/);
  const example = exampleMatch ? exampleMatch[1].trim() : null;
  
  return { phonetic, meaning, example, raw: response };
}

/**
 * 解析句子翻译响应
 */
export function parseSentenceTranslation(response) {
  // 尝试提取"翻译："之后的内容
  const translationMatch = response.match(/翻译[：:]\s*([\s\S]+)/);
  if (translationMatch) {
    return translationMatch[1].trim();
  }
  // 如果没有特定格式，返回整个响应
  return response.trim();
}

/**
 * 检查文本是单词还是句子
 */
export function isWord(text, threshold = 20) {
  return text.length < threshold && !text.includes(' ');
}

/**
 * 防抖函数
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 获取相对于视口的位置
 */
export function getViewportPosition(selection) {
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.bottom + 10,
    width: rect.width,
    height: rect.height
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add shared/
git commit -m "feat: add shared constants and utilities"
```

---

## Phase 2: 配置管理

### Task 3: 实现配置管理器

**Files:**
- Create: `background/config-manager.js`
- Create: `background/background.js` (基础框架)

- [ ] **Step 1: 创建config-manager.js**

```javascript
// background/config-manager.js
import { DEFAULT_CONFIG, ENGINE_DEFAULTS, CACHE_CONFIG } from '../shared/constants.js';

class ConfigManager {
  constructor() {
    this.cache = new Map();
  }

  async getConfig() {
    try {
      const result = await chrome.storage.sync.get('config');
      return { ...DEFAULT_CONFIG, ...result.config };
    } catch (error) {
      console.error('Failed to get config:', error);
      return DEFAULT_CONFIG;
    }
  }

  async setConfig(config) {
    try {
      await chrome.storage.sync.set({ config });
      return true;
    } catch (error) {
      console.error('Failed to save config:', error);
      return false;
    }
  }

  async getEngineConfig() {
    const config = await this.getConfig();
    const defaults = ENGINE_DEFAULTS[config.engineType];
    return {
      ...defaults,
      apiUrl: config.apiUrl || defaults.apiUrl,
      modelName: config.modelName
    };
  }

  // 缓存管理
  async getCache(key) {
    try {
      const fullKey = CACHE_CONFIG.KEY_PREFIX + key;
      const result = await chrome.storage.local.get(fullKey);
      const cached = result[fullKey];
      
      if (!cached) return null;
      
      // 检查过期
      const age = Date.now() - cached.timestamp;
      const maxAge = CACHE_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      
      if (age > maxAge) {
        await chrome.storage.local.remove(fullKey);
        return null;
      }
      
      return cached.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async setCache(key, data) {
    try {
      const fullKey = CACHE_CONFIG.KEY_PREFIX + key;
      await chrome.storage.local.set({
        [fullKey]: {
          data,
          timestamp: Date.now()
        }
      });
      
      // 清理过期缓存
      await this.cleanExpiredCache();
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async cleanExpiredCache() {
    try {
      const all = await chrome.storage.local.get(null);
      const keys = Object.keys(all).filter(k => k.startsWith(CACHE_CONFIG.KEY_PREFIX));
      
      if (keys.length > CACHE_CONFIG.MAX_ENTRIES) {
        // 按时间戳排序，删除最旧的
        const sorted = keys
          .map(k => ({ key: k, timestamp: all[k].timestamp }))
          .sort((a, b) => a.timestamp - b.timestamp);
        
        const toDelete = sorted.slice(0, sorted.length - CACHE_CONFIG.MAX_ENTRIES);
        await chrome.storage.local.remove(toDelete.map(i => i.key));
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }
}

export default new ConfigManager();
```

- [ ] **Step 2: 更新background.js基础框架**

```javascript
// background/background.js
import configManager from './config-manager.js';

// 安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // 保持消息通道开放
});

async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'getConfig':
        const config = await configManager.getConfig();
        sendResponse({ success: true, data: config });
        break;
        
      case 'setConfig':
        const saved = await configManager.setConfig(request.config);
        sendResponse({ success: saved });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// 监听快捷键
chrome.commands.onCommand.addListener((command) => {
  if (command === 'translate-selection') {
    translateCurrentSelection();
  }
});

async function translateCurrentSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { action: 'triggerTranslate' });
    }
  } catch (error) {
    console.error('Failed to trigger translation:', error);
  }
}

console.log('Background service worker started');
```

- [ ] **Step 3: Commit**

```bash
git add background/
git commit -m "feat: add config manager with caching"
```

---

## Phase 3: TTS模块

### Task 4: 实现TTS模块

**Files:**
- Create: `shared/tts.js`

- [ ] **Step 1: 创建tts.js**

```javascript
// shared/tts.js

class TTSManager {
  constructor() {
    this.synth = window.speechSynthesis;
    this.currentUtterance = null;
  }

  /**
   * 获取所有可用语音
   */
  getVoices() {
    return this.synth.getVoices();
  }

  /**
   * 获取指定语言的语音
   */
  getVoicesByLang(langCode) {
    const voices = this.getVoices();
    const langMap = {
      'en': ['en', 'en-US', 'en-GB'],
      'zh': ['zh', 'zh-CN', 'zh-TW', 'zh-HK'],
      'ja': ['ja', 'ja-JP'],
      'ko': ['ko', 'ko-KR'],
      'fr': ['fr', 'fr-FR'],
      'de': ['de', 'de-DE'],
      'es': ['es', 'es-ES'],
      'ru': ['ru', 'ru-RU']
    };
    
    const prefixes = langMap[langCode] || [langCode];
    return voices.filter(v => prefixes.some(p => v.lang.startsWith(p)));
  }

  /**
   * 朗读文本
   */
  speak(text, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // 停止当前朗读
      this.stop();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // 设置语音
      if (options.voice) {
        utterance.voice = options.voice;
      } else if (options.lang) {
        const voices = this.getVoicesByLang(options.lang);
        if (voices.length > 0) {
          utterance.voice = voices[0];
        }
      }

      // 设置参数
      utterance.rate = options.rate || 1.0;
      utterance.pitch = options.pitch || 1.0;
      utterance.volume = options.volume || 1.0;

      utterance.onend = () => {
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  /**
   * 停止朗读
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * 是否正在朗读
   */
  isSpeaking() {
    return this.synth ? this.synth.speaking : false;
  }
}

// 导出单例
export const ttsManager = new TTSManager();
export default ttsManager;
```

- [ ] **Step 2: Commit**

```bash
git add shared/tts.js
git commit -m "feat: add TTS manager using Web Speech API"
```

---

## Phase 4: LLM客户端

### Task 5: 实现LLM客户端

**Files:**
- Create: `background/llm-client.js`
- Modify: `background/background.js` (添加翻译处理)

- [ ] **Step 1: 创建llm-client.js**

```javascript
// background/llm-client.js
import configManager from './config-manager.js';
import { ENGINE_TYPES, PROMPT_TEMPLATES } from '../shared/constants.js';

class LLMClient {
  constructor() {
    this.timeout = 30000; // 30秒超时
  }

  async translate(text, isWord, targetLang) {
    const engineConfig = await configManager.getEngineConfig();
    const prompt = isWord 
      ? PROMPT_TEMPLATES.word(text, targetLang)
      : PROMPT_TEMPLATES.sentence(text, targetLang);

    try {
      const response = await this.callLLM(engineConfig, prompt);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Translation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async callLLM(config, prompt) {
    const { apiUrl, apiPath, modelName, engineType } = config;
    
    // 优先使用OpenAI兼容格式
    let url = `${apiUrl}${apiPath}`;
    let body = this.buildOpenAIRequest(modelName, prompt);
    
    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        // 如果是Ollama且返回404，尝试原生格式
        if (engineType === ENGINE_TYPES.OLLAMA && response.status === 404) {
          return await this.callOllamaNative(apiUrl, modelName, prompt);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseOpenAIResponse(data);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('请求超时，请检查本地模型服务是否运行');
      }
      throw error;
    }
  }

  buildOpenAIRequest(modelName, prompt) {
    return {
      model: modelName,
      messages: [
        { role: 'system', content: '你是一个专业的翻译助手，提供准确的翻译和音标。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1024
    };
  }

  parseOpenAIResponse(data) {
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }
    throw new Error('Invalid response format');
  }

  async callOllamaNative(apiUrl, modelName, prompt) {
    const url = `${apiUrl}/api/generate`;
    
    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelName,
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama native API error: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  }

  fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    return fetch(url, { ...options, signal: controller.signal })
      .finally(() => clearTimeout(timeoutId));
  }

  async testConnection() {
    try {
      const engineConfig = await configManager.getEngineConfig();
      const { apiUrl, engineType } = engineConfig;
      
      // 尝试简单的连接测试
      const testUrl = engineType === ENGINE_TYPES.OLLAMA 
        ? `${apiUrl}/api/tags`
        : `${apiUrl}/v1/models`;
      
      const response = await fetch(testUrl, { method: 'GET' });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export default new LLMClient();
```

- [ ] **Step 2: 更新background.js添加翻译处理**

```javascript
// background/background.js
import configManager from './config-manager.js';
import llmClient from './llm-client.js';
import { generateCacheKey, isWord, parseWordTranslation, parseSentenceTranslation } from '../shared/utils.js';

// 安装时初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

// 监听来自content script的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // 保持消息通道开放
});

async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'getConfig':
        const config = await configManager.getConfig();
        sendResponse({ success: true, data: config });
        break;
        
      case 'setConfig':
        const saved = await configManager.setConfig(request.config);
        sendResponse({ success: saved });
        break;
        
      case 'translate':
        const result = await handleTranslate(request.text, request.isWord, request.targetLang);
        sendResponse(result);
        break;
        
      case 'testConnection':
        const connected = await llmClient.testConnection();
        sendResponse({ success: true, connected });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleTranslate(text, isWord, targetLang) {
  // 检查缓存
  const cacheKey = generateCacheKey(text, isWord ? 'word' : 'sentence', targetLang);
  const cached = await configManager.getCache(cacheKey);
  
  if (cached) {
    console.log('Cache hit for:', text);
    return { success: true, data: cached, fromCache: true };
  }

  // 调用LLM翻译
  const result = await llmClient.translate(text, isWord, targetLang);
  
  if (result.success) {
    // 解析响应
    let parsed;
    if (isWord) {
      parsed = parseWordTranslation(result.data);
    } else {
      parsed = { translation: parseSentenceTranslation(result.data) };
    }
    
    // 保存到缓存
    await configManager.setCache(cacheKey, parsed);
    
    return { success: true, data: parsed };
  }
  
  return result;
}

// 监听快捷键
chrome.commands.onCommand.addListener((command) => {
  if (command === 'translate-selection') {
    translateCurrentSelection();
  }
});

async function translateCurrentSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { action: 'triggerTranslate' });
    }
  } catch (error) {
    console.error('Failed to trigger translation:', error);
  }
}

console.log('Background service worker started');
```

- [ ] **Step 3: Commit**

```bash
git add background/
git commit -m "feat: add LLM client with OpenAI-compatible and Ollama native support"
```

---

## Phase 5: 内容脚本和划词检测

### Task 6: 实现内容脚本

**Files:**
- Create: `content/text-processor.js`
- Create: `content/content.js`

- [ ] **Step 1: 创建text-processor.js**

```javascript
// content/text-processor.js

export class TextProcessor {
  constructor(config = {}) {
    this.wordThreshold = config.wordThreshold || 20;
  }

  /**
   * 分析选中的文本
   */
  analyzeSelection(selection) {
    const text = selection.toString().trim();
    
    if (!text || text.length < 2) {
      return null;
    }

    // 检查是否在输入框中
    const activeElement = document.activeElement;
    if (this.isInputElement(activeElement)) {
      return null;
    }

    const isWord = this.isWord(text);
    const position = this.getSelectionPosition(selection);

    return {
      text,
      isWord,
      position,
      length: text.length
    };
  }

  /**
   * 判断是否是单词
   */
  isWord(text) {
    return text.length < this.wordThreshold && !text.includes(' ');
  }

  /**
   * 检查是否是输入元素
   */
  isInputElement(element) {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    const inputTypes = ['input', 'textarea', 'select'];
    const editable = element.isContentEditable;
    
    return inputTypes.includes(tagName) || editable;
  }

  /**
   * 获取选区位置
   */
  getSelectionPosition(selection) {
    if (selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      bottom: rect.bottom + window.scrollY,
      right: rect.right + window.scrollX,
      width: rect.width,
      height: rect.height,
      viewportX: rect.left + rect.width / 2,
      viewportY: rect.bottom
    };
  }
}

export default TextProcessor;
```

- [ ] **Step 2: 创建content.js**

```javascript
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
```

- [ ] **Step 3: Commit**

```bash
git add content/
git commit -m "feat: add content script with text selection detection"
```

---

## Phase 6: 悬浮弹窗UI

### Task 7: 实现悬浮弹窗组件

**Files:**
- Create: `content/floating-popup.js`
- Create: `content/floating-popup.html`
- Create: `content/styles/floating-popup.css`

- [ ] **Step 1: 创建floating-popup.js**

```javascript
// content/floating-popup.js
import { ttsManager } from '../shared/tts.js';
import { LANGUAGES } from '../shared/constants.js';

export class FloatingPopup {
  constructor() {
    this.element = null;
    this.currentText = null;
    this.isTranslating = false;
    this.config = null;
    this.createElement();
  }

  createElement() {
    this.element = document.createElement('div');
    this.element.id = 'llm-translator-popup';
    this.element.className = 'llm-translator-popup';
    this.element.style.display = 'none';
    this.element.innerHTML = `
      <div class="popup-header">
        <span class="original-text"></span>
        <button class="speak-btn" title="朗读原文">🔊</button>
      </div>
      <div class="phonetic"></div>
      <div class="translation-content">
        <div class="loading">翻译中...</div>
        <div class="translation-result" style="display: none;">
          <div class="meaning"></div>
          <div class="example"></div>
        </div>
        <div class="error-message" style="display: none;"></div>
      </div>
      <button class="speak-translation-btn" title="朗读译文" style="display: none;">🔊 朗读译文</button>
      <button class="close-btn" title="关闭">&times;</button>
    `;

    // 绑定事件
    this.element.querySelector('.close-btn').addEventListener('click', () => this.hide());
    this.element.querySelector('.speak-btn').addEventListener('click', () => this.speakOriginal());
    this.element.querySelector('.speak-translation-btn').addEventListener('click', () => this.speakTranslation());

    document.body.appendChild(this.element);
  }

  async show(text, position) {
    this.currentText = text;
    this.isTranslating = true;

    // 显示原文
    this.element.querySelector('.original-text').textContent = text;
    this.element.querySelector('.phonetic').textContent = '';
    this.element.querySelector('.loading').style.display = 'block';
    this.element.querySelector('.translation-result').style.display = 'none';
    this.element.querySelector('.error-message').style.display = 'none';
    this.element.querySelector('.speak-translation-btn').style.display = 'none';

    // 定位
    this.positionAt(position);
    this.element.style.display = 'block';

    // 加载配置
    await this.loadConfig();

    // 请求翻译
    this.requestTranslation(text);
  }

  positionAt(position) {
    const popupWidth = 320;
    const popupHeight = 200;
    
    let left = position.viewportX - popupWidth / 2;
    let top = position.viewportY + 10;

    // 边界检查
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 10) left = 10;
    if (left + popupWidth > viewportWidth - 10) {
      left = viewportWidth - popupWidth - 10;
    }

    if (top + popupHeight > viewportHeight) {
      top = position.viewportY - popupHeight - 10;
    }

    this.element.style.left = `${left + window.scrollX}px`;
    this.element.style.top = `${top + window.scrollY}px`;
  }

  async loadConfig() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      if (response.success) {
        this.config = response.data;
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  async requestTranslation(text) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        isWord: true,
        targetLang: this.config?.targetLanguage || '中文'
      });

      this.element.querySelector('.loading').style.display = 'none';

      if (response.success) {
        this.displayResult(response.data);
      } else {
        this.displayError(response.error || '翻译失败');
      }
    } catch (error) {
      this.element.querySelector('.loading').style.display = 'none';
      this.displayError('翻译服务异常');
    }

    this.isTranslating = false;
  }

  displayResult(data) {
    const resultEl = this.element.querySelector('.translation-result');
    
    // 显示音标
    if (data.phonetic) {
      this.element.querySelector('.phonetic').textContent = data.phonetic;
    }

    // 显示释义
    if (data.meaning) {
      this.element.querySelector('.meaning').textContent = data.meaning;
    }

    // 显示例句
    const exampleEl = this.element.querySelector('.example');
    if (data.example) {
      exampleEl.textContent = data.example;
      exampleEl.style.display = 'block';
    } else {
      exampleEl.style.display = 'none';
    }

    resultEl.style.display = 'block';
    this.element.querySelector('.speak-translation-btn').style.display = 'inline-block';
    
    // 保存译文用于朗读
    this.translationText = data.meaning;
  }

  displayError(message) {
    const errorEl = this.element.querySelector('.error-message');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }

  async speakOriginal() {
    if (!this.currentText) return;
    
    try {
      await ttsManager.speak(this.currentText, {
        rate: this.config?.ttsRate || 1.0
      });
    } catch (error) {
      console.error('TTS error:', error);
    }
  }

  async speakTranslation() {
    if (!this.translationText) return;
    
    try {
      // 获取目标语言代码
      const langCode = this.getLangCode(this.config?.targetLanguage);
      await ttsManager.speak(this.translationText, {
        lang: langCode,
        rate: this.config?.ttsRate || 1.0
      });
    } catch (error) {
      console.error('TTS error:', error);
    }
  }

  getLangCode(langName) {
    const lang = LANGUAGES.find(l => l.name === langName);
    return lang ? lang.code : 'zh';
  }

  hide() {
    this.element.style.display = 'none';
    this.currentText = null;
    this.translationText = null;
  }

  contains(element) {
    return this.element && this.element.contains(element);
  }
}

export default FloatingPopup;
```

- [ ] **Step 2: 创建floating-popup.css**

```css
/* content/styles/floating-popup.css */

.llm-translator-popup {
  position: absolute;
  z-index: 2147483647;
  min-width: 280px;
  max-width: 400px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px 16px;
  animation: popupFadeIn 0.2s ease-out;
}

@keyframes popupFadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.original-text {
  font-weight: 600;
  font-size: 16px;
  color: #333;
  flex: 1;
}

.speak-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.speak-btn:hover {
  background: #f0f0f0;
}

.phonetic {
  font-family: 'Times New Roman', serif;
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.translation-content {
  margin: 8px 0;
}

.loading {
  color: #999;
  text-align: center;
  padding: 16px;
}

.meaning {
  color: #2c5282;
  font-size: 15px;
  margin-bottom: 8px;
}

.example {
  color: #666;
  font-size: 13px;
  font-style: italic;
  padding: 8px;
  background: #f7f7f7;
  border-radius: 4px;
  border-left: 3px solid #4CAF50;
}

.error-message {
  color: #e53e3e;
  text-align: center;
  padding: 16px;
}

.speak-translation-btn {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  margin-top: 8px;
}

.speak-translation-btn:hover {
  background: #45a049;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 20px;
  color: #999;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}
```

- [ ] **Step 3: Commit**

```bash
git add content/
git commit -m "feat: add floating popup component for word translation"
```

---

## Phase 7: 侧边栏UI

### Task 8: 实现侧边栏组件

**Files:**
- Create: `sidepanel/sidepanel.html`
- Create: `sidepanel/sidepanel.js`
- Create: `sidepanel/sidepanel.css`
- Create: `content/sidebar.js`

- [ ] **Step 1: 创建sidepanel.html**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="stylesheet" href="sidepanel.css">
</head>
<body>
  <div class="sidepanel-container">
    <div class="sidepanel-header">
      <h2>翻译结果</h2>
      <button id="closeBtn" class="icon-btn" title="关闭">&times;</button>
    </div>
    
    <div id="content" class="sidepanel-content">
      <div id="loading" class="loading" style="display: none;">
        <div class="spinner"></div>
        <p>正在翻译...</p>
      </div>
      
      <div id="result" style="display: none;">
        <div class="section">
          <div class="section-header">
            <span class="label">原文</span>
            <button id="speakOriginalBtn" class="icon-btn" title="朗读">🔊</button>
          </div>
          <div id="originalText" class="text-content"></div>
        </div>
        
        <div class="section">
          <div class="section-header">
            <span class="label">译文</span>
            <button id="speakTranslationBtn" class="icon-btn" title="朗读">🔊</button>
          </div>
          <div id="translationText" class="text-content translation"></div>
        </div>
        
        <div class="actions">
          <button id="copyBtn" class="btn btn-primary">复制译文</button>
          <button id="retryBtn" class="btn btn-secondary" style="display: none;">重新翻译</button>
        </div>
      </div>
      
      <div id="error" class="error" style="display: none;">
        <div class="error-icon">⚠️</div>
        <p id="errorMessage"></p>
        <button id="errorRetryBtn" class="btn btn-primary">重试</button>
      </div>
      
      <div id="empty" class="empty">
        <div class="empty-icon">📝</div>
        <p>在网页中划选文本即可翻译</p>
      </div>
    </div>
  </div>
  
  <script src="../shared/constants.js" type="module"></script>
  <script src="../shared/utils.js" type="module"></script>
  <script src="../shared/tts.js" type="module"></script>
  <script src="sidepanel.js" type="module"></script>
</body>
</html>
```

- [ ] **Step 2: 创建sidepanel.js**

```javascript
// sidepanel/sidepanel.js
import { ttsManager } from '../shared/tts.js';
import { LANGUAGES } from '../shared/constants.js';

class SidePanel {
  constructor() {
    this.currentText = null;
    this.translationText = null;
    this.config = null;
    this.init();
  }

  init() {
    this.loadConfig();
    this.bindEvents();
    this.checkForPendingTranslation();

    // 监听来自content script的消息
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true;
    });
  }

  bindEvents() {
    document.getElementById('closeBtn').addEventListener('click', () => this.close());
    document.getElementById('speakOriginalBtn').addEventListener('click', () => this.speakOriginal());
    document.getElementById('speakTranslationBtn').addEventListener('click', () => this.speakTranslation());
    document.getElementById('copyBtn').addEventListener('click', () => this.copyTranslation());
    document.getElementById('retryBtn').addEventListener('click', () => this.retry());
    document.getElementById('errorRetryBtn').addEventListener('click', () => this.retry());
  }

  async loadConfig() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      if (response.success) {
        this.config = response.data;
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  async checkForPendingTranslation() {
    try {
      const result = await chrome.storage.local.get('pendingTranslation');
      if (result.pendingTranslation) {
        this.translate(result.pendingTranslation);
        await chrome.storage.local.remove('pendingTranslation');
      }
    } catch (error) {
      console.error('Failed to check pending translation:', error);
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'translateInSidePanel':
        this.translate(request.text);
        sendResponse({ success: true });
        break;
      default:
        sendResponse({ success: false });
    }
  }

  translate(text) {
    this.currentText = text;
    this.translationText = null;

    // 显示加载状态
    this.showLoading();

    // 请求翻译
    this.requestTranslation(text);
  }

  async requestTranslation(text) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: text,
        isWord: false,
        targetLang: this.config?.targetLanguage || '中文'
      });

      if (response.success) {
        this.showResult(text, response.data.translation || response.data);
      } else {
        this.showError(response.error || '翻译失败');
      }
    } catch (error) {
      this.showError('翻译服务异常，请检查本地模型是否运行');
    }
  }

  showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('empty').style.display = 'none';
  }

  showResult(original, translation) {
    this.translationText = translation;

    document.getElementById('originalText').textContent = original;
    document.getElementById('translationText').textContent = translation;

    document.getElementById('loading').style.display = 'none';
    document.getElementById('result').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('empty').style.display = 'none';
  }

  showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('loading').style.display = 'none';
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'block';
    document.getElementById('empty').style.display = 'none';
  }

  async speakOriginal() {
    if (!this.currentText) return;
    
    try {
      await ttsManager.speak(this.currentText, {
        rate: this.config?.ttsRate || 1.0
      });
    } catch (error) {
      console.error('TTS error:', error);
    }
  }

  async speakTranslation() {
    if (!this.translationText) return;
    
    try {
      const langCode = this.getLangCode(this.config?.targetLanguage);
      await ttsManager.speak(this.translationText, {
        lang: langCode,
        rate: this.config?.ttsRate || 1.0
      });
    } catch (error) {
      console.error('TTS error:', error);
    }
  }

  getLangCode(langName) {
    const lang = LANGUAGES.find(l => l.name === langName);
    return lang ? lang.code : 'zh';
  }

  async copyTranslation() {
    if (!this.translationText) return;
    
    try {
      await navigator.clipboard.writeText(this.translationText);
      const btn = document.getElementById('copyBtn');
      const originalText = btn.textContent;
      btn.textContent = '已复制!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }

  retry() {
    if (this.currentText) {
      this.translate(this.currentText);
    }
  }

  close() {
    window.close();
  }
}

// 初始化
new SidePanel();
```

- [ ] **Step 3: 创建sidepanel.css**

```css
/* sidepanel/sidepanel.css */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
}

.sidepanel-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.sidepanel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.sidepanel-header h2 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.icon-btn:hover {
  background: #f0f0f0;
}

.sidepanel-content {
  flex: 1;
  padding: 16px;
}

.loading {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading p {
  color: #666;
}

.section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.text-content {
  font-size: 15px;
  line-height: 1.7;
  color: #333;
  word-wrap: break-word;
}

.text-content.translation {
  color: #2c5282;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-secondary {
  background: white;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.error {
  text-align: center;
  padding: 40px 20px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error p {
  color: #666;
  margin-bottom: 16px;
}

.empty {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty p {
  color: #999;
}
```

- [ ] **Step 4: 创建content/sidebar.js**

```javascript
// content/sidebar.js

export class SidebarManager {
  async open(text) {
    try {
      // 保存待翻译文本到storage
      await chrome.storage.local.set({ pendingTranslation: text });
      
      // 打开侧边栏
      await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
    } catch (error) {
      console.error('Failed to open side panel:', error);
      // Fallback: 尝试通过消息传递
      this.fallbackOpen(text);
    }
  }

  fallbackOpen(text) {
    // 如果Side Panel API不可用，尝试其他方式
    chrome.runtime.sendMessage({
      action: 'translateInSidePanel',
      text: text
    }).catch(error => {
      console.error('Fallback open failed:', error);
    });
  }

  async close() {
    try {
      // Side Panel API没有直接关闭方法，用户需要手动关闭
      // 但我们可以清除待翻译状态
      await chrome.storage.local.remove('pendingTranslation');
    } catch (error) {
      console.error('Failed to close side panel:', error);
    }
  }
}

export default SidebarManager;
```

- [ ] **Step 5: Commit**

```bash
git add sidepanel/ content/sidebar.js
git commit -m "feat: add side panel for sentence translation"
```

---

## Phase 8: 设置页面

### Task 9: 实现设置页面

**Files:**
- Create: `options/options.html`
- Create: `options/options.js`
- Create: `options/options.css`

- [ ] **Step 1: 创建options.html**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>本地LLM划词翻译 - 设置</title>
  <link rel="stylesheet" href="options.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>本地LLM划词翻译设置</h1>
      <p class="subtitle">配置您的本地大模型和翻译偏好</p>
    </header>

    <main>
      <!-- 引擎设置 -->
      <section class="card">
        <h2>模型引擎设置</h2>
        
        <div class="form-group">
          <label for="engineType">引擎类型</label>
          <select id="engineType">
            <option value="ollama">Ollama</option>
            <option value="vllm">vLLM</option>
            <option value="lmstudio">LMStudio</option>
            <option value="litellm">LiteLLM</option>
          </select>
          <p class="help-text">选择您本地运行的LLM引擎</p>
        </div>

        <div class="form-group">
          <label for="apiUrl">API地址</label>
          <input type="text" id="apiUrl" placeholder="http://localhost:11434">
          <p class="help-text">本地模型的API地址</p>
        </div>

        <div class="form-group">
          <label for="modelName">模型名称</label>
          <input type="text" id="modelName" placeholder="qwen2.5:7b">
          <p class="help-text">例如：qwen2.5:7b, llama3.1, gpt-4等</p>
        </div>

        <div class="form-group">
          <button id="testConnectionBtn" class="btn btn-secondary">测试连接</button>
          <span id="connectionStatus" class="status"></span>
        </div>
      </section>

      <!-- 语言设置 -->
      <section class="card">
        <h2>语言设置</h2>
        
        <div class="form-group">
          <label>源语言（可多选）</label>
          <div id="sourceLanguages" class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" value="英文" checked> 英文
            </label>
            <label class="checkbox-label">
              <input type="checkbox" value="日文"> 日文
            </label>
            <label class="checkbox-label">
              <input type="checkbox" value="韩文"> 韩文
            </label>
            <label class="checkbox-label">
              <input type="checkbox" value="法文"> 法文
            </label>
            <label class="checkbox-label">
              <input type="checkbox" value="德文"> 德文
            </label>
            <label class="checkbox-label">
              <input type="checkbox" value="西班牙文"> 西班牙文
            </label>
            <label class="checkbox-label">
              <input type="checkbox" value="俄文"> 俄文
            </label>
          </div>
        </div>

        <div class="form-group">
          <label for="targetLanguage">目标语言</label>
          <select id="targetLanguage">
            <option value="中文" selected>中文</option>
            <option value="英文">英文</option>
            <option value="日文">日文</option>
            <option value="韩文">韩文</option>
            <option value="法文">法文</option>
            <option value="德文">德文</option>
            <option value="西班牙文">西班牙文</option>
            <option value="俄文">俄文</option>
          </select>
        </div>
      </section>

      <!-- 语音设置 -->
      <section class="card">
        <h2>语音朗读设置</h2>
        
        <div class="form-group">
          <label for="ttsRate">语速</label>
          <input type="range" id="ttsRate" min="0.5" max="2" step="0.1" value="1">
          <span id="ttsRateValue">1.0x</span>
        </div>

        <div class="form-group">
          <button id="testTtsBtn" class="btn btn-secondary">测试朗读</button>
        </div>
      </section>

      <!-- 高级设置 -->
      <section class="card">
        <h2>高级设置</h2>
        
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="autoTranslate" checked>
            划词自动翻译
          </label>
          <p class="help-text">关闭后需要手动按快捷键才能翻译</p>
        </div>

        <div class="form-group">
          <label for="wordThreshold">单词长度阈值</label>
          <input type="number" id="wordThreshold" min="10" max="100" value="20">
          <p class="help-text">少于此字符数视为单词，否则视为句子</p>
        </div>

        <div class="form-group">
          <button id="clearCacheBtn" class="btn btn-secondary">清除翻译缓存</button>
          <span id="cacheStatus"></span>
        </div>
      </section>

      <!-- 保存按钮 -->
      <div class="actions">
        <button id="saveBtn" class="btn btn-primary btn-lg">保存设置</button>
        <button id="resetBtn" class="btn btn-secondary">恢复默认</button>
      </div>

      <div id="saveStatus" class="save-status"></div>
    </main>
  </div>

  <script src="options.js" type="module"></script>
</body>
</html>
```

- [ ] **Step 2: 创建options.js**

```javascript
// options/options.js
import { DEFAULT_CONFIG, ENGINE_DEFAULTS, LANGUAGES } from '../shared/constants.js';

class OptionsPage {
  constructor() {
    this.init();
  }

  async init() {
    await this.loadConfig();
    this.bindEvents();
    this.updateEngineDefaults();
  }

  bindEvents() {
    // 引擎类型变化时更新默认API地址
    document.getElementById('engineType').addEventListener('change', () => {
      this.updateEngineDefaults();
    });

    // 语速滑块
    document.getElementById('ttsRate').addEventListener('input', (e) => {
      document.getElementById('ttsRateValue').textContent = e.target.value + 'x';
    });

    // 测试连接
    document.getElementById('testConnectionBtn').addEventListener('click', () => {
      this.testConnection();
    });

    // 测试TTS
    document.getElementById('testTtsBtn').addEventListener('click', () => {
      this.testTTS();
    });

    // 清除缓存
    document.getElementById('clearCacheBtn').addEventListener('click', () => {
      this.clearCache();
    });

    // 保存
    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveConfig();
    });

    // 重置
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetConfig();
    });
  }

  updateEngineDefaults() {
    const engineType = document.getElementById('engineType').value;
    const defaults = ENGINE_DEFAULTS[engineType];
    const apiUrlInput = document.getElementById('apiUrl');
    
    // 只有用户未修改过时才自动填充
    if (!apiUrlInput.dataset.userModified) {
      apiUrlInput.value = defaults.apiUrl;
    }

    // 建议模型名称
    const modelSuggestions = {
      ollama: 'qwen2.5:7b',
      vllm: 'meta-llama/Llama-2-7b-chat-hf',
      lmstudio: 'local-model',
      litellm: 'gpt-3.5-turbo'
    };
    
    const modelInput = document.getElementById('modelName');
    if (!modelInput.value) {
      modelInput.placeholder = modelSuggestions[engineType];
    }
  }

  async loadConfig() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getConfig' });
      if (response.success) {
        this.populateForm(response.data);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      this.populateForm(DEFAULT_CONFIG);
    }
  }

  populateForm(config) {
    document.getElementById('engineType').value = config.engineType;
    document.getElementById('apiUrl').value = config.apiUrl;
    document.getElementById('apiUrl').dataset.userModified = 'true';
    document.getElementById('modelName').value = config.modelName;
    document.getElementById('targetLanguage').value = config.targetLanguage;
    document.getElementById('ttsRate').value = config.ttsRate;
    document.getElementById('ttsRateValue').textContent = config.ttsRate + 'x';
    document.getElementById('autoTranslate').checked = config.autoTranslate;
    document.getElementById('wordThreshold').value = config.wordThreshold;

    // 设置源语言
    const sourceLangs = config.sourceLanguages || ['英文'];
    document.querySelectorAll('#sourceLanguages input').forEach(checkbox => {
      checkbox.checked = sourceLangs.includes(checkbox.value);
    });
  }

  collectFormData() {
    const sourceLanguages = [];
    document.querySelectorAll('#sourceLanguages input:checked').forEach(checkbox => {
      sourceLanguages.push(checkbox.value);
    });

    return {
      engineType: document.getElementById('engineType').value,
      apiUrl: document.getElementById('apiUrl').value.trim(),
      modelName: document.getElementById('modelName').value.trim(),
      sourceLanguages: sourceLanguages.length > 0 ? sourceLanguages : ['英文'],
      targetLanguage: document.getElementById('targetLanguage').value,
      ttsRate: parseFloat(document.getElementById('ttsRate').value),
      autoTranslate: document.getElementById('autoTranslate').checked,
      wordThreshold: parseInt(document.getElementById('wordThreshold').value),
      hotkey: DEFAULT_CONFIG.hotkey
    };
  }

  async saveConfig() {
    const config = this.collectFormData();
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'setConfig',
        config: config
      });

      const statusEl = document.getElementById('saveStatus');
      if (response.success) {
        statusEl.textContent = '设置已保存!';
        statusEl.className = 'save-status success';
      } else {
        statusEl.textContent = '保存失败，请重试';
        statusEl.className = 'save-status error';
      }
      
      setTimeout(() => {
        statusEl.textContent = '';
        statusEl.className = 'save-status';
      }, 3000);
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  async testConnection() {
    const statusEl = document.getElementById('connectionStatus');
    statusEl.textContent = '测试连接中...';
    statusEl.className = 'status testing';

    try {
      const response = await chrome.runtime.sendMessage({ action: 'testConnection' });
      
      if (response.success && response.connected) {
        statusEl.textContent = '连接成功!';
        statusEl.className = 'status success';
      } else {
        statusEl.textContent = '连接失败，请检查模型是否运行';
        statusEl.className = 'status error';
      }
    } catch (error) {
      statusEl.textContent = '测试失败：' + error.message;
      statusEl.className = 'status error';
    }
  }

  testTTS() {
    const text = 'Hello, this is a test.';
    const rate = parseFloat(document.getElementById('ttsRate').value);
    
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      speechSynthesis.speak(utterance);
    } catch (error) {
      alert('您的浏览器不支持语音朗读功能');
    }
  }

  async clearCache() {
    try {
      const all = await chrome.storage.local.get(null);
      const cacheKeys = Object.keys(all).filter(k => k.startsWith('cache:'));
      await chrome.storage.local.remove(cacheKeys);
      
      const statusEl = document.getElementById('cacheStatus');
      statusEl.textContent = `已清除 ${cacheKeys.length} 条缓存`;
      setTimeout(() => {
        statusEl.textContent = '';
      }, 3000);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  resetConfig() {
    if (confirm('确定要恢复默认设置吗？')) {
      this.populateForm(DEFAULT_CONFIG);
    }
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  new OptionsPage();
});
```

- [ ] **Step 3: 创建options.css**

```css
/* options/options.css */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
  padding: 20px;
}

.container {
  max-width: 600px;
  margin: 0 auto;
}

header {
  text-align: center;
  margin-bottom: 32px;
}

header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  color: #666;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card h2 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: #444;
}

input[type="text"],
input[type="number"],
select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

input[type="text"]:focus,
input[type="number"]:focus,
select:focus {
  outline: none;
  border-color: #4CAF50;
}

.help-text {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}

.checkbox-group {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

input[type="range"] {
  width: 200px;
  vertical-align: middle;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-secondary {
  background: white;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #f5f5f5;
}

.btn-lg {
  padding: 12px 32px;
  font-size: 16px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 32px;
}

.status {
  margin-left: 12px;
  font-size: 13px;
}

.status.success {
  color: #4CAF50;
}

.status.error {
  color: #e53e3e;
}

.status.testing {
  color: #666;
}

.save-status {
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  border-radius: 6px;
  font-weight: 500;
}

.save-status.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.save-status.error {
  background: #ffebee;
  color: #c62828;
}
```

- [ ] **Step 4: Commit**

```bash
git add options/
git commit -m "feat: add options page with full configuration UI"
```

---

## Phase 9: 图标和打包

### Task 10: 创建扩展图标

**Files:**
- Create: `icons/icon16.png`
- Create: `icons/icon48.png`
- Create: `icons/icon128.png`

- [ ] **Step 1: 创建SVG图标并转换为PNG**

由于环境限制，我们先创建SVG文件作为图标源：

```bash
# 创建SVG图标
cat > icons/icon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="16" fill="#4CAF50"/>
  <text x="64" y="88" font-family="Arial, sans-serif" font-size="72" font-weight="bold" text-anchor="middle" fill="white">译</text>
</svg>
EOF

# 创建简单的占位图标说明
echo "图标文件需要通过外部工具从icons/icon.svg转换生成：
- icon16.png: 16x16像素
- icon48.png: 48x48像素  
- icon128.png: 128x128像素

可以使用在线工具如：
- https://convertio.co/zh/svg-png/
- ImageMagick: convert -background none icon.svg -resize 128x128 icon128.png
" > icons/README.md
```

- [ ] **Step 2: 创建简单的base64图标作为临时方案**

在manifest.json中，我们可以使用base64编码的小图标作为临时方案，或者直接使用外部图标资源。

更实际的做法是创建简单的1x1像素透明PNG作为占位符，用户可以在加载后替换：

```javascript
// 创建一个1x1透明像素的PNG（base64）
const transparentPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
```

- [ ] **Step 3: Commit**

```bash
git add icons/
git commit -m "docs: add icon assets and README"
```

---

## Phase 10: 最终整合和测试

### Task 11: 最终整合和清单检查

**Files:**
- Modify: `manifest.json` (如有必要)
- Create: `README.md` (项目说明)

- [ ] **Step 1: 更新manifest.json添加web_accessible_resources（如需要）**

检查manifest.json确保所有权限和配置正确。

- [ ] **Step 2: 创建项目README**

```markdown
# 本地LLM划词翻译 - Edge浏览器扩展

使用本地大模型（Ollama、vLLM、LMStudio、LiteLLM）进行划词翻译的Edge浏览器扩展。

## 功能特性

- **智能划词翻译**：单词显示悬浮弹窗，句子打开侧边栏
- **音标显示**：单词翻译自动提取并显示音标
- **语音朗读**：支持原文和译文的TTS朗读
- **多引擎支持**：Ollama、vLLM、LMStudio、LiteLLM
- **多语言支持**：支持8种语言互译
- **本地运行**：所有翻译在本地完成，保护隐私

## 安装说明

1. 下载扩展文件并解压
2. 打开Edge浏览器，进入 `edge://extensions/`
3. 开启"开发人员模式"
4. 点击"加载解压缩的扩展"
5. 选择扩展文件夹

## 配置说明

1. 点击扩展图标，选择"扩展选项"
2. 配置您的本地模型：
   - **Ollama**: http://localhost:11434
   - **vLLM**: http://localhost:8000
   - **LMStudio**: http://localhost:1234
3. 选择模型名称（如 qwen2.5:7b）
4. 配置源语言和目标语言
5. 点击"保存设置"

## 使用方法

- **自动翻译**：划选文字即可自动翻译
- **快捷键翻译**：按 Alt+T 翻译选中的文字
- **单词翻译**：显示音标和释义，带例句
- **句子翻译**：在侧边栏显示完整翻译

## 快捷键

- `Alt+T` - 翻译选中的文本
- `ESC` - 关闭弹窗/侧边栏

## 系统要求

- Edge Chromium 浏览器
- 本地运行的LLM服务（Ollama/vLLM/LMStudio/LiteLLM）
- Windows 10/11, macOS, 或 Linux

## 隐私说明

- 所有翻译在本地完成，不发送数据到云端
- 仅与配置的本地模型服务通信（localhost）
- 不收集任何用户数据

## License

MIT License
```

- [ ] **Step 3: 最终Commit**

```bash
git add README.md
git commit -m "docs: add project README"
```

---

## 测试清单

### 功能测试
- [ ] 安装扩展后图标正常显示
- [ ] 划选单词显示悬浮弹窗
- [ ] 划选句子打开侧边栏
- [ ] 音标正确显示
- [ ] 朗读按钮正常工作
- [ ] 设置页面可正常保存配置
- [ ] 快捷键 Alt+T 触发翻译

### 兼容性测试
- [ ] Edge浏览器功能正常
- [ ] Chrome浏览器兼容
- [ ] 不同网站划词测试
- [ ] 输入框内划词不触发

### 错误处理测试
- [ ] 本地模型未运行时显示错误
- [ ] 网络超时处理
- [ ] 缓存功能正常

---

## 打包发布

```bash
# 打包扩展为zip
zip -r edge-local-llm-translator.zip \
  manifest.json \
  background/ \
  content/ \
  sidepanel/ \
  options/ \
  shared/ \
  icons/ \
  README.md
```

用户可以在Edge扩展商店开发者控制台上传此zip文件进行发布。
