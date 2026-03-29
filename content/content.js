// content/content.js

console.log('=== CONTENT SCRIPT STARTED ===');

const textProcessor = new TextProcessor();
const floatingPopup = new FloatingPopup();
const sidebarManager = new SidebarManager();

document.addEventListener('mouseup', async function() {
  console.log('Mouse up!');
  
  setTimeout(async function() {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    console.log('Selected:', text.substring(0, 50));
    
    if (text.length < 2) {
      console.log('Too short');
      return;
    }
    
    const result = textProcessor.analyzeSelection(selection);
    console.log('Analysis result:', result);
    
    if (result) {
      console.log('Showing popup...');
      floatingPopup.show(result.text, result.position);
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

console.log('=== READY ===');
