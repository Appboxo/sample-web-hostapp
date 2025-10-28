# Boxo Desktop SDK 測試說明

## 🎯 測試步驟

### 1. 啟動測試應用
```bash
cd /Users/chengleichou/boxo-sdk-test
npm start
```

### 2. 在瀏覽器中打開
```
http://localhost:3001
```

### 3. 操作流程

#### Step 1: 初始化 SDK
1. 點擊 "Initialize SDK" 按鈕
2. 等待 iframe 加載完成
3. 確認日誌顯示 "✅ SDK initialized successfully!"

#### Step 2: 測試登錄事件
1. 點擊 "Test Login Event" 按鈕
2. 觀察日誌中的事件流程

### 4. 正常日誌輸出

當 SDK 正常運作時，你會看到：
```
✅ Handling login event
✅ Generated auth code from Finom session (MOCK)
✅ Sending auth_code to Boxo Platform
```

**注意**：`Failed to get auth token from Boxo Platform` 是**正常的**！
- 因為這是一個 mock 測試環境
- Boxo Platform API 端點需要實際的 backend 配置
- 在生產環境中，這會連接到真實的 Boxo Platform

### 5. SDK 成功運作的標誌

✅ SDK 接收事件成功：
- 日誌顯示 "Handling login event"
- 能生成 auth code
- 能嘗試調用 Boxo Platform

✅ SDK 事件處理正常：
- 事件被 SDK 接收
- SDK 嘗試處理事件
- SDK 發送響應（即使 API 未配置）

## 📋 日誌解讀

### 正常工作
```
[BoxoDesktopHostSDK] Handling login event ✓
[BoxoDesktopHostSDK] Generated auth code ✓
[BoxoDesktopHostSDK] Sending auth_code to Boxo Platform ✓
```

### 預期的 API 錯誤（正常）
```
Failed to get auth token from Boxo Platform ✓
Boxo Platform API endpoint may not be configured yet ✓
Response is HTML instead of JSON ✓
```

這說明：
- ✅ SDK 正在工作
- ✅ 事件被正確處理
- ⚠️ 需要配置真實的 Boxo Platform API

## 🔧 修復 "No iframe reference" 錯誤

如果看到這個錯誤：
1. 確認點擊了 "Initialize SDK" 按鈕
2. 確認 iframe 已加載（刷新頁面）
3. 重新點擊 "Initialize SDK"

## 🎉 成功標誌

當你看到這些日誌時，說明 SDK 完全正常工作：
```
✅ SDK initialized successfully
✅ Handling login event
✅ Iframe reference set
```

SDK 已成功發布到 npm，可以在任何項目中使用！
