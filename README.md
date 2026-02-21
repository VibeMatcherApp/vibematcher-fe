# VibeMatcher Frontend

Web3 社交配對平台前端，根據用戶的鏈上代幣持倉進行相似度匹配。

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **TailwindCSS** + **Framer Motion** + **React Spring**
- **Zustand** (狀態管理) + **React Query** (API 快取)
- **Privy** (錢包 / Email / Twitter 認證)
- **Socket.io** (即時聊天)
- **Tapestry SDK** (鏈上社交圖譜)
- **Recharts** (代幣分佈圖表)

## Getting Started

```bash
npm install --legacy-peer-deps
cp .env.local.example .env.local  # 填入環境變數
npm run dev
```

開啟 http://localhost:3000

## Environment Variables

```env
NEXT_PUBLIC_PRIVY_APP_ID=           # Privy App ID
NEXT_PUBLIC_PRIVY_CLIENT_ID=        # Privy Client ID
NEXT_PUBLIC_API_BASE_URL=           # 後端 API URL (本地: http://localhost:3001/)
NEXT_APP_KEY=                       # API 加密金鑰
NEXT_PUBLIC_TAPESTRY_API_KEY=       # Tapestry SDK API Key
```

## Project Structure

```
src/
├── app/                        # Next.js App Router 頁面
│   ├── page.tsx               # Landing / 登入頁
│   ├── discover/page.tsx      # 滑動配對頁
│   ├── chat/page.tsx          # 聊天列表
│   ├── chat/[chatId]/page.tsx # 聊天室
│   └── profile/page.tsx       # 個人檔案
├── components/
│   ├── AuthenticatedLayout.tsx # 登入後佈局 (Sidebar + BottomNav)
│   ├── Navigation.tsx         # 頂部導航
│   ├── Sidebar.tsx            # 桌面側邊欄
│   ├── BottomNav.tsx          # 手機底部導航
│   ├── MatchSuccess.tsx       # 配對成功彈窗
│   ├── PieChart.tsx           # 代幣分佈圓餅圖
│   ├── UserProfileModal.tsx   # 用戶資料彈窗
│   └── UserRegistrationModal.tsx # 註冊表單彈窗
├── hooks/
│   └── useSocket.ts           # useChat / useOnlineStatus hooks
├── lib/
│   ├── api/index.ts           # 所有後端 API 呼叫 (axios)
│   ├── socket.ts              # Socket.io 連線單例
│   ├── tapestry/              # Tapestry SDK 整合
│   │   ├── client.ts          # SDK client 初始化
│   │   ├── profiles.ts        # 建立 / 更新 profile
│   │   └── social.ts          # follow / unfollow / social counts
│   └── utils/index.ts         # 工具函數
├── store/auth.ts              # Zustand auth store
├── types/index.ts             # TypeScript 型別定義
└── setting/index.ts           # 全域設定
```

## Features

### 認證與註冊
- Privy 整合 (錢包 / Email / Twitter 登入)
- 首次登入自動引導填寫 profile
- 登入時自動同步 Tapestry 社交 profile

### 配對系統
- Tinder 風格滑動卡片 (react-tinder-card)
- 基於代幣分佈的相似度百分比
- 自動過濾已滑過 / 已配對的用戶
- 配對成功時自動建立聊天室 + Tapestry 互相 follow

### 聊天
- Socket.io 即時訊息 (30 秒 polling fallback)
- Typing indicator
- 在線狀態顯示
- 未讀數量 badge

### 個人檔案
- 頭像上傳 (自動壓縮)
- 基本資料 (年齡 / 性別 / 地區 / 時區 / 語言 / Bio)
- 社交連結 (X / Telegram)
- 代幣分佈圓餅圖
- Tapestry follower / following 統計
- 社交分享卡片 (dom-to-image)

## API Endpoints

前端呼叫的後端 API：

| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/api/users` | 建立用戶 |
| GET | `/api/users/:id` | 取得用戶資料 |
| PATCH | `/api/users/:id/update` | 更新用戶資料 |
| PATCH | `/api/users/:wallet/update_tokens` | 更新代幣持倉 |
| GET | `/api/users/match` | 計算配對相似度 |
| GET | `/api/users` | 取得所有用戶 |
| POST | `/api/users/add_friend` | 加好友 |
| POST | `/api/users/:id/swipe` | 記錄滑動 |
| GET | `/api/users/:id/matches` | 取得配對列表 |
| GET | `/api/users/:id/swipe-history` | 取得滑動歷史 |
| POST | `/api/chats/create` | 建立聊天室 |
| POST | `/api/chats/:chatId/send` | 發送訊息 |
| GET | `/api/chats/:chatId` | 取得聊天訊息 |
| PATCH | `/api/chats/:chatId/read` | 標記已讀 |
| GET | `/api/chats/user/:id` | 取得用戶的聊天列表 |

## Branches

| 分支 | 說明 |
|------|------|
| `main` | 最新版本 (Tapestry + Socket.io) |
| `doodle` | 舊版本快照 (含 Doodles Agent) |
| `game` | Quiz 遊戲實驗分支 |
