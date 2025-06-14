'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useRouter } from 'next/navigation'
import { User } from '@/types'
import { PieChart } from '@/components/PieChart'
import Select from 'react-select'

// 國家列表
const countries = [
  { value: 'TW', label: 'Taiwan' },
  { value: 'US', label: 'United States' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'SG', label: 'Singapore' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'CN', label: 'China' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'IT', label: 'Italy' },
  { value: 'ES', label: 'Spain' },
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'CA', label: 'Canada' },
  { value: 'BR', label: 'Brazil' },
  { value: 'MX', label: 'Mexico' },
  { value: 'IN', label: 'India' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'TH', label: 'Thailand' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'PH', label: 'Philippines' },
  { value: 'RU', label: 'Russia' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'SA', label: 'Saudi Arabia' },
  { value: 'TR', label: 'Turkey' },
  { value: 'EG', label: 'Egypt' },
  { value: 'IL', label: 'Israel' },
]

// 時區列表
const timezones = [
  { value: 'Asia/Taipei', label: '(GMT+8) Taipei' },
  { value: 'Asia/Tokyo', label: '(GMT+9) Tokyo' },
  { value: 'Asia/Seoul', label: '(GMT+9) Seoul' },
  { value: 'Asia/Singapore', label: '(GMT+8) Singapore' },
  { value: 'Asia/Hong_Kong', label: '(GMT+8) Hong Kong' },
  { value: 'Asia/Shanghai', label: '(GMT+8) Shanghai' },
  { value: 'America/New_York', label: '(GMT-5) New York' },
  { value: 'America/Los_Angeles', label: '(GMT-8) Los Angeles' },
  { value: 'America/Chicago', label: '(GMT-6) Chicago' },
  { value: 'Europe/London', label: '(GMT+0) London' },
  { value: 'Europe/Paris', label: '(GMT+1) Paris' },
  { value: 'Europe/Berlin', label: '(GMT+1) Berlin' },
  { value: 'Europe/Rome', label: '(GMT+1) Rome' },
  { value: 'Europe/Madrid', label: '(GMT+1) Madrid' },
  { value: 'Australia/Sydney', label: '(GMT+10) Sydney' },
  { value: 'Australia/Melbourne', label: '(GMT+10) Melbourne' },
  { value: 'Pacific/Auckland', label: '(GMT+12) Auckland' },
  { value: 'Asia/Kolkata', label: '(GMT+5:30) Mumbai' },
  { value: 'Asia/Jakarta', label: '(GMT+7) Jakarta' },
  { value: 'Asia/Kuala_Lumpur', label: '(GMT+8) Kuala Lumpur' },
  { value: 'Asia/Bangkok', label: '(GMT+7) Bangkok' },
  { value: 'Asia/Ho_Chi_Minh', label: '(GMT+7) Ho Chi Minh' },
  { value: 'Asia/Manila', label: '(GMT+8) Manila' },
  { value: 'Europe/Moscow', label: '(GMT+3) Moscow' },
  { value: 'Africa/Johannesburg', label: '(GMT+2) Johannesburg' },
  { value: 'Asia/Dubai', label: '(GMT+4) Dubai' },
  { value: 'Asia/Riyadh', label: '(GMT+3) Riyadh' },
  { value: 'Europe/Istanbul', label: '(GMT+3) Istanbul' },
  { value: 'Africa/Cairo', label: '(GMT+2) Cairo' },
  { value: 'Asia/Jerusalem', label: '(GMT+2) Jerusalem' },
]

const genders = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
]

const ages = Array.from({ length: 83 }, (_, i) => ({
  value: (i + 18).toString(),
  label: (i + 18).toString(),
}))

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
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!ready) return
    if (!authenticated) {
      router.push('/')
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/users/${currentUser?.wallet?.address}`)
        const data = await response.json()
        setUser(data)
        setFormData({
          nickname: data.nickname || '',
          region: data.region || '',
          age: data.age?.toString() || '',
          timezone: data.timezone || '',
          gender: data.gender || '',
          bio: data.bio || '',
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [currentUser, ready, router, authenticated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser?.wallet?.address) return

    try {
      const response = await fetch(`/api/users/${currentUser.wallet.address}/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: formData.nickname,
          region: formData.region,
          age: formData.age ? Number(formData.age) : undefined,
          timezone: formData.timezone,
          gender: formData.gender,
          bio: formData.bio,
        }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error updating user data:', error)
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

  const chartData = user?.tokenDistribution ? Object.entries(user.tokenDistribution).map(([name, value]) => ({
    name,
    value,
  })) : []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  value={countries.find(country => country.value === formData.region)}
                  onChange={(option) => setFormData({ ...formData, region: option?.value || '' })}
                  options={countries}
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
                  value={ages.find(age => age.value === formData.age)}
                  onChange={(option) => setFormData({ ...formData, age: option?.value || '' })}
                  options={ages}
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
                  value={timezones.find(tz => tz.value === formData.timezone)}
                  onChange={(option) => setFormData({ ...formData, timezone: option?.value || '' })}
                  options={timezones}
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
                  value={genders.find(gender => gender.value === formData.gender)}
                  onChange={(option) => setFormData({ ...formData, gender: option?.value || '' })}
                  options={genders}
                  styles={customSelectStyles}
                  placeholder="Select Gender"
                  isClearable
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900"
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
              <div>
                <h2 className="text-sm font-medium text-gray-500">Wallet Address</h2>
                <p className="mt-1 text-sm text-gray-900 break-all">{currentUser?.wallet?.address}</p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Nickname</h2>
                <p className="mt-1 text-sm text-gray-900">{user?.nickname || 'Not set'}</p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Country</h2>
                <p className="mt-1 text-sm text-gray-900">
                  {countries.find(country => country.value === user?.region)?.label || 'Not set'}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Age</h2>
                <p className="mt-1 text-sm text-gray-900">{user?.age || 'Not set'}</p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Timezone</h2>
                <p className="mt-1 text-sm text-gray-900">
                  {timezones.find(tz => tz.value === user?.timezone)?.label || 'Not set'}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Gender</h2>
                <p className="mt-1 text-sm text-gray-900">{user?.gender || 'Not set'}</p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Bio</h2>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{user?.bio || 'Not set'}</p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500 mb-4">Token Distribution</h2>
                <div className="h-64">
                  <PieChart data={chartData} />
                </div>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Blockchain Tags</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user?.tags?.blockchain?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {(!user?.tags?.blockchain || user.tags.blockchain.length === 0) && (
                    <span className="text-sm text-gray-500">No tags set</span>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-500">Asset Type Tags</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user?.tags?.assetType?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {(!user?.tags?.assetType || user.tags.assetType.length === 0) && (
                    <span className="text-sm text-gray-500">No tags set</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 