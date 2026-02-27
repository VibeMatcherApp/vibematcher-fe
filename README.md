# VibeMatcher Frontend

Web3 social matching platform frontend — matches users based on on-chain token holdings similarity.

## Tech Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **TailwindCSS** + **Framer Motion** + **React Spring**
- **Zustand** (state management) + **React Query** (API caching)
- **Privy** (Wallet / Email / Twitter auth)
- **Socket.io** (real-time chat)
- **Tapestry SDK** (on-chain social graph)
- **Recharts** (token distribution charts)

## Getting Started

```bash
npm install --legacy-peer-deps
cp .env.local.example .env.local  # Fill in environment variables
npm run dev
```

Open http://localhost:3000

## Environment Variables

```env
NEXT_PUBLIC_PRIVY_APP_ID=           # Privy App ID
NEXT_PUBLIC_PRIVY_CLIENT_ID=        # Privy Client ID
NEXT_PUBLIC_API_BASE_URL=           # Backend API URL (local: http://localhost:3001/)
NEXT_APP_KEY=                       # API encryption key
NEXT_PUBLIC_TAPESTRY_API_KEY=       # Tapestry SDK API Key
```

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── page.tsx               # Landing / Login page
│   ├── discover/page.tsx      # Swipe matching page
│   ├── chat/page.tsx          # Chat list
│   ├── chat/[chatId]/page.tsx # Chat room
│   └── profile/page.tsx       # User profile
├── components/
│   ├── AuthenticatedLayout.tsx # Post-login layout (Sidebar + BottomNav)
│   ├── Navigation.tsx         # Top navigation
│   ├── Sidebar.tsx            # Desktop sidebar
│   ├── BottomNav.tsx          # Mobile bottom navigation
│   ├── MatchSuccess.tsx       # Match success modal
│   ├── PieChart.tsx           # Token distribution pie chart
│   ├── UserProfileModal.tsx   # User profile modal
│   └── UserRegistrationModal.tsx # Registration form modal
├── hooks/
│   └── useSocket.ts           # useChat / useOnlineStatus hooks
├── lib/
│   ├── api/index.ts           # All backend API calls (axios)
│   ├── socket.ts              # Socket.io connection singleton
│   ├── tapestry/              # Tapestry SDK integration
│   │   ├── client.ts          # SDK client initialization
│   │   ├── profiles.ts        # Create / update profile
│   │   └── social.ts          # Follow / unfollow / social counts
│   └── utils/index.ts         # Utility functions
├── store/auth.ts              # Zustand auth store
├── types/index.ts             # TypeScript type definitions
└── setting/index.ts           # Global settings
```

## Features

### Authentication & Registration
- Privy integration (Wallet / Email / Twitter login)
- Auto-guided profile setup on first login
- Auto-sync Tapestry social profile on login

### Matching System
- Tinder-style swipe cards (react-tinder-card)
- Similarity percentage based on token distribution
- Auto-filters already swiped / matched users
- Auto-creates chat room + mutual Tapestry follow on match

### Chat
- Socket.io real-time messaging (30s polling fallback)
- Typing indicator
- Online status display
- Unread count badge

### Profile
- Avatar upload (auto-compress)
- Basic info (age / gender / region / timezone / language / bio)
- Social links (X / Telegram)
- Token distribution pie chart
- Tapestry follower / following stats
- Social share card (dom-to-image)

## API Endpoints

Backend API endpoints called by the frontend:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users` | Create user |
| GET | `/api/users/:id` | Get user data |
| PATCH | `/api/users/:id/update` | Update user data |
| PATCH | `/api/users/:wallet/update_tokens` | Update token holdings |
| GET | `/api/users/match` | Calculate match similarity |
| GET | `/api/users` | Get all users |
| POST | `/api/users/add_friend` | Add friend |
| POST | `/api/users/:id/swipe` | Record swipe |
| GET | `/api/users/:id/matches` | Get match list |
| GET | `/api/users/:id/swipe-history` | Get swipe history |
| POST | `/api/chats/create` | Create chat room |
| POST | `/api/chats/:chatId/send` | Send message |
| GET | `/api/chats/:chatId` | Get chat messages |
| PATCH | `/api/chats/:chatId/read` | Mark as read |
| GET | `/api/chats/user/:id` | Get user's chat list |

## Branches

| Branch | Description |
|--------|-------------|
| `main` | Latest version (Tapestry + Socket.io) |
| `doodle` | Legacy snapshot (with Doodles Agent) |
| `game` | Quiz game experimental branch |
