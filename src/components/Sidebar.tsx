'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'

const menuItems = [
  { name: 'Discover', path: '/discover' },
  { name: 'Chat', path: '/chat' },
  { name: 'Quiz', path: '/quiz' },
  { name: 'Profile', path: '/profile' },
]

interface SidebarProps {
  onToggle: (isOpen: boolean) => void
}

export function Sidebar({ onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { ready, authenticated, logout } = usePrivy()
  const [isVisible, setIsVisible] = useState(true)

  const handleToggle = (newState: boolean) => {
    setIsVisible(newState)
    onToggle(newState)
  }

  if (!ready || !authenticated) return null

  return (
    <>
      {/* 网页端侧边栏 */}
      {isVisible && (
        <div className="hidden md:block fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out translate-x-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(!isVisible)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-6 h-6 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <h1 className="text-xl font-bold text-gray-800">VibeMatcher</h1>
              </div>
            </div>
            
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-4 py-2 rounded-lg transition-colors ${
                    pathname === item.path
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={logout}
                className="w-full px-4 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar toggle button when hidden */}
      {!isVisible && (
        <button
          onClick={() => handleToggle(true)}
          className="hidden md:block fixed top-4 left-4 p-2 bg-gray-200 rounded-lg shadow-lg hover:bg-gray-300 transition-colors z-50"
        >
          <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* 移动端底部导航 */}
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
    </>
  )
}