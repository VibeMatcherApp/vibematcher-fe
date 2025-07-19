'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useAuthStore } from '@/store/auth'
import { privyUserToLocalUser } from '@/lib/utils'
import { updateUserTokens, getUser, createUser } from '@/lib/api'
import { UserRegistrationModal } from '@/components/UserRegistrationModal'

export default function Home() {
  const { ready, authenticated, user, login } = usePrivy()
  const router = useRouter()
  const { setUser, setIsAuthenticated } = useAuthStore()
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [registrationError, setRegistrationError] = useState('')
  const [isCheckingUser, setIsCheckingUser] = useState(false)

  useEffect(() => {
    if (ready && authenticated && user?.wallet?.address) {
      handleUserAuthentication()
    }
  }, [ready, authenticated, user])

  const handleUserAuthentication = async () => {
    if (!user?.wallet?.address) return
    
    setIsCheckingUser(true)
    try {
      // Try to get user data
      const userDetails = await getUser(user.wallet.address)
      
      // User exists, set state and redirect
        setUser(privyUserToLocalUser(user))
        setIsAuthenticated(true)
      
      // Update tokens
          if (userDetails?.tokenDistribution) {
            await updateUserTokens(user.wallet.address, userDetails.tokenDistribution)
          }
      
      router.replace('/discover')
    } catch (error: any) {
      // User doesn't exist, show registration modal
      if (error?.response?.status === 404) {
        setShowRegistrationModal(true)
      } else {
        console.error('Error checking user:', error)
        setRegistrationError('Error checking user data. Please login again.')
      }
    } finally {
      setIsCheckingUser(false)
    }
  }

  const handleRegistrationSuccess = async (newUser: any) => {
    try {
      // Set user state
      setUser(privyUserToLocalUser(user))
      setIsAuthenticated(true)
      setShowRegistrationModal(false)
      setRegistrationError('')
      
      // Redirect to profile page for user to complete their profile
      router.replace('/profile')
    } catch (error) {
      console.error('Error after registration:', error)
      setRegistrationError('Registration successful but navigation failed. Please refresh the page.')
        }
      }

  const handleRegistrationError = (error: string) => {
    setRegistrationError(error)
  }

  // If authenticated and checking user, show loading screen
  if (ready && authenticated && isCheckingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking user data...</p>
        </div>
      </div>
    )
  }

  // If authenticated and not showing registration modal, return null (prevent flickering)
  if (ready && authenticated && !showRegistrationModal) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Registration Modal */}
      <UserRegistrationModal
        isOpen={showRegistrationModal}
        walletAddress={user?.wallet?.address || ''}
        onSuccess={handleRegistrationSuccess}
        onError={handleRegistrationError}
      />

      {/* Error Message */}
      {registrationError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 mx-4">
          {registrationError}
        </div>
      )}

      <div className="lg:flex lg:items-center lg:min-h-screen">
        <div className="lg:w-1/2 px-4 py-8 sm:px-6 lg:px-16 lg:py-0">
          <div className="max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Find Your <span className="text-primary">Perfect Match</span> in Web3
              </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-8">
              Connect with like-minded individuals based on your token distribution and blockchain preferences.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4 sm:space-y-5 mb-8">
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm sm:text-base">Token-based matching algorithm</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm sm:text-base">Secure Web3 authentication</span>
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-gray-700 text-sm sm:text-base">Real-time chat feature</span>
              </div>
            </div>
              <button
                onClick={login}
                className="mt-8 w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2 mx-auto lg:mx-0 text-sm sm:text-base font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Start Matching</span>
              </button>
          </div>
            </div>

            {/* Right side image/preview */}
        <div className="lg:w-1/2 relative mt-12 lg:mt-0 px-4 py-8 sm:px-6 lg:px-8 lg:py-0">
          <div className="relative mx-auto max-w-md lg:max-w-lg">
            {/* Phone mockup */}
            <div className="bg-gray-900 rounded-[2.5rem] p-2 shadow-xl">
              <div className="bg-gray-50 rounded-[2rem] overflow-hidden">
                {/* Status bar */}
                <div className="bg-gray-900 h-6 rounded-t-[2rem] flex items-center justify-between px-6">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                  <div className="text-white text-xs">9:41</div>
                  <div className="flex space-x-1">
                    <div className="w-4 h-2 bg-white rounded-sm"></div>
                  </div>
                </div>
                
                {/* App content preview */}
                <div className="h-96 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-primary rounded-full mx-auto flex items-center justify-center">
                      <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="space-y-2">
                      <div className="w-32 h-2 bg-gray-300 rounded mx-auto"></div>
                      <div className="w-24 h-2 bg-gray-300 rounded mx-auto"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
                         {/* Floating elements */}
             <div className="absolute -top-2 sm:-top-4 -left-2 sm:-left-4 bg-white rounded-lg shadow-lg p-2 sm:p-3">
               <div className="flex items-center space-x-1 sm:space-x-2">
                 <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                   <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                 </div>
                 <span className="text-xs sm:text-sm font-medium text-gray-800">Online</span>
               </div>
             </div>
             
             <div className="absolute -bottom-2 sm:-bottom-4 -right-2 sm:-right-4 bg-white rounded-lg shadow-lg p-2 sm:p-3">
               <div className="flex items-center space-x-1 sm:space-x-2">
                 <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                 </svg>
                 <span className="text-xs sm:text-sm font-medium text-gray-800">Match!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
