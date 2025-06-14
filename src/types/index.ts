export interface User {
  wallet_address: string
  nickname?: string
  region?: string
  age?: number
  timezone?: string
  gender?: string
  bio?: string
  tags: {
    blockchain: string[]
    assetType: string[]
  }
  tokenDistribution: {
    [key: string]: number
  }
  chain_data?: {
    distribution: {
      [key: string]: number
    }
  }
}

export interface MatchResult {
  match_percentage: number
  user1: User
  user2: User
} 