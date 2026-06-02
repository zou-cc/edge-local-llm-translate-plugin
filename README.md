# 本地LLM划词翻译 (Local LLM Text Translator)

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![Edge](https://img.shields.io/badge/Edge-Manifest%20V3-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

一个基于本地大语言模型的 Edge 浏览器划词翻译扩展，支持 5 种 LLM 引擎、单词音标显示、英文语音朗读、自动翻译和弹窗交互。

A browser extension for Edge that provides text translation using local LLM models, supporting 5 LLM engines, phonetic transcription, English TTS, auto-translate, and popup interaction.

## ✨ 核心特性

- **5 种 LLM 引擎支持**：Ollama、vLLM、LMStudio、LiteLLM、Shimmy
- **智能显示模式**：
  - **单词模式**（< 阈值字符）：悬浮窗显示音标 / 释义 / 例句
  - **长文本模式**（≥ 阈值字符）：侧边栏打开完整翻译
- **自动翻译**：选中文字后自动触发，无需手动按键
- **英文语音朗读**：点击 🔊 按钮朗读英文例句或单词
- **API 密钥支持**：LiteLLM / OpenAI 等需要鉴权的引擎
- **Qwen3 thinking 模式兼容**：自动解析 `reasoning` / `thinking` 字段
- **键盘快捷键**：`Alt+T` 手动触发，`ESC` 关闭弹窗
- **弹窗交互**：✕ 关闭、点击外部自动隐藏、按钮视觉反馈

## 📦 安装

### 1. 克隆并加载

```bash
git clone https://github.com/zou-cc/edge-local-llm-translate-plugin.git
cd edge-local-llm-translate-plugin
```

### 2. 加载到 Edge

1. 打开 `edge://extensions/`
2. 开启右下角 **"开发人员模式"**
3. 点击 **"加载解压缩的扩展"** → 选择项目根目录
4. 工具栏出现扩展图标

### 3. 准备本地 LLM 服务

确保至少启动一个 LLM 服务（参见下方引擎配置章节）。

## 🚀 快速开始

1. 选中网页中的英文单词或句子
2. 等待 1-2 秒 → 浮窗或侧边栏自动显示翻译
3. 单词：点击 🔊 朗读英文
4. 长文本：在侧边栏查看完整翻译

## ⚙️ 配置

### 打开设置页

- 方式 A：扩展图标右键 → **选项**
- 方式 B：扩展管理页 → 详细信息 → **扩展选项**
- 方式 C：popup 页面 → 快速设置

### 推荐配置（LiteLLM + Qwen3.6-35B-A3B）

| 字段 | 值 |
|---|---|
| 引擎类型 | LiteLLM |
| API 地址 | `http://localhost:4000` |
| API 密钥 | `sk-litllm-admin` |
| 模型名称 | `qwen3.6-35b-a3b` |

> LiteLLM 后端是 llama.cpp，qwen3.6-35b-a3b 在 RTX 2080 Ti 上推理 < 1 秒。

### 支持的引擎

| 引擎 | 默认端口 | API 路径 | 鉴权 |
|---|---|---|---|
| **Ollama** | 11434 | `/api/generate` | 否 |
| **vLLM** | 8000 | `/v1/chat/completions` | 否 |
| **LMStudio** | 1234 | `/v1/chat/completions` | 否 |
| **LiteLLM** | 4000 | `/v1/chat/completions` | **是** |
| **Shimmy** | 11435 | `/v1/chat/completions` | 否 |

### 各引擎启动示例

**Ollama：**
```bash
ollama serve
ollama pull qwen3.5:9b
```

**vLLM：**
```bash
python -m vllm.entrypoints.openai.api_server \
  --model Qwen/Qwen3-2B \
  --port 8000
```

**LMStudio：**
- 启动 LMStudio → 加载模型 → Developer → Start Server

**LiteLLM：**
```bash
litellm --config /path/to/litellm-config.yaml --port 4000
```

**Shimmy：**
```bash
./shimmy-linux-x86_64 --bind 0.0.0.0:11435
```

## 🐧 Linux TTS 配置

Edge 在 Linux 上依赖 `speech-dispatcher` 和 `espeak-ng` 提供 TTS：

```bash
sudo apt install espeak-ng speech-dispatcher
systemctl --user enable --now speech-dispatcher.socket speech-dispatcher.service
```

验证：
```bash
espeak-ng "hello world"  # 应能听到声音
```

如果不启动服务，弹窗中点击 🔊 会显示 "无可用语音" 错误。

## ⌨️ 快捷键

| 快捷键 | 动作 |
|---|---|
| `Alt+T` | 翻译选中文本 |
| `Ctrl+Shift+T/F` | 同上（兼容旧版本） |
| `ESC` | 关闭浮窗/侧边栏 |

## 📐 单词/句子阈值

在设置页调整"单词长度阈值"：
- 默认 50 字符
- 低于阈值：浮窗（音标+释义+例句）
- 高于阈值：侧边栏（完整翻译）

## 📂 项目结构

```
edge-local-llm-translate-plugin/
├── manifest.json              # Manifest V3 配置
├── background/                # Service Worker
│   ├── background.js          # 消息路由
│   ├── llm-client.js          # LLM API 客户端
│   └── config-manager.js      # 配置管理
├── content/                   # 内容脚本
│   ├── content.js             # 划词监听 + 自动翻译
│   ├── floating-popup.js      # 浮窗（单词）
│   ├── sidebar.js             # 侧边栏（句子）
│   ├── text-processor.js      # 文本分析
│   └── styles/floating-popup.css
├── options/                   # 设置页
│   ├── options.html
│   ├── options.js
│   └── options.css
├── popup/                     # Popup 快速设置
│   └── popup.js
├── popup.html                 # Popup 页面
├── sidepanel/                 # 侧边栏 UI
├── shared/                    # 共享模块
│   ├── constants.js
│   └── ...
├── icons/                     # 图标
└── README.md
```

## 🛠️ 故障排查

### 测试连接失败
1. 确认 LLM 服务在运行（`curl http://localhost:PORT/v1/models`）
2. LiteLLM/OpenAI 必须填 API 密钥
3. **必须先点击"保存设置"再测试连接**（测试用已保存的配置）

### 划词不翻译
1. 刷新网页（content script 需要重新注入）
2. 打开 F12 控制台，看是否有 JS 错误
3. 确认 `autoTranslate` 设置已启用

### 朗读无声音
1. Linux：启动 `speech-dispatcher`
2. 浏览器控制台执行 `speechSynthesis.getVoices()` 看是否有声音列表
3. 检查系统音量

### 弹窗按钮重叠
刷新扩展（`edge://extensions/` → 重新加载）

## 📝 更新日志

### v1.1.0 (2026-06-02)
- ✨ 新增 Shimmy 引擎支持
- ✨ 新增 LiteLLM API 密钥认证
- ✨ 新增自动翻译（选中即翻）
- ✨ 新增浮窗关闭按钮和点击外部关闭
- 🐛 修复 CSP 阻止 popup 内联脚本
- 🐛 修复快捷键不一致（manifest vs content.js）
- 🐛 修复 Qwen3 thinking 模式响应解析
- 🐛 修复 Linux 浮窗按钮重叠
- 🎨 TTS 改为只读英文，添加错误处理

### v1.0.0
- 初始版本，Ollama / vLLM / LMStudio 支持

## 📄 许可证

MIT License

## 🙏 致谢

- [Ollama](https://ollama.com/)
- [vLLM](https://github.com/vllm-project/vllm)
- [LMStudio](https://lmstudio.ai/)
- [LiteLLM](https://github.com/BerriAI/litellm)
- [Shimmy](https://github.com/shimmy-ai/shimmy)
