# VibeMatcher - Web3 Dating App

VibeMatcher is a Web3-based dating app that matches users based on their token distribution and blockchain preferences.

## Features

- 🔐 Authentication with Privy (supports wallet, email, and Twitter login)
- 💰 Token distribution-based matching algorithm
- 💬 Real-time chat feature
- 📊 Token distribution visualization with Recharts
- 🎨 Responsive design and deep green theme
- 🔄 Swipe matching interface

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- TailwindCSS
- Privy
- Recharts
- Zustand
- Framer Motion
- React Tinder Card

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/vibematcher-fe.git
cd vibematcher-fe
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file and add the following environment variables:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
NEXT_PUBLIC_API_BASE_URL=http://43.207.147.137:3001
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/app
  /chat        # Chat page
  /discover    # Discover/match page
  /profile     # Profile page
/components    # Reusable components
  /Navigation  # Navigation component
  /PieChart    # Pie chart component
  /SwipeCard   # Swipe card component
/lib          # Utility functions and API calls
/store        # Zustand state management
/types        # TypeScript type definitions
```

## API Integration

The app integrates with the following API endpoints:

- POST /api/users - Create a new user
- GET /api/users/:wallet - Get user info
- PATCH /api/users/:wallet/update - Update user info
- PATCH /api/users/:wallet/update_tokens - Update user token distribution
- GET /api/users/match - Get match percentage
- GET /api/users - Get all users
- POST /api/users/add_friend - Add friend

## Contributing

Pull Requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)
