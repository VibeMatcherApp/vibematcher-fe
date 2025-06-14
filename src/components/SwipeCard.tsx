import TinderCard from 'react-tinder-card'
import { User } from '@/types'
import { PieChart } from './PieChart'

interface SwipeCardProps {
  user: User
  onSwipe: (direction: string) => void
}

export const SwipeCard = ({ user, onSwipe }: SwipeCardProps) => {
  // 確保 tokenDistribution 存在且是對象
  const tokenDistribution = user.tokenDistribution || {}
  console.log('Token Distribution:', tokenDistribution)
  
  const chartData = Object.entries(tokenDistribution).map(([name, value]) => ({
    name,
    value: Number(value) // 確保值是數字
  }))
  console.log('Chart Data:', chartData)

  // 確保 tags 存在且格式正確
  const blockchainTags = Array.isArray(user.tags?.blockchain) ? user.tags.blockchain : []
  const assetTypeTags = Array.isArray(user.tags?.assetType) ? user.tags.assetType : []

  return (
    <TinderCard
      onSwipe={onSwipe}
      preventSwipe={['up', 'down']}
      className="absolute w-full max-w-sm md:max-w-xl lg:max-w-2xl bg-white rounded-xl shadow-lg p-6"
      onSwipeRequirementFulfilled={() => {}}
      swipeThreshold={50}
    >
      <div className="space-y-6">
        <div className="flex items-center">
          <h3 className="text-xl font-semibold text-primary">{user.nickname || 'Anonymous'}</h3>
        </div>
        
        {chartData.length > 0 && (
          <div className="w-full py-6">
            <div className="aspect-square max-w-[300px] md:max-w-[400px] mx-auto">
              <div className="pointer-events-none">
                <PieChart data={chartData} />
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {blockchainTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Blockchain</h4>
              <div className="flex flex-wrap gap-2">
                {blockchainTags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {assetTypeTags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Asset Type</h4>
              <div className="flex flex-wrap gap-2">
                {assetTypeTags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {user.bio && (
          <div className="pt-2">
            <p className="text-gray-600 text-sm leading-relaxed">{user.bio}</p>
          </div>
        )}
      </div>
    </TinderCard>
  )
} 