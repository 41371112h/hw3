# HW3 React專案整合個人靜態網站

科技117蔡欣育 41371112H  
[解說影片](https://youtu.be/8kEEivIasl8)

--- 
## 專案簡介與功能說明  
運用作業一所做的個人靜態網站，網站右下角整合了一個可以展開或收合的 AI 導遊互動面板，使用者可以輸入自己的 Google Gemini API Key，與 AI 導遊即時對話，可以在網頁中開啟聊天視窗，問AI導遊推薦的美食、景點，以獲取個人化的旅遊建議與行程規劃。

## 使用的 API
Google Gemini API
由 @google/generative-ai 套件提供
模型版本：gemini-1.5-flash 或 gemini-2.5-flash

## 安裝與執行方式
1.建立新專案(web2)-執行npx create-react-app@latest my-app  
2.把個人網頁資料放到新專案public中  
3.更改index.js  
4.AItest.tsx轉成AItest.js放入新專案src中  
5.更改AItest.js內容，換成個人網頁的風格(白粉色系)及調整大小  
6.將index.html拆分成三個檔案.html/.css/.js  
7.在App.css中調整版面大小，設計AI導遊視窗按鈕
8.終端機執行-先安裝npm install @google/generative-ai，再npm start  

## 範例截圖&說明
點入右下角按鈕，開啟AI導遊視窗並輸入API key  
<img width="903" height="452" alt="image" src="https://github.com/user-attachments/assets/4f53001e-d23a-4044-ab85-7966dd73cfbc" />  
進入旅遊指南，AI導遊開始規劃美食、行程  
<img width="785" height="444" alt="image" src="https://github.com/user-attachments/assets/8fcb0f51-2631-4711-8d3d-acc145126a60" />


