# 本地LLM划词翻译 (Local LLM Text Translator)

![Extension Icon](icons/icon48.png)

一个基于本地大语言模型的Edge浏览器划词翻译扩展，支持单词音标显示和语音朗读。

A browser extension for Edge that provides text translation using local LLM models, with phonetic transcription and text-to-speech support.

## Features

- **Text Selection Translation**: Translate selected text by simply highlighting it
- **Smart Display Mode**:
  - **Word Mode** (< 20 characters): Floating popup with phonetic transcription
  - **Sentence Mode** (≥ 20 characters): Side panel for detailed translation
- **Multiple LLM Engine Support**: Ollama, vLLM, LMStudio, LiteLLM
- **Text-to-Speech**: Read aloud both original text and translation
- **Phonetic Display**: IPA phonetic transcription for words
- **Translation Caching**: LRU cache to speed up repeated translations
- **Customizable**: Configure source/target languages, hotkeys, and engine settings

## Installation

### From Source (Developer Mode)

1. **Download the Extension**:
   ```bash
   git clone https://github.com/yourusername/edge-local-llm-translate-plugin.git
   cd edge-local-llm-translate-plugin
   ```

2. **Prepare Icons** (if PNG files don't exist):
   ```bash
   cd icons
   # Follow instructions in icons/README.md to generate PNG files
   # Using ImageMagick:
   convert -background none icon.svg -resize 16x16 icon16.png
   convert -background none icon.svg -resize 48x48 icon48.png
   convert -background none icon.svg -resize 128x128 icon128.png
   cd ..
   ```

3. **Load in Edge/Chrome**:
   - Open Edge and navigate to `edge://extensions/`
   - Enable "Developer mode" (toggle in bottom-left)
   - Click "Load unpacked"
   - Select the extension folder
   - The extension icon should appear in your toolbar

4. **Verify Installation**:
   - Look for the green "译" icon in the toolbar
   - Click the icon to open the side panel
   - Open settings to configure your LLM engine

### Prerequisites

- **Microsoft Edge** (Chromium-based) or Google Chrome
- **Local LLM Server** running on localhost:
  - [Ollama](https://ollama.com/) (recommended for beginners)
  - [vLLM](https://github.com/vllm-project/vllm) (for high-performance inference)
  - [LMStudio](https://lmstudio.ai/) (GUI-based management)
  - [LiteLLM](https://github.com/BerriAI/litellm) (unified gateway)

## Configuration

### Quick Setup

1. Click the extension icon → "Options" (or right-click → "扩展选项")
2. Select your LLM engine type
3. Enter the API URL (defaults provided for each engine)
4. Specify your model name (e.g., `qwen2.5:7b` for Ollama)
5. Click "Test Connection" to verify
6. Save settings

### Default Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Engine Type | Ollama | Local LLM backend |
| API URL | http://localhost:11434 | Server endpoint |
| Model | qwen2.5:7b | Translation model |
| Source Language | English | Languages to translate from |
| Target Language | Chinese | Language to translate to |
| TTS Rate | 1.0x | Speech speed |
| Auto Translate | Enabled | Auto-translate on selection |
| Word Threshold | 20 chars | Word vs sentence cutoff |
| Hotkey | Ctrl+Shift+T | Manual translation trigger |

### Supported Engines

#### Ollama (Recommended)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a translation-capable model
ollama pull qwen2.5:7b

# Start Ollama server
ollama serve
```

Default API URL: `http://localhost:11434`

#### vLLM

```bash
# Install vLLM
pip install vllm

# Start server with a model
python -m vllm.entrypoints.openai.api_server \
  --model meta-llama/Llama-2-7b-chat-hf \
  --port 8000
```

Default API URL: `http://localhost:8000`

#### LMStudio

1. Download and install [LMStudio](https://lmstudio.ai/)
2. Load a model through the GUI
3. Start the local server (Settings → Local Inference Server)
4. Note the port (default: 1234)

Default API URL: `http://localhost:1234`

#### LiteLLM

```bash
# Install LiteLLM
pip install litellm

# Start proxy server
litellm --model ollama/qwen2.5:7b --port 8000
```

## Usage

### Basic Translation

1. **Select Text**: Highlight any text on a webpage (word or sentence)
2. **Press `Ctrl+Shift+T`**: Trigger translation
3. **View Translation**:
   - **Word**: Floating popup appears near cursor
   - **Sentence**: Side panel opens on the right
4. **Listen**: Click the speaker icon to hear pronunciation
5. **Close**: Press ESC to close popup/sidebar

### Manual Translation

1. Select text
2. Press `Ctrl+Shift+T` (default hotkey)
3. Translation appears based on text length

### Side Panel Mode

- Click the extension icon in the toolbar
- Side panel opens with translation history
- Click the "译" button to translate clipboard content

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+T` | Translate selected text |
| `ESC` | Close popup/sidebar |
| `Ctrl+C` (in side panel) | Copy translated text |

## System Requirements

### Browser Requirements

- **Microsoft Edge** 88+ (Chromium-based)
- **Google Chrome** 88+
- Manifest V3 support required

### Hardware Requirements

**Minimum**:
- 4GB RAM
- Modern CPU (x86_64 or ARM64)

**Recommended**:
- 8GB+ RAM (for running LLM locally)
- SSD storage for models
- Stable local network

### Software Requirements

**Required**:
- Local LLM server running on localhost
- OpenAI-compatible API endpoint

**Optional** (for TTS):
- System text-to-speech voices
- Browser with Web Speech API support

### Model Recommendations

For translation tasks, we recommend:

| Model | Size | Quality | Speed |
|-------|------|---------|-------|
| Qwen2.5 | 7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Llama 2 | 7B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| CodeLlama | 7B | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Mistral | 7B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

*Larger models (13B, 70B) provide better quality but require more RAM*

## Project Structure

```
edge-local-llm-translate-plugin/
├── manifest.json              # Extension manifest (Manifest V3)
├── background/                # Background service worker
│   ├── background.js          # Main background script
│   ├── llm-client.js          # LLM API client
│   └── config-manager.js      # Configuration management
├── content/                   # Content scripts
│   ├── content.js             # Text selection handler
│   ├── floating-popup.js      # Word popup UI
│   ├── sidebar.js             # Sidebar injection
│   ├── text-processor.js      # Text analysis
│   └── styles/                # Content styles
│       └── floating-popup.css
├── options/                   # Settings page
│   ├── options.html
│   ├── options.js
│   └── options.css
├── sidepanel/                 # Side panel UI
│   ├── sidepanel.html
│   ├── sidepanel.js
│   └── sidepanel.css
├── shared/                    # Shared utilities
│   ├── constants.js           # Constants and defaults
│   ├── utils.js               # Utility functions
│   └── tts.js                 # TTS module
├── icons/                     # Extension icons
│   ├── icon.svg               # Source SVG
│   ├── icon16.png             # 16x16 icon
│   ├── icon48.png             # 48x48 icon
│   ├── icon128.png            # 128x128 icon
│   └── README.md              # Icon generation guide
├── docs/                      # Documentation
│   └── superpowers/
│       ├── specs/             # Design specifications
│       └── plans/             # Implementation plans
└── README.md                  # This file
```

## Development

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/yourusername/edge-local-llm-translate-plugin.git
cd edge-local-llm-translate-plugin

# Install dependencies (if any)
npm install
```

### Build Icons

See [icons/README.md](icons/README.md) for detailed instructions on generating PNG icons from the SVG source.

### Testing

1. Load the extension in developer mode (see Installation)
2. Open browser DevTools (F12)
3. Check the Console for background script logs
4. Use the popup/sidebar to test functionality

### Debug Mode

Enable debug logging in browser console:

```javascript
// In background script console
chrome.storage.local.set({ debug: true });
```

## Privacy & Security

### Data Handling

- **Local Only**: All translations happen locally via your LLM server
- **No Data Collection**: No text or usage data is sent to external servers
- **Cache**: Translation cache is stored locally in browser storage
- **No Tracking**: No analytics, telemetry, or tracking

### Permissions

The extension requires these permissions:

| Permission | Purpose |
|------------|---------|
| `storage` | Save user settings and cache |
| `sidePanel` | Open side panel for sentence translation |
| `activeTab` | Interact with current webpage |
| `scripting` | Inject content scripts for translation UI |
| `host` (localhost) | Connect to local LLM server |

### Security Notes

- Extension only communicates with `localhost` addresses
- No external network requests
- Content Security Policy (CSP) compliant
- Regular security updates recommended

## Troubleshooting

### Common Issues

**Extension Not Working**
- Verify LLM server is running: `curl http://localhost:11434`
- Check extension is enabled in `edge://extensions/`
- Try reloading the extension

**Translation Fails**
- Test connection in Options page
- Verify model name is correct
- Check LLM server logs for errors

**No Sound in TTS**
- Ensure system has TTS voices installed
- Check browser volume settings
- Try different voice in Options

**Slow Performance**
- Use a smaller/faster model
- Enable translation cache
- Check system resources (RAM/CPU)

### Debug Information

Open browser console (F12) and check:

```javascript
// View current config
chrome.storage.sync.get('config', console.log)

// View cache
chrome.storage.local.get(null, data => {
  console.log(Object.keys(data).filter(k => k.startsWith('cache:')))
})

// Clear cache
chrome.storage.local.clear()
```

## Contributing

We welcome contributions! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- Use ES6+ JavaScript
- Follow existing code patterns
- Add comments in Chinese for consistency
- Run tests before submitting

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Ollama](https://ollama.com/) - Local LLM runtime
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/) - Browser extension framework
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) - Text-to-speech functionality

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/edge-local-llm-translate-plugin/issues)
- **Documentation**: [Design Spec](docs/superpowers/specs/2025-03-29-edge-translator-design.md)
- **Changelog**: See [CHANGELOG.md](CHANGELOG.md)

---

Made with ❤️ for the local-first AI community
