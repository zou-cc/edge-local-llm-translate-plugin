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
