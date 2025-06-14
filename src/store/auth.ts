import { create } from 'zustand'
import { User } from '@/types'

interface AuthState {
  user: User | null
  setUser: (user: User | null) => void
  isAuthenticated: boolean
  setIsAuthenticated: (isAuthenticated: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
})) 