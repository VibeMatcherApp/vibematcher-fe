export interface MatchedUser {
  wallet_address: string; // Ensure compatibility with API response
  nickname: string;
  chat_id: string; // Ensure compatibility with API response
  id: string; // Ensure compatibility with API response
  avatarUrl?: string; // Make avatarUrl optional
  latestMessage?: string; // Ensure compatibility with API response
  _id?: string; // Add _id property for compatibility
}

export interface UserProfile {
  age?: number;
  gender?: string;
  region?: string;
  avatar?: string;
  bio?: string;
  languages?: string[];
  timezone?: string;
}

export interface UserSocialLinks {
  x_profile?: string;
  telegram_profile?: string;
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
  // 新增
  profile?: UserProfile;
  social_links?: UserSocialLinks;
}

export interface MatchResult {
  match_percentage: string;
}