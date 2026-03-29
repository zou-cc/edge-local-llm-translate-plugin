// content/content.js - Debug version with detailed logging

console.log('=== CONTENT SCRIPT STARTED ===');

document.addEventListener('mouseup', async function() {
  console.log('Mouse up!');
  
  setTimeout(async function() {
    const text = window.getSelection().toString().trim();
    console.log('Selected:', text);
    
    if (text.length < 2) {
      console.log('Too short');
      return;
    }
    
    const shortText = text.substring(0, 50);
    console.log('Translating:', shortText);
    
    try {
      console.log('Sending request to background...');
      
      const response = await chrome.runtime.sendMessage({
        action: 'translate',
        text: shortText,
        isWord: shortText.length < 20 && !shortText.includes(' '),
        targetLang: '中文'
      });
      
      console.log('Full response:', JSON.stringify(response, null, 2));
      
      if (response && response.success) {
        console.log('Data received:', response.data);
        const meaning = response.data?.meaning;
        const translation = response.data?.translation;
        const raw = response.data?.raw;
        
        console.log('Meaning:', meaning);
        console.log('Translation:', translation);
        console.log('Raw:', raw?.substring(0, 200));
        
        const result = meaning || translation || raw || '无翻译结果';
        alert('翻译结果: ' + result.substring(0, 100));
      } else {
        console.error('Failed:', response);
        alert('翻译失败: ' + (response?.error || '未知错误'));
      }
    } catch (e) {
      console.error('Error:', e);
      alert('错误: ' + e.message);
    }
  }, 100);
});

console.log('=== READY ===');
