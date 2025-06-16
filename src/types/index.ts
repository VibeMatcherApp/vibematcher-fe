export interface MatchedUser {
  wallet_address: string; // Ensure compatibility with API response
  nickname: string;
  chat_id: string; // Ensure compatibility with API response
  id: string; // Ensure compatibility with API response
  avatarUrl?: string; // Make avatarUrl optional
  latestMessage?: string; // Ensure compatibility with API response
  _id?: string; // Add _id property for compatibility
}

export interface User {
  wallet?: string
  wallet_address?: string
  nickname: string
  region: string
  timezone: string
  age?: number
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
  avatarUrl?: string // Add avatarUrl property to User type
  friends?: MatchedUser[]; // Ensure compatibility with API response
  matchPercentage?: number;
}

export interface MatchResult {
  match_percentage: string;
}