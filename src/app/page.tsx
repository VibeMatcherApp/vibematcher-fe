'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useAuthStore } from '@/store/auth'
import { privyUserToLocalUser } from '@/lib/utils'
import { updateUserTokens, getUser } from '@/lib/api'

export default function Home() {
  const { ready, authenticated, user, login } = usePrivy()
  const router = useRouter()
  const { setUser, setIsAuthenticated } = useAuthStore()

  useEffect(() => {
    if (ready && authenticated) {
      router.replace('/discover')
    }
  }, [ready, authenticated, router])

  useEffect(() => {
    async function initializeUser() {
      if (authenticated && user) {
        setUser(privyUserToLocalUser(user))
        setIsAuthenticated(true)
      }
    }
    initializeUser()
  }, [authenticated, user, setUser, setIsAuthenticated])

  useEffect(() => {
    async function updateTokensOnLogin() {
      if (authenticated && user?.wallet?.address) {
        try {
          const userDetails = await getUser(user.wallet.address)
          if (userDetails?.tokenDistribution) {
            await updateUserTokens(user.wallet.address, userDetails.tokenDistribution)
          }
        } catch (err) {
          console.error('Failed to update user tokens on login', err)
        }
      }
    }
    updateTokensOnLogin()
  }, [authenticated, user?.wallet?.address])

  if (ready && authenticated) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side content */}
            <div className="flex flex-col items-center text-center lg:text-left lg:items-start">
              <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-6 text-center lg:text-left">
                VibeMatcher
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl text-center lg:text-left">
                The Web3 social matching platform that helps you find like-minded friends through token distribution.
              </p>
              <div className="space-y-4 w-full max-w-md">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 text-center lg:text-left">Secure Web3 authentication</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 text-center lg:text-left">Smart matching</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <span className="text-gray-700 text-center lg:text-left">Real-time chat feature</span>
                </div>
              </div>
              <button
                onClick={login}
                className="mt-8 w-full sm:w-auto px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 mx-auto lg:mx-0"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Start Matching</span>
              </button>
            </div>

            {/* Right side image/preview */}
            <div className="hidden lg:block relative">
              <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-2">Find your Web3 partner</h3>
                    <p className="text-white/80">Smart matching based on token distribution and interests</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
