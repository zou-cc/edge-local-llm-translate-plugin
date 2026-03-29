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
