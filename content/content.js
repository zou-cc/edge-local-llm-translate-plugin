// content/content.js - Debug version

console.log('=== CONTENT SCRIPT LOADED ===');

// 等待DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('=== INIT CALLED ===');
  
  const textProcessor = new TextProcessor();
  const floatingPopup = new FloatingPopup();
  
  console.log('Components created');
  
  // 监听划词
  document.addEventListener('mouseup', (e) => {
    console.log('Mouse up detected');
    
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection.toString().trim();
      
      console.log('Selected text:', text);
      
      if (text.length < 2) {
        console.log('Text too short, ignoring');
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
  
  console.log('Event listener attached');
}
