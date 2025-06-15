import TinderCard from 'react-tinder-card'
import { User } from '@/types'
import { PieChart } from './PieChart'
import { useState } from 'react'

interface SwipeCardProps {
  user: User
  onSwipe: (direction: string) => void
}

export const SwipeCard = ({ user, onSwipe }: SwipeCardProps) => {
  const [swipeIndicator, setSwipeIndicator] = useState<string | null>(null)

  const chartData = user?.tokenDistribution ? Object.entries(user.tokenDistribution).map(([name, value]) => ({
    name,
    value: Number(value)
  })) : []

  const { tags } = user

  const handleSwipe = (direction: string) => {
    setSwipeIndicator(direction === 'right' ? 'Like' : 'Not Interested')
    setTimeout(() => setSwipeIndicator(null), 500) // Clear indicator after 0.5 seconds
    onSwipe(direction)
  }

  return (
    <div className="relative w-full h-full">
      {swipeIndicator && (
        <div className={`absolute inset-0 flex items-center justify-center z-10 ${swipeIndicator === 'Like' ? 'bg-green-500/50' : 'bg-red-500/50'}`}>
          <span className="text-white text-4xl font-extrabold tracking-wide animate-fade">
            {swipeIndicator}
          </span>
        </div>
      )}
      <TinderCard
        onSwipe={(direction) => {
          handleSwipe(direction);
          if (direction === 'left' || direction === 'right') {
            setTimeout(() => onSwipe(direction), 150); // Reduced delay for faster transition
          }
        }}
        preventSwipe={['up', 'down']}
        className="absolute w-full h-full bg-white rounded-xl shadow-lg transition-transform duration-300 ease-in-out"
        swipeThreshold={20} // Further reduced threshold for quicker swiping
      >
        <div className="h-full overflow-y-auto p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-primary">{user.nickname || 'Anonymous'}</h3>
            {user.matchPercentage !== undefined && (
              <span className="ml-2 text-base font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                Match Percentage: {user.matchPercentage}%
              </span>
            )}
          </div>

          {tags && (tags.blockchain || tags.assetType) && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.blockchain && (
                  <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-1 rounded-full">
                    {tags.blockchain}
                  </span>
                )}
                {tags.assetType && (
                  <span className="inline-flex items-center justify-center bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-1 rounded-full">
                    {tags.assetType}
                  </span>
                )}
              </div>
            </div>
          )}
          
          {chartData.length > 0 && (
            <div className="w-full">
              <div className="aspect-square max-w-[300px] md:max-w-[400px] mx-auto pointer-events-none">
                <PieChart data={chartData} />
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
    </div>
  )
}