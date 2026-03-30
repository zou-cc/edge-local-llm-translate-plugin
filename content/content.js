// content/content.js

const textProcessor = new TextProcessor();
const floatingPopup = new FloatingPopup();
const sidebarManager = new SidebarManager();

document.addEventListener('mouseup', async function() {
  setTimeout(async function() {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length < 2) return;
    
    const result = textProcessor.analyzeSelection(selection);
    
    if (result) {
      // 判断是单词还是段落
      const isWord = result.isWord && result.length < 30;
      
      if (isWord) {
        floatingPopup.show(result.text, result.position);
      } else {
        floatingPopup.hide();
        sidebarManager.open(result.text);
      }
    }
  }, 100);
});

// 点击空白处关闭
document.addEventListener('mousedown', function(e) {
  if (!floatingPopup.contains(e.target)) {
    floatingPopup.hide();
  }
});

// ESC 键关闭
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    floatingPopup.hide();
    sidebarManager.close();
  }
});
