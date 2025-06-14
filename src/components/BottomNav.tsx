'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'

const menuItems = [
  { name: 'Discover', path: '/discover' },
  { name: 'Chat', path: '/chat' },
  { name: 'Profile', path: '/profile' },
]

export function BottomNav() {
  const pathname = usePathname()
  const { ready, authenticated, logout } = usePrivy()

  if (!ready || !authenticated) return null

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <nav className="flex justify-around items-center h-16">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center w-full h-full ${
              pathname === item.path
                ? 'text-primary'
                : 'text-gray-600'
            }`}
          >
            <span className="text-sm">{item.name}</span>
          </Link>
        ))}
        <button
          onClick={logout}
          className="flex flex-col items-center justify-center w-full h-full text-red-600"
        >
          <span className="text-sm">Logout</span>
        </button>
      </nav>
    </div>
  )
} 