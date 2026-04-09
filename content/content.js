// content/content.js

const textProcessor = new TextProcessor();
const floatingPopup = new FloatingPopup();
const sidebarManager = new SidebarManager();

// Ctrl+Shift+T 快捷键触发翻译
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'T') {
    e.preventDefault();
    
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    if (text.length < 2) {
      console.log('No text selected');
      return;
    }
    
    const result = textProcessor.analyzeSelection(selection);
    
    if (result) {
      const isWord = result.isWord && result.length < 30;
      
      if (isWord) {
        floatingPopup.show(result.text, result.position);
      } else {
        floatingPopup.hide();
        sidebarManager.open(result.text);
      }
    }
  }
  
  // ESC 键关闭
  if (e.key === 'Escape') {
    floatingPopup.hide();
    sidebarManager.close();
  }
});
