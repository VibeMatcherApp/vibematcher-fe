'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useAuthStore } from '@/store/auth'
import { SwipeCard } from '@/components/SwipeCard'
import { getAllUsers, getMatchPercentage, addFriend, getUser } from '@/lib/api'
import { User } from '@/types'

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

  useEffect(() => {
    if (!authenticated) {
      router.push('/')
      return
    }

    const fetchUsers = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // 獲取基本用戶列表
        const basicUsers = await getAllUsers()
        console.log('Basic users:', basicUsers)
        
        // 過濾掉當前用戶
        const filteredUsers = basicUsers.filter(u => u.wallet_address !== currentUser?.wallet_address)
        
        // 獲取每個用戶的完整數據
        const detailedUsers = await Promise.all(
          filteredUsers.map(async (user) => {
            try {
              const detailedUser = await getUser(user.wallet_address)
              console.log('Detailed user data:', detailedUser)
              
              // 確保 tags 字段的格式正確
              const tags = {
                blockchain: detailedUser.tags?.blockchain || '',
                assetType: detailedUser.tags?.assetType || ''
              }

              // 確保 tokenDistribution 的格式正確
              const tokenDistribution = detailedUser.chain_data?.distribution || {}
              console.log('Token distribution for user:', user.wallet_address, tokenDistribution)
              
              return {
                ...user,
                tokenDistribution,
                tags
              }
            } catch (error) {
              console.error(`Error fetching details for user ${user.wallet_address}:`, error)
              return {
                ...user,
                tokenDistribution: {},
                tags: { blockchain: '', assetType: '' }
              }
            }
          })
        )
        
        console.log('Final users data:', detailedUsers)
        setUsers(detailedUsers)
      } catch (error) {
        console.error('Error fetching users:', error)
        setError('Failed to load users. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [authenticated, router, currentUser])

  const handleSwipe = async (direction: string) => {
    if (direction === 'right' && currentUser && users[currentIndex]) {
      try {
        const result = await getMatchPercentage(currentUser.wallet_address, users[currentIndex].wallet_address)
        if (result.match_percentage > 70) {
          await addFriend(currentUser.wallet_address, users[currentIndex].wallet_address)
          setMatchResult({
            percentage: result.match_percentage,
            user: users[currentIndex],
          })
          setShowMatchModal(true)
        }
      } catch (error) {
        console.error('Error checking match:', error)
        // Don't show error to user for match checking
      }
    }
    setCurrentIndex(prev => prev + 1)
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to continue</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading users...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No more users to discover</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
      <div className="h-full flex items-center justify-center md:ml-0 md:transition-all md:duration-300 md:ease-in-out md:group-[.sidebar-open]:ml-64">
        <div className="relative w-[95%] max-w-sm h-[600px]">
          {users.slice(currentIndex, currentIndex + 3).map((user, index) => (
            <div
              key={user.wallet_address}
              className="absolute w-full h-full"
              style={{
                zIndex: 3 - index,
                transform: `translateY(${index * 20}px)`,
              }}
            >
              <SwipeCard user={user} onSwipe={handleSwipe} />
            </div>
          ))}
        </div>
      </div>

      {showMatchModal && matchResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl max-w-md w-full">
            <h2 className="text-2xl font-bold text-primary mb-4">It's a Match! 🎉</h2>
            <p className="text-gray-600 mb-4">
              You matched with {matchResult.user.nickname || 'Anonymous'}!
            </p>
            <p className="text-primary font-semibold mb-6">
              Match Percentage: {matchResult.percentage}%
            </p>
            <button
              onClick={() => {
                setShowMatchModal(false)
                router.push('/chat')
              }}
              className="w-full bg-primary text-white py-3 px-6 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Chatting
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
