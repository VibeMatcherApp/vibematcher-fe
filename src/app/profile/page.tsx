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

// 生成年齡選項 (18-100)
const ageOptions = Array.from({ length: 83 }, (_, i) => ({
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
      if (!currentUser?.wallet?.address) return
      try {
        const data = await getUser(currentUser.wallet.address)
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
      const updatedData = {
        nickname: formData.nickname,
        // region: formData.region,
        // age: formData.age ? Number(formData.age) : undefined,
        // timezone: formData.timezone,
        // gender: formData.gender,
        // bio: formData.bio,
      }
      const updatedUser = await updateUser(currentUser.wallet.address, updatedData)
      setUser(updatedUser)
      setIsEditing(false)
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

  const chartData = user?.chain_data?.distribution ? Object.entries(user.chain_data.distribution).map(([name, value]) => ({
    name,
    value: Number(value),
  })) : []

  return (
    <div className="min-h-screen bg-gray-50 pt-8 pb-24">
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <h3 className="font-medium text-gray-500">Nickname</h3>
                  <p className="text-gray-900">{user?.nickname || '-'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Wallet Address</h3>
                  <p className="text-gray-900 break-words">{user?.wallet_address}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Bio</h3>
                  <p className="text-gray-900">{user?.bio || '-'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Country</h3>
                  <p className="text-gray-900">{user?.region ? countries[user.region as keyof typeof countries]?.name : '-'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Age</h3>
                  <p className="text-gray-900">{user?.age || '-'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Timezone</h3>
                  <p className="text-gray-900">{user?.timezone || '-'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Gender</h3>
                  <p className="text-gray-900">{user?.gender || '-'}</p>
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">Token Distribution</h2>
              <div style={{ height: '300px' }}>
                <PieChart data={chartData} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}