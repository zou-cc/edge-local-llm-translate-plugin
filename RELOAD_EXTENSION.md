# 重新加载扩展的步骤

## 方法1：完全重新加载（推荐）

1. 打开 edge://extensions/
2. 找到"本地LLM划词翻译"扩展
3. 点击"Remove"（移除）按钮删除扩展
4. 重新点击"Load unpacked"（加载解压缩的扩展）
5. 选择文件夹：/home/zcc/prj/edge-local-llm-translate-plugin
6. 现在点击扩展图标应该能看到弹出窗口

## 方法2：刷新服务工作者

1. 打开 edge://extensions/
2. 找到扩展，点击"Details"
3. 在页面底部找到"Inspect views: service worker"
4. 点击"service worker"链接
5. 在新打开的开发者工具中，右键点击刷新按钮
6. 选择"Empty Cache and Hard Reload"

## 方法3：重启Edge浏览器

1. 完全关闭Edge浏览器
2. 重新打开
3. 进入 edge://extensions/
4. 确保扩展已启用
5. 测试点击图标
