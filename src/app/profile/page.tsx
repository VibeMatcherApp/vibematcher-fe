'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { User } from '@/types'
import { PieChart } from '@/components/PieChart'
import Select from 'react-select'
import { countries } from 'countries-list'
import moment from 'moment-timezone'
import { getUser, updateUser } from '@/lib/api'
import axios from 'axios'
import domtoimage from 'dom-to-image'
import { useRef } from 'react'

const countryOptions = Object.entries(countries).map(([code, country]) => ({
  value: code,
  label: country.name
}))

const timezoneOptions = moment.tz.names().map((tz: string) => ({
  value: tz,
  label: `${tz} (GMT${moment.tz(tz).format('Z')})`
}))

const genderOptions = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Others', label: 'Others' },
]

// Generate age options (18-100)
const ageOptions = Array.from({ length: 83 }, (_, i) => ({
  value: (i + 18).toString(),
  label: (i + 18).toString(),
}))

const languageOptions = [
  { value: 'English', label: 'English' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Japanese', label: 'Japanese' },
  { value: 'Korean', label: 'Korean' },
  { value: 'Spanish', label: 'Spanish' },
  { value: 'French', label: 'French' },
  { value: 'German', label: 'German' },
  { value: 'Russian', label: 'Russian' },
  { value: 'Other', label: 'Other' },
]

const customSelectStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: 'white',
    borderColor: '#D1D5DB',
    '&:hover': {
      borderColor: '#064e3b',
    },
  }),
  option: (base: any, state: { isSelected: boolean }) => ({
    ...base,
    backgroundColor: state.isSelected ? '#064e3b' : 'white',
    color: state.isSelected ? 'white' : '#111827',
    '&:hover': {
      backgroundColor: state.isSelected ? '#064e3b' : '#f3f4f6',
    },
  }),
  singleValue: (base: any) => ({
    ...base,
    color: '#111827',
  }),
  input: (base: any) => ({
    ...base,
    color: '#111827',
  }),
}

