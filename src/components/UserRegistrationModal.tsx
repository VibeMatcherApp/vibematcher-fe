'use client'

import { useState } from 'react'
import { createUser } from '@/lib/api'

interface UserRegistrationModalProps {
  isOpen: boolean
  walletAddress: string
  onSuccess: (user: any) => void
  onError: (error: string) => void
}

export function UserRegistrationModal({ 
  isOpen, 
  walletAddress, 
  onSuccess, 
  onError 
}: UserRegistrationModalProps) {
  const [formData, setFormData] = useState({
    nickname: '',
    age: '',
    bio: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nickname.trim()) {
      onError('Please enter a nickname')
      return
    }

    setIsSubmitting(true)
    
    try {
      const userData = {
        wallet_address: walletAddress,
        nickname: formData.nickname.trim()
      }
      
      const newUser = await createUser(userData)
      onSuccess(newUser)
    } catch (error: any) {
      console.error('Error creating user:', error)
      onError(error?.response?.data?.message || 'Failed to create user. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
          Welcome to VibeMatcher!
        </h2>
        
        <p className="text-gray-600 mb-6 text-center">
          We need some basic information to create your account
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nickname <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="Enter your nickname"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-500"
              required
              disabled={isSubmitting}
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age (Optional)
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              placeholder="Enter your age"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-500"
              min="18"
              max="100"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio (Optional)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 placeholder-gray-500"
              rows={3}
              disabled={isSubmitting}
              maxLength={200}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || !formData.nickname.trim()}
              className="flex-1 bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>

        <p className="text-xs text-gray-500 mt-4 text-center">
          You can complete more details in your profile page after account creation
        </p>
      </div>
    </div>
  )
} 