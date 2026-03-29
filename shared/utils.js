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
  // 匹配 /.../ 格式的IPA音标
  const match = response.match(/\/[\u0250-\u02AF\u02B0-\u02FFˈˌa-zA-Z]+\//);
  return match ? match[0] : null;
}

/**
 * 解析单词翻译响应 - 支持多种格式
 */
export function parseWordTranslation(response) {
  console.log('Raw response for parsing:', JSON.stringify(response).substring(0, 200));
  
  if (!response || response.trim() === '') {
    console.log('Empty response');
    return { phonetic: null, meaning: '无翻译结果', example: null, raw: response };
  }
  
  const phonetic = extractPhonetic(response);
  let meaning = '';
  let example = null;
  
  // 1. 尝试标准格式：释义：xxx
  const meaningMatch1 = response.match(/释义[：:]\s*(.+?)(?=\n|例句|$)/);
  if (meaningMatch1) {
    meaning = meaningMatch1[1].trim();
  }
  
  // 2. 英文格式：definition: xxx
  if (!meaning) {
    const meaningMatch2 = response.match(/definition[s]?[：:]\s*(.+?)(?=\n|example|$)/i);
    if (meaningMatch2) {
      meaning = meaningMatch2[1].trim();
    }
  }
  
  // 3. 翻译：xxx
  if (!meaning) {
    const meaningMatch3 = response.match(/翻译[：:]\s*(.+?)(?=\n|$)/);
    if (meaningMatch3) {
      meaning = meaningMatch3[1].trim();
    }
  }
  
  // 4. 如果没有找到标记，取第一个非空且非thinking的行
  if (!meaning) {
    const lines = response.split('\n').map(l => l.trim()).filter(l => l);
    for (const line of lines) {
      // 跳过thinking相关内容
      if (line.includes('Thinking') || line.includes('思考') || line.includes('Process')) {
        continue;
      }
      // 跳过纯标点
      if (/^[\/\s]*$/.test(line)) {
        continue;
      }
      // 跳过json标记
      if (line === '{' || line === '}' || line.startsWith('"')) {
        continue;
      }
      // 找到第一个有意义的内容（不限长度）
      if (line.length > 0) {
        meaning = line;
        break;
      }
    }
  }
  
  // 5. 如果还是没有，使用整个响应（去除空行和thinking部分）
  if (!meaning) {
    // 移除thinking部分
    const withoutThinking = response.replace(/Thinking Process:[\s\S]*?(?=\n\n|$)/i, '');
    const lines = withoutThinking.split('\n').map(l => l.trim()).filter(l => l && l.length > 0);
    if (lines.length > 0) {
      meaning = lines[0];
    } else {
      meaning = response.trim().substring(0, 100);
    }
  }
  
  // 提取例句
  const exampleMatch = response.match(/例句[：:]\s*(.+?)(?=\n|$)/);
  if (exampleMatch) {
    example = exampleMatch[1].trim();
  }
  
  // 如果没有例句，尝试英文格式
  if (!example) {
    const exampleMatch2 = response.match(/example[s]?[：:]\s*(.+?)(?=\n|$)/i);
    if (exampleMatch2) {
      example = exampleMatch2[1].trim();
    }
  }
  
  const result = { 
    phonetic, 
    meaning: meaning || '无翻译结果', 
    example, 
    raw: response 
  };
  
  console.log('Parsed result:', result);
  return result;
}

/**
 * 解析句子翻译响应
 */
export function parseSentenceTranslation(response) {
  console.log('Parsing sentence translation:', response.substring(0, 100));
  
  if (!response || response.trim() === '') {
    return '无翻译结果';
  }
  
  // 1. 尝试提取"翻译："之后的内容
  const translationMatch = response.match(/翻译[：:]\s*([\s\S]+)/);
  if (translationMatch) {
    return translationMatch[1].trim();
  }
  
  // 2. 尝试英文格式 translation:
  const translationMatch2 = response.match(/translation[：:]\s*([\s\S]+)/i);
  if (translationMatch2) {
    return translationMatch2[1].trim();
  }
  
  // 3. 移除thinking部分，取第一行
  const withoutThinking = response.replace(/Thinking Process:[\s\S]*?(?=\n\n|$)/i, '');
  const lines = withoutThinking.split('\n').map(l => l.trim()).filter(l => l);
  
  for (const line of lines) {
    if (line.length > 0 && !line.includes('Thinking') && !line.includes('思考')) {
      return line;
    }
  }
  
  // 4. 返回整个响应
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
