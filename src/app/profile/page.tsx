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
  { value: 'Other', label: 'Other' },
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
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size too large (max 5MB)')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!currentUser?.wallet?.address) return
    // 驗證
    if (formData.age && (Number(formData.age) < 13 || Number(formData.age) > 120)) {
      setErrorMsg('Age must be between 13 and 120')
      return
    }
    if (formData.bio.length > 500) {
      setErrorMsg('Bio must be 500 characters or less')
      return
    }
    if (formData.x_profile && formData.x_profile.trim() !== '' && !/^https:\/\/(www\.)?(x\.com|twitter\.com)\/[A-Za-z0-9_]+$/.test(formData.x_profile)) {
      setErrorMsg('Invalid X/Twitter profile URL format')
      return
    }
    if (formData.telegram_profile && formData.telegram_profile.trim() !== '' && !/^https:\/\/(www\.)?t\.me\/[A-Za-z0-9_]+$/.test(formData.telegram_profile)) {
      setErrorMsg('Invalid Telegram profile URL format')
      return
    }
    // 上傳頭像
    if (avatarFile) {
      const uploadData = new FormData()
      uploadData.append('avatar', avatarFile)
      try {
        await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${currentUser.wallet.address}/avatar`, uploadData)
      } catch (err: any) {
        setErrorMsg(err?.response?.data?.message || 'Avatar upload failed')
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
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.message || 'Error updating user data')
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
          <div style={{ color: '#0ea5e9', fontWeight: 600, fontSize: 14, marginTop: 2 }}>#VibeMatcher</div>
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
    <div className="min-h-screen bg-gray-50 pt-8 pb-24">
      {/* Share Image block (hidden) */}
      <div style={{ position: 'absolute', left: -9999, top: 0 }}>{ShareImage}</div>
      {/* Share Image Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center">
            <div style={{ background: '#f0fdfa', borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
              {shareImgUrl ? (
                <img src={shareImgUrl} alt="share preview" style={{ width: 420, borderRadius: 24 }} />
              ) : (
                <div className="w-[420px] h-[480px] flex items-center justify-center text-gray-400">Generating...</div>
              )}
            </div>
            <button
              className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
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
              Download Image
            </button>
            <button className="mt-2 text-gray-500 hover:underline" onClick={() => setShowShareModal(false)}>Close</button>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
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
            <button
              onClick={() => {
                if (isEditing) {
                  // Reset form on cancel
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
                    avatar: user?.profile?.avatar || user?.avatarUrl || '',
                  })
                  setAvatarPreview(user?.profile?.avatar || user?.avatarUrl || '')
                  setAvatarFile(null)
                  setErrorMsg('')
                }
                setIsEditing(!isEditing)
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errorMsg && <div className="text-red-500 text-sm">{errorMsg}</div>}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avatar</label>
                  <div className="flex items-center gap-4">
                    <label className="inline-block cursor-pointer px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                      Choose Avatar
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                    <span className="text-gray-700 text-sm ml-2">
                      {avatarFile ? avatarFile.name : 'No file chosen'}
                    </span>
                  </div>
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

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Profile Details</h2>
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
                {user?.tags && (user.tags.blockchain || user.tags.assetType) && (
                  <div>
                    <h3 className="font-medium text-gray-500 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.tags.blockchain && (
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                          {user.tags.blockchain}
                        </span>
                      )}
                      {user.tags.assetType && (
                        <span className="bg-green-100 text-green-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                          {user.tags.assetType}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {chartData.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div id="share-chart-area">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Token Distribution</h2>
                <div style={{ height: '300px' }}>
                  <PieChart data={chartData} />
                </div>
              </div>
              <button
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-lg shadow-lg hover:from-teal-500 hover:to-cyan-600 transition-all transform hover:scale-105"
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
          )}
        </div>
      </div>
    </div>
  )
}