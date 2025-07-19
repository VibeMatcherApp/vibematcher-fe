export interface MatchedUser {
  wallet_address: string; // Ensure compatibility with API response
  nickname: string;
  chat_id: string; // Ensure compatibility with API response
  id: string; // Ensure compatibility with API response
  avatarUrl?: string; // Make avatarUrl optional
  latestMessage?: string; // Ensure compatibility with API response
  _id?: string; // Add _id property for compatibility
}

// 添加配對API響應的類型定義
export interface Match {
  wallet_address: string;
  matched_at: string;
  chat_id: string;
  _id?: string;
  user_info: {
    nickname: string;
    profile: {
      avatar?: string | null;
      age?: number;
      bio?: string;
    };
    [key: string]: any; // 允許其他額外字段
  };
}

export interface UserMatchesResponse {
  matches: Match[];
  total_matches: number;
}

// Chat message types
export interface ChatMessage {
  messageId: string;
  sender: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface ChatMessagesResponse {
  chatId: string;
  messages: ChatMessage[];
  pagination: {
    currentPage: number;
    totalMessages: number;
    hasMore: boolean;
  };
}

export interface SendMessageResponse {
  message: string;
  data: {
    sender: string;
    content: string;
    timestamp: string;
    isRead: boolean;
  };
}

export interface UserChat {
  chatId: string;
  otherParticipant: string;
  lastMessage: {
    content: string;
    timestamp: string;
    sender: string;
  };
  unreadCount: number;
  updated_at: string;
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
  // Loading and error states
  isLoaded?: boolean;
  hasError?: boolean;
}

export interface MatchResult {
  match_percentage: string;
}