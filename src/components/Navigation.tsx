"use client";

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useAuthStore } from '@/store/auth'

export const Navigation = () => {
  const pathname = usePathname()
  const { logout } = usePrivy()
  const { user } = useAuthStore()

  if (!user) return null

  const isActive = (path: string) => pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <Link
            href="/discover"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive('/discover')
                ? 'text-primary bg-primary/5'
                : 'text-gray-500 hover:text-primary hover:bg-gray-50'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-xs mt-1">Discover</span>
          </Link>

          <Link
            href="/chat"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive('/chat')
                ? 'text-primary bg-primary/5'
                : 'text-gray-500 hover:text-primary hover:bg-gray-50'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span className="text-xs mt-1">Chat</span>
          </Link>

          <Link
            href="/profile"
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
              isActive('/profile')
                ? 'text-primary bg-primary/5'
                : 'text-gray-500 hover:text-primary hover:bg-gray-50'
            }`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs mt-1">Profile</span>
          </Link>

          <button
            onClick={logout}
            className="flex flex-col items-center p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="text-xs mt-1">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
} 