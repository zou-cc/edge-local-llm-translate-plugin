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
  modelName: 'qwen3.5:9b',
  sourceLanguages: ['英文'],
  targetLanguage: '中文',
  ttsVoice: 'auto',
  ttsRate: 1.0,
  autoTranslate: true,
  wordThreshold: 50,
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
  word: (word, targetLang) => `请直接翻译以下单词，不要思考过程，只输出结果。

单词：${word}

请按以下格式回复（不要有多余内容）：
音标：/音标符号/
释义：${targetLang}意思
例句：一句英文例句（${targetLang}翻译）`,

  sentence: (text, targetLang) => `请将以下文本直接翻译成${targetLang}，不要思考过程，只输出翻译结果。

原文：${text}

翻译：`
};