export default function ProfilePage() {
  const { user: currentUser, ready, authenticated } = usePrivy()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nickname: '',
    region: '',
    age: '',
    timezone: '',
    gender: '',
    bio: '',
    languages: [] as string[],
    x_profile: '',
    telegram_profile: '',
    avatar: '', // base64 string
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareImgUrl, setShareImgUrl] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [isRefreshingAssets, setIsRefreshingAssets] = useState(false)
  const [refreshMessage, setRefreshMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const shareRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ready) return
    if (!authenticated) {
      router.push('/')
      return
    }

    const fetchUserData = async () => {
      if (!currentUser?.wallet?.address) return
      try {
        const data = await getUser(currentUser.wallet.address)
        setUser(data)
        
        // Check if user is new (missing important data)
        const isUserNew = !data.profile?.age && !data.profile?.gender && !data.profile?.bio
        setIsNewUser(isUserNew)
        
        setFormData({
          nickname: data.nickname || '',
          region: data.profile?.region || data.region || '',
          age: (data.profile?.age ?? data.age)?.toString() || '',
          timezone: data.profile?.timezone || data.timezone || '',
          gender: data.profile?.gender || data.gender || '',
          bio: data.profile?.bio || data.bio || '',
          languages: data.profile?.languages || [],
          x_profile: data.social_links?.x_profile || '',
          telegram_profile: data.social_links?.telegram_profile || '',
          avatar: data.profile?.avatar || data.avatarUrl || '',
        })
        setAvatarPreview(data.profile?.avatar || data.avatarUrl || '')
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [currentUser, ready, router, authenticated])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Only image files are allowed!')
      return
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit for original file
      setErrorMsg('File size too large (max 10MB)')
      return
    }
    
    try {
      setIsProcessingImage(true)
      setErrorMsg('') // Clear any previous errors
      
      // Compress the image for avatar (smaller size for better performance)
      const compressedFile = await compressImage(file, 0.8, 400) // 80% quality, max 400px
      setAvatarFile(compressedFile)
      const previewUrl = URL.createObjectURL(compressedFile)
      setAvatarPreview(previewUrl)
      setFormData(prev => ({ ...prev, avatar: previewUrl }))
    } catch (error) {
      setErrorMsg('Failed to process image. Please try a different image.')
    } finally {
      setIsProcessingImage(false)
    }
  }

  // Helper function to compress images
  const compressImage = (file: File, quality: number = 0.7, maxWidth: number = 800): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height
            height = maxWidth
          }
        }
        
        // Set canvas size
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Canvas to Blob conversion failed'))
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = URL.createObjectURL(file)
    })
  }

  const handleRefreshAssets = async () => {
    if (!currentUser?.wallet?.address) return
    
    setIsRefreshingAssets(true)
    setRefreshMessage(null)
    
    try {
      // 重新获取用户数据，这应该会包含最新的链上资产信息
      const updatedUser = await getUser(currentUser.wallet.address)
      
      // 确保API返回了有效的用户数据
      if (updatedUser && updatedUser.wallet_address === currentUser.wallet.address) {
        setUser(updatedUser)
        
        setRefreshMessage({
          type: 'success',
          text: 'Assets data updated successfully!'
        })
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setRefreshMessage(null)
        }, 3000)
      } else {
        // 如果返回的数据无效，显示错误
        setRefreshMessage({
          type: 'error',
          text: 'Failed to update assets data. Please try again.'
        })
        
        setTimeout(() => {
          setRefreshMessage(null)
        }, 5000)
      }
    } catch (error: any) {
      console.error('Error refreshing assets:', error)
      setRefreshMessage({
        type: 'error',
        text: error?.response?.data?.message || 'Error updating assets data. Please try again later.'
      })
      
      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setRefreshMessage(null)
      }, 5000)
    } finally {
      setIsRefreshingAssets(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsSubmitting(true)
    if (!currentUser?.wallet?.address) {
      setIsSubmitting(false)
      return
    }
    // 驗證
    if (formData.age && (Number(formData.age) < 13 || Number(formData.age) > 120)) {
      setErrorMsg('Age must be between 13 and 120')
      setIsSubmitting(false)
      return
    }
    if (formData.bio.length > 500) {
      setErrorMsg('Bio must be 500 characters or less')
      setIsSubmitting(false)
      return
    }
    if (formData.x_profile && formData.x_profile.trim() !== '' && !/^https:\/\/(www\.)?(x\.com|twitter\.com)\/[A-Za-z0-9_]+$/.test(formData.x_profile)) {
      setErrorMsg('Invalid X/Twitter profile URL format')
      setIsSubmitting(false)
      return
    }
    if (formData.telegram_profile && formData.telegram_profile.trim() !== '' && !/^https:\/\/(www\.)?t\.me\/[A-Za-z0-9_]+$/.test(formData.telegram_profile)) {
      setErrorMsg('Invalid Telegram profile URL format')
      setIsSubmitting(false)
      return
    }
        // Convert avatar file to base64 if needed
    let avatarBase64 = formData.avatar
    if (avatarFile) {
      try {
        const reader = new FileReader()
        avatarBase64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string
            
            // Check if base64 is too large (smaller limit since we compress to 400px max)
            if (result.length > 800 * 1024) { // 800KB base64 limit for compressed avatars
              reject(new Error('Compressed image is still too large. Please try a smaller image.'))
              return
            }
            
            resolve(result)
          }
          reader.onerror = reject
          reader.readAsDataURL(avatarFile)
        })
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to process avatar image')
        setIsSubmitting(false)
        return
      }
    }
    // 組成 PATCH 結構
    const patchData: any = {
      nickname: formData.nickname,
      profile: {
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender && formData.gender.trim() !== '' ? formData.gender : undefined,
        region: formData.region && formData.region.trim() !== '' ? formData.region : undefined,
        bio: formData.bio && formData.bio.trim() !== '' ? formData.bio : undefined,
        languages: formData.languages && formData.languages.length > 0 ? formData.languages : undefined,
        timezone: formData.timezone && formData.timezone.trim() !== '' ? formData.timezone : undefined,
        avatar: avatarBase64 && avatarBase64.trim() !== '' ? avatarBase64 : undefined,
      },
      social_links: {
        x_profile: formData.x_profile && formData.x_profile.trim() !== '' ? formData.x_profile : undefined,
        telegram_profile: formData.telegram_profile && formData.telegram_profile.trim() !== '' ? formData.telegram_profile : undefined,
      },
    }
    try {

      const updatedUser = await updateUser(currentUser.wallet.address, patchData)
      setUser(updatedUser)
      setIsEditing(false)
      
      // Update avatar preview with saved data
      if (updatedUser.profile?.avatar) {
        setAvatarPreview(updatedUser.profile.avatar)
        setFormData(prev => ({ ...prev, avatar: updatedUser.profile?.avatar || '' }))
      }
      
      // Clear avatar file after successful upload
      setAvatarFile(null)
      
      // Update new user status
      const isUserNew = !updatedUser.profile?.age && !updatedUser.profile?.gender && !updatedUser.profile?.bio
      setIsNewUser(isUserNew)
    } catch (error: any) {

      setErrorMsg(error?.response?.data?.message || 'Error updating user data')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!ready || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to continue</p>
      </div>
    )
  }

  const chartData = user?.chain_data?.distribution ? Object.entries(user.chain_data.distribution).map(([name, value]) => ({
    name,
    value: Number(value),
  })) : []

  // Share Image Design
  const ShareImage = (
    <div
      ref={shareRef}
      style={{ width: 420, background: 'linear-gradient(135deg, #f0fdfa 0%, #fef9c3 100%)', borderRadius: 24, padding: 32, boxSizing: 'border-box', fontFamily: 'inherit', color: '#111827', boxShadow: '0 4px 24px #0001' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        {user?.profile?.avatar || user?.avatarUrl ? (
          <img src={user.profile?.avatar || user.avatarUrl} alt="avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid #22d3ee' }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>?</div>
        )}
        <div>
          <div style={{ fontWeight: 700, fontSize: 22 }}>{user?.nickname || ''}</div>
          <div style={{ color: '#0ea5e9', fontWeight: 600, fontSize: 14, marginTop: 2 }}>
            {(() => {
              const allTags: string[] = []
              
              // Add blockchain tags
              if (user?.tags?.blockchain) {
                if (Array.isArray(user.tags.blockchain)) {
                  allTags.push(...user.tags.blockchain.filter(tag => tag))
                } else if (typeof user.tags.blockchain === 'string') {
                  allTags.push(user.tags.blockchain)
                }
              }
              
              // Add assetType tags  
              if (user?.tags?.assetType) {
                if (Array.isArray(user.tags.assetType)) {
                  allTags.push(...user.tags.assetType.filter(tag => tag))
                } else if (typeof user.tags.assetType === 'string') {
                  allTags.push(user.tags.assetType)
                }
              }
              
              if (allTags.length > 0) {
                return allTags.slice(0, 3).map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ')
              } else {
                return '#VibeMatcher'
              }
            })()}
          </div>
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 20, margin: '16px 0 8px 0', color: '#16a34a' }}>🔥 My Token Vibe</div>
      <div style={{ fontWeight: 500, fontSize: 16, marginBottom: 12 }}>Check out my crypto vibe! 🚀</div>
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <PieChart data={chartData} />
      </div>
      <div style={{ marginTop: 18, textAlign: 'center', color: '#0ea5e9', fontWeight: 700, fontSize: 15 }}>Share your vibe & tag @VibeMatcherApp!</div>
    </div>
  )

  return (
    <div className="bg-gray-50 pt-8 pb-24">
      {/* Share Image block (hidden) */}
      <div style={{ position: 'absolute', left: -9999, top: 0 }}>{ShareImage}</div>
      {/* Share Image Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center relative max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Close X button in top right */}
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600 hover:text-gray-800 z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pr-8">Share Your Vibe</h3>
            
            <div className="w-full flex justify-center mb-6">
              {shareImgUrl ? (
                <img 
                  src={shareImgUrl} 
                  alt="share preview" 
                  className="w-full max-w-[400px] h-auto rounded-2xl shadow-lg"
                />
              ) : (
                <div className="w-[400px] h-[500px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-2xl">
                  <div className="text-center">
                    <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p>Generating your vibe...</p>
                  </div>
                </div>
              )}
            </div>
            
            <button
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
              onClick={() => {
                if (shareImgUrl) {
                  const a = document.createElement('a')
                  a.href = shareImgUrl
                  a.download = `${user?.nickname || 'profile'}-vibe.png`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                }
              }}
            >
              📱 Download for Social Media
            </button>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto px-4">
        {/* New User Welcome Banner - only show if not editing */}
        {isNewUser && !isEditing && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Welcome to VibeMatcher!</h3>
                <p className="text-gray-600 text-sm">Please complete your profile to help others get to know you better. Adding your age, gender, and bio will help us find better matches for you.</p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">?</div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{isEditing ? formData.nickname : user?.nickname || '...'}</h1>
                <p className="text-gray-500 break-words text-sm">{user?.wallet_address}</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-4">
              {errorMsg}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {isEditing ? (
              <div className="space-y-6">
                {/* Header with title and buttons */}
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {isNewUser ? 'Complete Your Profile' : 'Edit Profile'}
                  </h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        // Reset form on cancel
                        const originalAvatar = user?.profile?.avatar || user?.avatarUrl || ''
                        setFormData({
                          nickname: user?.nickname || '',
                          region: user?.profile?.region || user?.region || '',
                          age: (user?.profile?.age ?? user?.age)?.toString() || '',
                          timezone: user?.profile?.timezone || user?.timezone || '',
                          gender: user?.profile?.gender || user?.gender || '',
                          bio: user?.profile?.bio || user?.bio || '',
                          languages: user?.profile?.languages || [],
                          x_profile: user?.social_links?.x_profile || '',
                          telegram_profile: user?.social_links?.telegram_profile || '',
                          avatar: originalAvatar,
                        })
                        setAvatarPreview(originalAvatar)
                        setAvatarFile(null)
                        setErrorMsg('')
                        setIsEditing(false)
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      form="profile-form"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center space-x-2">
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 718-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </span>
                      ) : (
                        isNewUser ? 'Complete Profile' : 'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
                
                <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                  <div className="flex items-center gap-4">
                    <label className={`inline-block cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors ${isProcessingImage ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {isProcessingImage ? (
                        <span className="flex items-center space-x-2">
                          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Processing...</span>
                        </span>
                      ) : (
                        'Choose Avatar'
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isProcessingImage}
                        className="hidden"
                      />
                    </label>
                    <span className="text-gray-700 text-sm ml-2">
                      {isProcessingImage ? 'Compressing image...' : (avatarFile ? avatarFile.name : 'No file chosen')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Images are automatically compressed to reduce file size. Max 10MB, recommended: square images.
                  </p>
                </div>
                <div>
                  <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                    Nickname
                  </label>
                  <input
                    type="text"
                    id="nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <Select
                    id="region"
                    value={countryOptions.find(country => country.value === formData.region)}
                    onChange={(option) => setFormData({ ...formData, region: option?.value || '' })}
                    options={countryOptions}
                    styles={customSelectStyles}
                    placeholder="Select Country"
                    isClearable
                  />
                </div>

                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <Select
                    id="age"
                    value={ageOptions.find(age => age.value === formData.age)}
                    onChange={(option) => setFormData({ ...formData, age: option?.value || '' })}
                    options={ageOptions}
                    styles={customSelectStyles}
                    placeholder="Select Age"
                    isClearable
                  />
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
                    Timezone
                  </label>
                  <Select
                    id="timezone"
                    value={timezoneOptions.find((tz: { value: string; label: string }) => tz.value === formData.timezone)}
                    onChange={(option) => setFormData({ ...formData, timezone: option?.value || '' })}
                    options={timezoneOptions}
                    styles={customSelectStyles}
                    placeholder="Select Timezone"
                    isClearable
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <Select
                    id="gender"
                    value={genderOptions.find(gender => gender.value === formData.gender)}
                    onChange={(option) => setFormData({ ...formData, gender: option?.value || '' })}
                    options={genderOptions}
                    styles={customSelectStyles}
                    placeholder="Select Gender"
                    isClearable
                  />
                </div>

                <div>
                  <label htmlFor="languages" className="block text-sm font-medium text-gray-700 mb-1">
                    Languages
                  </label>
                  <Select
                    id="languages"
                    value={languageOptions.filter(lang => formData.languages.includes(lang.value))}
                    onChange={(options) => setFormData({ ...formData, languages: options ? options.map((o: any) => o.value) : [] })}
                    options={languageOptions}
                    styles={customSelectStyles}
                    placeholder="Select Languages"
                    isMulti
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
                  />
                  <div className="text-xs text-gray-400 text-right">{formData.bio.length}/500</div>
                </div>

                <div>
                  <label htmlFor="x_profile" className="block text-sm font-medium text-gray-700 mb-1">
                    X/Twitter Profile
                  </label>
                  <input
                    type="url"
                    id="x_profile"
                    value={formData.x_profile}
                    onChange={(e) => setFormData({ ...formData, x_profile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
                    placeholder="https://x.com/yourname"
                  />
                </div>

                <div>
                  <label htmlFor="telegram_profile" className="block text-sm font-medium text-gray-700 mb-1">
                    Telegram Profile
                  </label>
                  <input
                    type="url"
                    id="telegram_profile"
                    value={formData.telegram_profile}
                    onChange={(e) => setFormData({ ...formData, telegram_profile: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
                    placeholder="https://t.me/yourname"
                  />
                </div>


              </form>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header with title and edit button */}
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Profile Details</h2>
                  {!isNewUser && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Bio</h3>
                  <p className="text-gray-900">{user?.profile?.bio || user?.bio || '-'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Country</h3>
                  <p className="text-gray-900">{user?.profile?.region ? countries[user.profile.region as keyof typeof countries]?.name : user?.region ? countries[user.region as keyof typeof countries]?.name : '-'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Age</h3>
                  <p className="text-gray-900">{user?.profile?.age || user?.age || '-'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Timezone</h3>
                  <p className="text-gray-900">{user?.profile?.timezone || user?.timezone || '-'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Gender</h3>
                  <p className="text-gray-900">{user?.profile?.gender || user?.gender || '-'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Languages</h3>
                  <p className="text-gray-900">{user?.profile?.languages?.length ? user.profile.languages.join(', ') : '-'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">X/Twitter</h3>
                  <p className="text-gray-900">{user?.social_links?.x_profile || '-'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Telegram</h3>
                  <p className="text-gray-900">{user?.social_links?.telegram_profile || '-'}</p>
                </div>
              </div>
            )}
          </div>

          {chartData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div id="share-chart-area">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Token Distribution</h2>
                
                {/* User Tags Section */}
                {user?.tags && (user.tags.blockchain || user.tags.assetType) && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-500 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.tags.blockchain && Array.isArray(user.tags.blockchain) ? (
                        user.tags.blockchain.map((tag, index) => tag && (
                          <span key={`blockchain-${index}`} className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                            {tag}
                          </span>
                        ))
                      ) : user.tags.blockchain ? (
                        <span className="inline-flex items-center justify-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                          {user.tags.blockchain}
                        </span>
                      ) : null}
                      {user.tags.assetType && Array.isArray(user.tags.assetType) ? (
                        user.tags.assetType.map((tag, index) => tag && (
                          <span key={`asset-${index}`} className="inline-flex items-center justify-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                            {tag}
                          </span>
                        ))
                      ) : user.tags.assetType ? (
                        <span className="inline-flex items-center justify-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full">
                          {user.tags.assetType}
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
                
                <div style={{ height: '300px' }}>
                  <PieChart data={chartData} />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="mt-4">
                {/* Side-by-side buttons */}
                <div className="flex gap-3">
                  {/* Update Assets Button */}
                  <button
                    onClick={handleRefreshAssets}
                    disabled={isRefreshingAssets}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRefreshingAssets ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 04 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        <span>Update Assets</span>
                      </>
                    )}
                  </button>
                  
                  {/* Share Button */}
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-lg shadow-lg hover:from-teal-500 hover:to-cyan-600 transition-all transform hover:scale-105"
                    onClick={async () => {
                      setShowShareModal(true)
                      setShareImgUrl(null)
                      if (!shareRef.current) return

                      try {
                        // Short delay to allow modal to render before capturing
                        await new Promise(resolve => setTimeout(resolve, 100))

                        const dataUrl = await domtoimage.toPng(shareRef.current, {
                          quality: 1,
                          width: 420,
                          height: shareRef.current.offsetHeight,
                        })
                        setShareImgUrl(dataUrl)
                      } catch (err) {
                        console.error('Failed to generate share image:', err)
                        alert('Failed to generate image, please try again')
                        setShowShareModal(false)
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                    <span>Share My Vibe!</span>
                  </button>
                </div>
                
                {/* Message display below buttons */}
                {refreshMessage && (
                  <div className={`mt-3 p-3 rounded-lg text-sm ${
                    refreshMessage.type === 'success' 
                      ? 'bg-green-50 border border-green-200 text-green-700' 
                      : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    {refreshMessage.text}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}