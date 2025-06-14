import { User } from '@/types'

export function privyUserToLocalUser(privyUser: any): User {
  return {
    wallet: privyUser.wallet?.address || '',
    nickname: privyUser.nickname || '',
    region: privyUser.region || '',
    age: privyUser.age || undefined,
    timezone: privyUser.timezone || '',
    gender: privyUser.gender || '',
    bio: privyUser.bio || '',
    tags: privyUser.tags || { blockchain: [], assetType: [] },
    tokenDistribution: privyUser.tokenDistribution || {},
  }
} 