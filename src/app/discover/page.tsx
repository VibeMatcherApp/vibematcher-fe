'use client'

import React, { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { useAuthStore } from '@/store/auth'
import { MatchSuccess } from '@/components/MatchSuccess'
import { getAllUsers, getMatchPercentage, addFriend, getUser, swipeUser, getUserMatches, createChat, getSwipeHistory } from '@/lib/api'
import { User } from '@/types'
import TinderCard from 'react-tinder-card'
import { PieChart } from '@/components/PieChart'
import { countries } from 'countries-list'

// Interface definitions for API responses
interface SwipeHistoryItem {
  target_wallet: string
  action: 'like' | 'pass'
  timestamp: string
  matched: boolean
}

interface SwipeHistoryResponse {
  swipe_history: SwipeHistoryItem[]
}

interface MatchItem {
  wallet_address: string
  matched_at: string
  chat_id: string
}

interface MatchesResponse {
  matches: MatchItem[]
}

export default function DiscoverPage() {
  const { authenticated } = usePrivy()
  const router = useRouter()
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [matchResult, setMatchResult] = useState<{ percentage: number; user: User; chatId?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastDirection, setLastDirection] = useState<string | undefined>()
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false)
  const [swipeError, setSwipeError] = useState<string | null>(null)
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const [filteringStats, setFilteringStats] = useState<{
    totalUsers: number
    excludedUsers: number
    availableUsers: number
  } | null>(null)

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
      const currentUserWallet = currentUser.wallet || currentUser.wallet_address;
      if (!currentUserWallet) {
        setError("Could not find user's wallet address.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true)
        setError(null)
        
        const basicUsers = await getAllUsers()
        const filteredUsers = basicUsers.filter(
          (u) => u.wallet_address && u.wallet_address !== currentUserWallet
        )

        const detailedUsers = await Promise.all(
          filteredUsers.map(async (user) => {
            try {
              const detailedUser = await getUser(user.wallet_address!);
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
                nickname: detailedUser.nickname || user.nickname || 'Anonymous',
                profile: {
                  age: detailedUser.profile?.age || detailedUser.age,
                  gender: detailedUser.profile?.gender || detailedUser.gender,
                  region: detailedUser.profile?.region || detailedUser.region,
                  bio: detailedUser.profile?.bio || detailedUser.bio,
                  languages: detailedUser.profile?.languages || [],
                  timezone: detailedUser.profile?.timezone || detailedUser.timezone,
                  avatar: detailedUser.profile?.avatar || detailedUser.avatarUrl,
                  ...detailedUser.profile,
                },
                social_links: {
                  x_profile: detailedUser.social_links?.x_profile,
                  telegram_profile: detailedUser.social_links?.telegram_profile,
                  ...detailedUser.social_links,
                },
                bio: detailedUser.profile?.bio || detailedUser.bio || '',
                avatarUrl: detailedUser.profile?.avatar || detailedUser.avatarUrl || '',
                tokenDistribution: detailedUser.chain_data?.distribution || {},
                tags,
                // Add loading state for individual user
                isLoaded: true,
              }
            } catch (error) {
              console.error(
                `Error fetching details for user ${user.wallet_address!}:`,
                error
              )
              // Return user with basic structure even if API call fails
              return {
                ...user,
                nickname: user.nickname || 'Anonymous',
                profile: {
                  age: user.age,
                  gender: user.gender,
                  region: user.region,
                  bio: user.bio,
                  languages: [],
                  timezone: user.timezone,
                },
                social_links: {},
                bio: user.bio || '',
                avatarUrl: user.avatarUrl || '',
                tokenDistribution: {},
                tags: { blockchain: [], assetType: [] },
                isLoaded: false,
                hasError: true,
              }
            }
          })
        )

        // Get swipe history and matches to filter out already interacted users
        let excludedWallets = new Set<string>()
        
        try {
          // Fetch swipe history
          const swipeHistory: SwipeHistoryResponse = await getSwipeHistory(currentUserWallet)
          console.log('Swipe history response:', swipeHistory)
          
          if (swipeHistory && swipeHistory.swipe_history && Array.isArray(swipeHistory.swipe_history)) {
            const swipedWallets = swipeHistory.swipe_history
              .map((swipe: SwipeHistoryItem) => swipe.target_wallet)
              .filter((wallet): wallet is string => Boolean(wallet))
            
            swipedWallets.forEach((wallet: string) => excludedWallets.add(wallet))
            console.log('Swiped wallets from history:', swipedWallets)
          }
          
          // Fetch matches
          const matchesData: MatchesResponse = await getUserMatches(currentUserWallet)
          console.log('Matches response:', matchesData)
          
          if (matchesData && matchesData.matches && Array.isArray(matchesData.matches)) {
            const matchedWallets = matchesData.matches
              .map((match: MatchItem) => match.wallet_address)
              .filter((wallet): wallet is string => Boolean(wallet))
            
            matchedWallets.forEach((wallet: string) => excludedWallets.add(wallet))
            console.log('Matched wallets:', matchedWallets)
          }
          
          console.log('Total excluded wallet addresses:', Array.from(excludedWallets))
          console.log(`Excluding ${excludedWallets.size} users from discovery`)
          
        } catch (error) {
          console.error('Error fetching interaction history:', error)
          // Continue without filtering if API calls fail - this ensures the app still works
          // even if the swipe history or matches endpoints are unavailable
        }

        // Filter out users that have already been swiped or matched
        const availableUsers = detailedUsers.filter((user: User) => {
          const isExcluded = excludedWallets.has(user.wallet_address!)
          if (isExcluded) {
            console.log(`Filtering out user ${user.nickname} (${user.wallet_address}) - already interacted`)
          }
          return !isExcluded
        })

        // Set filtering statistics for debugging and user feedback
        const stats = {
          totalUsers: detailedUsers.length,
          excludedUsers: detailedUsers.length - availableUsers.length,
          availableUsers: availableUsers.length
        }
        setFilteringStats(stats)
        
        console.log(`Filtering Results:`)
        console.log(`- Total users fetched: ${stats.totalUsers}`)
        console.log(`- Users excluded (swiped/matched): ${stats.excludedUsers}`)
        console.log(`- Available users for discovery: ${stats.availableUsers}`)
        console.log(`- Excluded wallet addresses: ${Array.from(excludedWallets).join(', ')}`)

        const usersWithMatchPercentage = await Promise.all(
          availableUsers.map(async (user: User) => {
            try {
              const result = await getMatchPercentage(user.wallet_address!, currentUserWallet);
              return {
                ...user,
                matchPercentage: Math.round(Number(result.match_percentage)),
              };
            } catch (error) {
              console.error(`Error fetching match percentage for ${user.wallet_address!}:`, error);
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
    setSwipeError(null)
    setChatError(null)
    const currentUserWallet = currentUser?.wallet || currentUser?.wallet_address
    const user = users[index]

    if (!currentUserWallet || !user?.wallet_address) {
      console.error('Missing wallet addresses for swipe action')
      return
    }

    setIsProcessingSwipe(true)

    try {
      const action = direction === 'right' ? 'like' : 'pass'
      
      // Record swipe action using the correct API endpoint
      const swipeResponse = await swipeUser(currentUserWallet, user.wallet_address, action)

      // Only proceed with match logic if this was a right swipe (like)
      if (direction === 'right') {
        let isMatch = false
        let existingChatId = null

        // Check if the swipe resulted in a match (primary method)
        if (swipeResponse?.matched) {
          console.log('Match detected from swipe response!')
          isMatch = true
        } else {
          // Fallback: Check matches manually if swipe response doesn't include match info
          console.log('Checking for potential match via matches API...')
          try {
            const matchesResponse = await getUserMatches(currentUserWallet)
            const existingMatch = matchesResponse.matches?.find(
              (match: any) => match.wallet_address === user.wallet_address
            )

            if (existingMatch) {
              isMatch = true
              existingChatId = existingMatch.chat_id
              console.log('Match found via matches API!')
            }
          } catch (matchCheckError) {
            console.error('Error checking for matches after like:', matchCheckError)
            // Continue without erroring out completely
          }
        }

        // If we have a match, handle chat creation and show match modal
        if (isMatch) {
          let finalChatId = existingChatId

          // Create chat if we don't already have one
          if (!finalChatId) {
            try {
              setIsCreatingChat(true)
              console.log('Creating new chat room...')
              
              const chatResponse = await createChat(currentUserWallet, user.wallet_address)
              finalChatId = chatResponse._id || chatResponse.id
              
              console.log('Chat created successfully:', finalChatId)
                         } catch (chatCreateError: any) {
               console.error('Error creating chat:', chatCreateError)
               setChatError('Failed to create chat room. You can still find this match in your matches.')
               
               // Auto-hide chat error after 5 seconds
               setTimeout(() => {
                 setChatError(null)
               }, 5000)
               
               // Continue to show match modal even if chat creation fails
               // User can manually navigate to chat later
             } finally {
              setIsCreatingChat(false)
            }
          }

          // Show enhanced match success modal
          setMatchResult({
            percentage: user.matchPercentage || 100,
            user: user,
            chatId: finalChatId || undefined,
          })
          setShowMatchModal(true)
        } else {
          console.log('Like recorded, but no match yet')
        }
      } else {
        console.log('User passed')
      }

    } catch (error: any) {
      console.error('Error processing swipe:', error)
      setSwipeError(error?.response?.data?.message || 'Failed to record swipe. Please try again.')
      
      // Auto-hide error after 3 seconds
      setTimeout(() => {
        setSwipeError(null)
      }, 3000)
    } finally {
      setIsProcessingSwipe(false)
      setIsCreatingChat(false)
      
      // Remove the swiped user from the current users list immediately
      // This ensures they don't appear again even if they swipe back
      const swipedUserWallet = user.wallet_address
      setUsers(prevUsers => prevUsers.filter(u => u.wallet_address !== swipedUserWallet))
      
      // Update index to reflect the removed user
      updateCurrentIndex(Math.max(0, index - 1))
    }
  }

  const outOfFrame = (name: string, idx: number) => {
    console.log(`${name} (${idx}) left the screen!`, currentIndexRef.current)
    currentIndexRef.current >= idx && childRefs[idx].current.restoreCard()
  }

  const swipe = async (dir: 'left' | 'right') => {
    if (canSwipe && currentIndex < users.length && !isProcessingSwipe) {
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading users...</p>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
          <p className="text-gray-600 text-lg mb-4">
            {filteringStats ? 
              `You've seen all available users (${filteringStats.excludedUsers} already swiped or matched)` :
              "You've seen all available users"
            }
          </p>
          <p className="text-gray-500 text-sm">Check back later for new members or visit your matches in the chat section</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 overflow-hidden">
      {/* Development Debug Panel */}
      {process.env.NODE_ENV === 'development' && filteringStats && (
        <div className="absolute top-2 right-2 z-30 bg-white p-3 rounded-lg shadow-lg text-xs border">
          <div className="font-semibold text-gray-800 mb-1">Discovery Filter Stats</div>
          <div className="text-gray-600">
            <div>Total: {filteringStats.totalUsers}</div>
            <div>Excluded: {filteringStats.excludedUsers}</div>
            <div>Available: {filteringStats.availableUsers}</div>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {swipeError && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {swipeError}
        </div>
      )}
      
      {chatError && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
          {chatError}
        </div>
      )}
      
      {/* Processing Overlay */}
      {(isProcessingSwipe || isCreatingChat) && (
        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4 max-w-sm mx-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            {isCreatingChat ? (
              <div className="text-center">
                <span className="text-gray-700 font-medium">Creating chat room...</span>
                <p className="text-gray-500 text-sm mt-1">Setting up your conversation</p>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-gray-700 font-medium">Processing swipe...</span>
                <p className="text-gray-500 text-sm mt-1">Checking for matches</p>
              </div>
            )}
          </div>
        </div>
      )}
      
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
                {/* Header with avatar and name */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full border-2 border-primary/20 overflow-hidden bg-gray-100 flex items-center justify-center">
                    {user.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={user.nickname || 'Anonymous'} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-primary">{user.nickname || 'Anonymous'}</h3>
                      {user.hasError && (
                        <div className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full" title="Limited profile data available">
                          Limited Info
                        </div>
                      )}
                    </div>
                    {/* Basic info line */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                      {user.profile?.age && <span>{user.profile.age} years old</span>}
                      {user.profile?.gender && (
                        <>
                          {user.profile?.age && <span>•</span>}
                          <span>{user.profile.gender}</span>
                        </>
                      )}
                      {user.profile?.region && (
                        <>
                          {(user.profile?.age || user.profile?.gender) && <span>•</span>}
                          <span>{countries[user.profile.region as keyof typeof countries]?.name || user.profile.region}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {user.bio && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">About</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{user.bio}</p>
                  </div>
                )}

                {/* Languages */}
                {user.profile?.languages && user.profile.languages.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Languages</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.profile.languages.map((language, index) => (
                        <span key={index} className="inline-flex items-center justify-center bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-1 rounded-full">
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {user.tags && (user.tags.blockchain || user.tags.assetType) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Crypto Tags</h4>
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
                    <div className="aspect-square max-w-[300px] mx-auto pointer-events-none">
                      <PieChart 
                        data={Object.entries(user.tokenDistribution).map(([name, value]) => ({ name, value: Number(value) }))}
                        matchPercentage={user.matchPercentage}
                      />
                    </div>
                    
                    {/* Social Links */}
                    {(user.social_links?.x_profile || user.social_links?.telegram_profile) && (
                      <div className="flex justify-center items-center space-x-4 mt-4 p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-600">Connect:</span>
                        {user.social_links?.x_profile && (
                          <a
                            href={user.social_links.x_profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-8 h-8 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                            </svg>
                          </a>
                        )}
                        {user.social_links?.telegram_profile && (
                          <a
                            href={user.social_links.telegram_profile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-center items-center space-x-4 mt-6">
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => !(isProcessingSwipe || isCreatingChat) && swipe('left')}
                        disabled={isProcessingSwipe || isCreatingChat}
                        className={`flex items-center justify-center gap-2 h-12 px-6 bg-gray-100 text-gray-600 font-semibold rounded-full shadow-sm transition-all duration-200 ease-in-out transform ${
                          (isProcessingSwipe || isCreatingChat)
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-gray-200 hover:-translate-y-px'
                        }`}
                        aria-label="Unlike"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span className="pointer-events-none">Unlike</span>
                      </button>
                      <button
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => !(isProcessingSwipe || isCreatingChat) && swipe('right')}
                        disabled={isProcessingSwipe || isCreatingChat}
                        className={`flex items-center justify-center gap-2 h-12 px-6 bg-primary text-white font-semibold rounded-full shadow-md transition-all duration-200 ease-in-out transform ${
                          (isProcessingSwipe || isCreatingChat)
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-primary/90 hover:-translate-y-px'
                        }`}
                        aria-label="Like"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                        </svg>
                        <span className="pointer-events-none">Like</span>
                      </button>
                    </div>
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

      {showMatchModal && matchResult?.user.wallet_address && (
        <MatchSuccess
          matchedWallet={matchResult.user.wallet_address}
          username={matchResult.user.nickname || 'Anonymous'}
          avatarUrl={matchResult.user.avatarUrl}
          chatId={matchResult.chatId}
          onClose={() => {
            setShowMatchModal(false)
            setMatchResult(null)
            setChatError(null)
          }}
        />
      )}
    </div>
  )
}
