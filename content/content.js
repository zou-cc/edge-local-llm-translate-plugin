// content/content.js

const textProcessor = new TextProcessor();
const floatingPopup = new FloatingPopup();
const sidebarManager = new SidebarManager();

let autoTranslate = true;
let targetLanguage = '中文';
let wordThreshold = 50;

(async function init() {
  try {
    const r = await chrome.runtime.sendMessage({ action: 'getConfig' });
    if (r && r.success && r.data) {
      autoTranslate = r.data.autoTranslate !== false;
      targetLanguage = r.data.targetLanguage || '中文';
      wordThreshold = r.data.wordThreshold || 50;
      textProcessor.wordThreshold = wordThreshold;
    }
  } catch (e) {
    console.error('init config error:', e);
  }
  bindEvents();
})();

function bindEvents() {
  document.addEventListener('keydown', onKeyDown);
  if (autoTranslate) {
    document.addEventListener('mouseup', debounce(onMouseUp, 300));
    document.addEventListener('touchend', debounce(onMouseUp, 300));
  }
}

function onKeyDown(e) {
  const isHotkey = (e.ctrlKey && e.shiftKey && (e.key === 'T' || e.key === 't')) ||
                   (e.altKey && e.key === 't');
  if (isHotkey) {
    e.preventDefault();
    triggerTranslate();
    return;
  }
  if (e.key === 'Escape') {
    floatingPopup.hide();
    sidebarManager.close();
  }
}

function onMouseUp() {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;
  const text = selection.toString().trim();
  if (text.length < 2) return;
  triggerTranslate();
}

function triggerTranslate() {
  const selection = window.getSelection();
  if (!selection) return;
  const result = textProcessor.analyzeSelection(selection);
  if (!result) return;

  const isWord = result.isWord && result.length < wordThreshold;

  if (isWord) {
    floatingPopup.show(result.text, result.position);
  } else {
    floatingPopup.hide();
    sidebarManager.open(result.text);
  }
}

function debounce(fn, wait) {
  let t;
  return function () {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, arguments), wait);
  };
}
