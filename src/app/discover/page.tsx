'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useAuthStore } from '@/store/auth'
import { MatchSuccess } from '@/components/MatchSuccess'
import { getAllUsers, getMatchPercentage, addFriend, getUser } from '@/lib/api'
import { User } from '@/types'
import TinderCard from 'react-tinder-card'
import { PieChart } from '@/components/PieChart'

export default function DiscoverPage() {
  const { authenticated } = usePrivy()
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [matchResult, setMatchResult] = useState<{ percentage: number; user: User } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDirection, setLastDirection] = useState<string | undefined>()

  const currentIndexRef = useRef(currentIndex)

  const childRefs = useMemo(
    () => Array(users.length).fill(0).map(() => React.createRef<any>()),
    [users.length]
  )

  useEffect(() => {
    if (!authenticated || !currentUser) {
      router.push('/')
      return
    }

    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const basicUsers = await getAllUsers()
        const filteredUsers = basicUsers.filter(
          (u) => u.wallet_address !== currentUser?.wallet_address // Exclude current user
        )

        const detailedUsers = await Promise.all(
          filteredUsers.map(async (user) => {
            try {
              const detailedUser = await getUser(user.wallet_address)
              const tags = {
                blockchain: Array.isArray(detailedUser.tags?.blockchain)
                  ? detailedUser.tags.blockchain
                  : [detailedUser.tags?.blockchain || ''],
                assetType: Array.isArray(detailedUser.tags?.assetType)
                  ? detailedUser.tags.assetType
                  : [detailedUser.tags?.assetType || ''],
              }

              return {
                ...user,
                tokenDistribution: detailedUser.chain_data?.distribution || {},
                tags,
              }
            } catch (error) {
              console.error(
                `Error fetching details for user ${user.wallet_address}:`,
                error
              )
              return {
                ...user,
                tokenDistribution: {},
                tags: { blockchain: [], assetType: [] },
              }
            }
          })
        )

        const usersWithMatchPercentage = await Promise.all(
          detailedUsers.map(async (user) => {
            if (!currentUser?.wallet_address) return user;
            try {
              const result = await getMatchPercentage(user.wallet_address, currentUser.wallet_address);
              return {
                ...user,
                matchPercentage: Math.round(Number(result.match_percentage)),
              };
            } catch (error) {
              console.error(`Error fetching match percentage for ${user.wallet_address}:`, error);
              return {
                ...user,
                matchPercentage: 0,
              };
            }
          })
        );

        setUsers(usersWithMatchPercentage);
        if (usersWithMatchPercentage.length > 0) {
          updateCurrentIndex(usersWithMatchPercentage.length - 1)
        }
      } catch (error) {
        console.error('Error fetching users:', error)
        setError('Failed to load users. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [authenticated, currentUser, router])

  const updateCurrentIndex = (val: number) => {
    setCurrentIndex(val)
    currentIndexRef.current = val
  }

  const canGoBack = currentIndex < users.length - 1
  const canSwipe = currentIndex >= 0

  const swiped = async (direction: string, nameToDelete: string, index: number) => {
    setLastDirection(direction)
    if (direction === 'right' && currentUser?.wallet_address && users[index]) {
      console.log('liked')
      try {
        const result = await getMatchPercentage(users[index].wallet_address, currentUser.wallet_address)
        if (Number(result.match_percentage) > 70) {
          await addFriend(currentUser.wallet_address, users[index].wallet_address)
          setMatchResult({
            percentage: Number(result.match_percentage),
            user: users[index],
          })
          setShowMatchModal(true)
          setTimeout(() => router.push('/chat'), 2500) // Redirect after 2.5 seconds
        }
      } catch (error) {
        console.error('Error checking match:', error)
      }
    } else if (direction === 'left') {
      console.log('not interested')
    }
    updateCurrentIndex(index - 1)
  }

  const outOfFrame = (name: string, idx: number) => {
    console.log(`${name} (${idx}) left the screen!`, currentIndexRef.current)
    currentIndexRef.current >= idx && childRefs[idx].current.restoreCard()
  }

  const swipe = async (dir: 'left' | 'right') => {
    if (canSwipe && currentIndex < users.length) {
      await childRefs[currentIndex].current.swipe(dir);
    }
  }

  const goBack = async () => {
    if (!canGoBack) return
    const newIndex = currentIndex + 1
    updateCurrentIndex(newIndex)
    await childRefs[newIndex].current.restoreCard()
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Please log in to continue</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Loading users...</p>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">No more users!</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
      <div className="h-full flex items-center justify-center">
        <div className="relative w-[95%] max-w-sm h-[600px]">
          {users.map((user, index) => (
            <TinderCard
              ref={childRefs[index]}
              className="absolute w-full h-full"
              key={user.wallet_address}
              onSwipe={(dir) => swiped(dir, user.nickname || 'Anonymous', index)}
              onCardLeftScreen={() => outOfFrame(user.nickname || 'Anonymous', index)}
            >
              <div className="h-full overflow-y-auto p-6 space-y-4 bg-white rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-primary">{user.nickname || 'Anonymous'}</h3>
                {user.tags && (user.tags.blockchain || user.tags.assetType) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.tags.blockchain && (
                        <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                          {user.tags.blockchain}
                        </span>
                      )}
                      {user.tags.assetType && (
                        <span className="inline-flex items-center justify-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                          {user.tags.assetType}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {user.tokenDistribution && (
                  <div className="w-full">
                    <div className="aspect-square max-w-[300px] mx-auto">
                      <PieChart
                        data={Object.entries(user.tokenDistribution).map(([name, value]) => ({ name, value: Number(value) }))}
                        matchPercentage={user.matchPercentage}
                      />
                    </div>
                    <div className="flex justify-center items-center space-x-4 mt-6">
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => swipe('left')}
                        className="flex items-center justify-center gap-2 h-12 px-6 bg-gray-100 text-gray-600 font-semibold rounded-full shadow-sm hover:bg-gray-200 transition-all duration-200 ease-in-out transform hover:-translate-y-px"
                        aria-label="Unlike"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Unlike</span>
                      </button>
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => swipe('right')}
                        className="flex items-center justify-center gap-2 h-12 px-6 bg-primary text-white font-semibold rounded-full shadow-md hover:bg-primary/90 transition-all duration-200 ease-in-out transform hover:-translate-y-px"
                        aria-label="Like"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                        </svg>
                        <span>Like</span>
                      </button>
                    </div>
                  </div>
                )}
                {user.bio && (
                  <div className="pt-2">
                    <p className="text-gray-600 text-sm leading-relaxed">{user.bio}</p>
                  </div>
                )}
              </div>
            </TinderCard>
          ))}
        </div>
      </div>

      <div className="flex justify-center mt-4 space-x-4">
        <button
          onClick={goBack}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Undo Swipe
        </button>
      </div>

      {showMatchModal && matchResult && (
        <MatchSuccess
          matchedWallet={matchResult.user.wallet_address}
          username={matchResult.user.nickname || 'Anonymous'}
          avatarUrl={matchResult.user.avatarUrl || '/default-avatar.png'}
        />
      )}
    </div>
  )
}
