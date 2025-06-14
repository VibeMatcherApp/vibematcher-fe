import TinderCard from 'react-tinder-card'
import { User } from '@/types'
import { PieChart } from './PieChart'

interface SwipeCardProps {
  user: User
  onSwipe: (direction: string) => void
}

export const SwipeCard = ({ user, onSwipe }: SwipeCardProps) => {
  const chartData = user?.tokenDistribution ? Object.entries(user.tokenDistribution).map(([name, value]) => ({
    name,
    value: Number(value)
  })) : []

  const { tags } = user

  return (
    <TinderCard
      onSwipe={onSwipe}
      preventSwipe={['up', 'down']}
      className="absolute w-full h-full bg-white rounded-xl shadow-lg"
      onSwipeRequirementFulfilled={() => {}}
      swipeThreshold={50}
    >
      <div className="h-full overflow-y-auto p-6 space-y-4">
        <div>
          <h3 className="text-xl font-semibold text-primary">{user.nickname || 'Anonymous'}</h3>
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
  )
} 