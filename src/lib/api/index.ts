import axios from 'axios'
import { User, MatchResult } from '@/types'
const APP_KEY = process.env.NEXT_APP_KEY as string

let _decClient:
  | (InstanceType<NonNullable<typeof window.DecryptionClient>>)
  | null = null

function getDecryptionClient() {
  if (typeof window === 'undefined') return null
  if (!_decClient) {
    if (!window.DecryptionClient) {
      console.warn('DecryptionClient not found. Check script loading.')
      return null
    }
    if (!APP_KEY) {
      console.warn('APP_KEY missing. Return raw JSON without decryption.')
      return null
    }
    _decClient = new window.DecryptionClient(APP_KEY)
  }
  return _decClient
}

function looksEncrypted(payload: any): boolean {
  if (!payload || typeof payload !== 'object') return false
  if (payload._encryption_info) return true
  try {
    return JSON.stringify(payload).includes('"_encrypted":true')
  } catch {
    return false
  }
}

/**
 * Recursively strip encrypted objects {_encrypted, data, iv} and replace with
 * empty string so React never tries to render an object as a child.
 */
function stripEncryptedFields(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (obj._encrypted === true) return ''
  if (Array.isArray(obj)) return obj.map(stripEncryptedFields)
  const result: any = {}
  for (const key of Object.keys(obj)) {
    result[key] = stripEncryptedFields(obj[key])
  }
  return result
}

function decryptIfNeeded(data: any) {
  if (!looksEncrypted(data)) return data

  const client = getDecryptionClient()

  // Try decryption if client is available
  if (client) {
    try {
      const decrypted = Array.isArray(data)
        ? client.decryptUsersArray(data)
        : client.decryptCompleteUserData(data)
      return decrypted
    } catch (e) {
      console.warn('Decrypt failed, stripping encrypted fields.', e)
    }
  }

  // Safety net: strip any remaining {_encrypted, data, iv} objects
  // so React doesn't crash trying to render them
  return stripEncryptedFields(data)
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
})

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for logging
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    try {
      response.data = decryptIfNeeded(response.data)
    } catch (e) {
      // Decryption failure should not block the flow
      console.error('Decrypt interceptor error:', e)
    }
    return response
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    return Promise.reject(error)
  }
)

export const createUser = async (user: Partial<User>) => {
  if (!user.wallet_address || !user.nickname) {
    throw new Error('Missing required fields: wallet or nickname')
  }

  console.log('Creating user with:', user)

  try {
    const { data } = await api.post<User>('/api/users', {
      wallet_address: user.wallet_address,
      nickname: user.nickname
    })
    return data
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export const getUser = async (wallet: string) => {
  try {
    const { data } = await api.get<User>(`/api/users/${wallet}`)
    return data
  } catch (error) {
    console.error('Error getting user:', error)
    throw error
  }
}

// Get user profile
export const getUserProfile = async (wallet: string) => {
  try {
    const { data } = await api.get(`/api/users/${wallet}/profile`)
    return data
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw error
  }
}

export const updateUser = async (wallet: string, updates: Partial<User>) => {
  try {
    const { data } = await api.patch<User>(`/api/users/${wallet}/update`, updates)
    return data
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

export const updateUserTokens = async (wallet: string, tokens: { [key: string]: number }) => {
  try {
    const { data } = await api.patch<User>(`/api/users/${wallet}/update_tokens`, { tokens })
    return data
  } catch (error) {
    console.error('Error updating user tokens:', error)
    throw error
  }
}

export const getMatchPercentage = async (wallet1: string, wallet2: string) => {
  try {
    const { data } = await api.get<MatchResult>(`/api/users/match?wallet1=${wallet1}&wallet2=${wallet2}`)
    return data
  } catch (error) {
    console.error('Error getting match percentage:', error)
    throw error
  }
}

export const getAllUsers = async () => {
  try {
    const { data } = await api.get<User[]>('/api/users')
    return data
  } catch (error) {
    console.error('Error getting all users:', error)
    throw error
  }
}

export const addFriend = async (wallet1: string, wallet2: string) => {
  try {
    const { data } = await api.post('/api/users/add_friend', { wallet1, wallet2 })
    return data
  } catch (error) {
    console.error('Error adding friend:', error)
    throw error
  }
}

// Swipe (like or pass) a user
export const swipeUser = async (
  userWallet: string,
  targetWallet: string,
  action: 'like' | 'pass'
) => {
  try {
    const { data } = await api.post(`/api/users/${userWallet}/swipe`, {
      target_wallet: targetWallet,
      action,
    });
    return data;
  } catch (error) {
    console.error('Error swiping user:', error);
    throw error;
  }
};

// Note: Swipe recording is handled by the existing swipeUser function above

// Get user matches with chat information
export const getUserMatches = async (userWallet: string) => {
  try {
    const { data } = await api.get(`/api/users/${userWallet}/matches`);
    return data;
  } catch (error) {
    console.error('Error getting user matches:', error);
    throw error;
  }
};

// Get swipe history
export const getSwipeHistory = async (userWallet: string) => {
  try {
    const { data } = await api.get(`/api/users/${userWallet}/swipe-history`);
    return data;
  } catch (error) {
    console.error('Error getting swipe history:', error);
    throw error;
  }
};

// ========== CHAT API FUNCTIONS ==========

// Create a new chat between two users
export const createChat = async (user1: string, user2: string) => {
  try {
    const { data } = await api.post('/api/chats/create', {
      user1,
      user2,
    });
    return data;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

// Send a message in a chat
export const sendMessage = async (chatId: string, content: string, sender: string) => {
  try {
    const { data } = await api.post(`/api/chats/${chatId}/send`, {
      content,
      sender,
    });
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get chat messages
export const getChatMessages = async (chatId: string, page = 1, limit = 50) => {
  try {
    const { data } = await api.get(`/api/chats/${chatId}?page=${page}&limit=${limit}`);
    return data;
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw error;
  }
};

// Mark messages as read
export const markMessagesAsRead = async (chatId: string, userWallet: string) => {
  try {
    const { data } = await api.patch(`/api/chats/${chatId}/read`, {
      userWallet,
    });
    return data;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

// Get user chats
export const getUserChats = async (userWallet: string) => {
  try {
    const { data } = await api.get(`/api/chats/user/${userWallet}`);
    return data;
  } catch (error) {
    console.error('Error getting user chats:', error);
    throw error;
  }
};
