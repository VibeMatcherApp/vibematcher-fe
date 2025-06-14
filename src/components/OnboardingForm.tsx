'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import { countries } from 'countries-list'
import moment from 'moment-timezone'
import Select from 'react-select'

const countryOptions = Object.entries(countries).map(([code, country]) => ({
  value: code,
  label: country.name
}))

const timezoneOptions = moment.tz.names().map((tz: string) => ({
    value: tz,
    label: `${tz} (GMT${moment.tz(tz).format('Z')})`
}))

const ageOptions = Array.from({ length: 83 }, (_, i) => ({
  value: (i + 18).toString(),
  label: (i + 18).toString(),
}))

const genderOptions = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' }
]

const relationshipGoalOptions = [
  { value: 'long-term', label: 'Long-term relationship' },
  { value: 'casual', label: 'Casual dating' },
  { value: 'friendship', label: 'Friendship' },
  { value: 'marriage', label: 'Marriage' }
]

const interestOptions = [
  { value: 'crypto', label: 'Cryptocurrency' },
  { value: 'defi', label: 'DeFi' },
  { value: 'nft', label: 'NFTs' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'art', label: 'Art' },
  { value: 'music', label: 'Music' },
  { value: 'tech', label: 'Technology' },
  { value: 'travel', label: 'Travel' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'food', label: 'Food & Cooking' },
  { value: 'reading', label: 'Reading' },
  { value: 'movies', label: 'Movies' },
  { value: 'photography', label: 'Photography' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'sports', label: 'Sports' }
]

const lookingForOptions = [
  { value: 'friends', label: 'Friends' },
  { value: 'dating', label: 'Dating' },
  { value: 'networking', label: 'Networking' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'business', label: 'Business Partners' }
]

const dealBreakerOptions = [
  { value: 'smoking', label: 'Smoking' },
  { value: 'drinking', label: 'Heavy Drinking' },
  { value: 'drugs', label: 'Drug Use' },
  { value: 'politics', label: 'Different Political Views' },
  { value: 'religion', label: 'Different Religious Views' },
  { value: 'dishonesty', label: 'Dishonesty' },
  { value: 'rudeness', label: 'Rudeness' }
]

interface OnboardingFormProps {
  onSubmit: (data: any) => void;
  availableInterests: { id: string; name: string }[];
  availableVibes: { id: string; name: string }[];
}

const OnboardingForm: React.FC<OnboardingFormProps> = ({ onSubmit, availableInterests, availableVibes }) => {
  const router = useRouter()
  const { user } = usePrivy()
  const [formData, setFormData] = useState({
    username: '',
    gender: 'other',
    looking_for: 'other',
    birth_date: '',
    country: '',
    timezone: '',
    interests: [] as string[],
    vibes: [] as string[],
    nickname: '',
    age: '',
    bio: '',
    relationshipGoal: '',
    dealBreakers: [] as string[],
    socialMedia: {
      twitter: '',
      instagram: '',
      discord: ''
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          walletAddress: user.wallet?.address,
          ...formData
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit onboarding data')
      }

      router.push('/discover')
    } catch (error) {
      console.error('Error submitting onboarding data:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Profile</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nickname</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <select
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              >
                <option value="">Select age</option>
                {ageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              >
                <option value="">Select gender</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">Country</label>
              <Select
                id="country"
                value={countryOptions.find(c => c.value === formData.country)}
                onChange={(option) => setFormData({ ...formData, country: option?.value || '' })}
                options={countryOptions}
                className="mt-1"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">Timezone</label>
              <Select
                id="timezone"
                value={timezoneOptions.find((tz: { value: string; label: string }) => tz.value === formData.timezone)}
                onChange={(option) => setFormData({ ...formData, timezone: option?.value || '' })}
                options={timezoneOptions}
                className="mt-1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Interests</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {interestOptions.map((option) => (
                  <label key={option.value} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.interests.includes(option.value)}
                      onChange={(e) => {
                        const newInterests = e.target.checked
                          ? [...formData.interests, option.value]
                          : formData.interests.filter(i => i !== option.value)
                        setFormData({ ...formData, interests: newInterests })
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                rows={4}
                placeholder="Tell us about yourself..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Looking For</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {lookingForOptions.map((option) => (
                  <label key={option.value} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.looking_for === option.value}
                      onChange={(e) => setFormData({ ...formData, looking_for: option.value })}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Relationship Goal</label>
              <select
                value={formData.relationshipGoal}
                onChange={(e) => setFormData({ ...formData, relationshipGoal: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                required
              >
                <option value="">Select goal</option>
                {relationshipGoalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Deal Breakers</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {dealBreakerOptions.map((option) => (
                  <label key={option.value} className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.dealBreakers.includes(option.value)}
                      onChange={(e) => {
                        const newDealBreakers = e.target.checked
                          ? [...formData.dealBreakers, option.value]
                          : formData.dealBreakers.filter(i => i !== option.value)
                        setFormData({ ...formData, dealBreakers: newDealBreakers })
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Social Media (Optional)</label>
              <div className="space-y-3 mt-2">
                <input
                  type="text"
                  placeholder="Twitter handle (without @)"
                  value={formData.socialMedia.twitter}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, twitter: e.target.value }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Instagram handle (without @)"
                  value={formData.socialMedia.instagram}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, instagram: e.target.value }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
                <input
                  type="text"
                  placeholder="Discord username"
                  value={formData.socialMedia.discord}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, discord: e.target.value }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Complete Profile
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default OnboardingForm 