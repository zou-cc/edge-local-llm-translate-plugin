// content/text-processor.js

class TextProcessor {
  constructor(config = {}) {
    this.wordThreshold = config.wordThreshold || 20;
  }

  analyzeSelection(selection) {
    const text = selection.toString().trim();
    
    if (!text || text.length < 2) {
      return null;
    }

    const activeElement = document.activeElement;
    if (this.isInputElement(activeElement)) {
      return null;
    }

    const isWord = this.isWord(text);
    const position = this.getSelectionPosition(selection);

    return { text, isWord, position, length: text.length };
  }

  isWord(text) {
    return text.length < this.wordThreshold && !text.includes(' ');
  }

  isInputElement(element) {
    if (!element) return false;
    const tagName = element.tagName.toLowerCase();
    return ['input', 'textarea', 'select'].includes(tagName) || element.isContentEditable;
  }

  getSelectionPosition(selection) {
    if (selection.rangeCount === 0) return null;
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    return {
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY,
      viewportX: rect.left + rect.width / 2,
      viewportY: rect.bottom
    };
  }
}
