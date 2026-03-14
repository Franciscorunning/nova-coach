import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/stores/auth';
import { profileUpdateSchema, type ProfileUpdateData } from '@/types/forms';
import type { UserProfile } from '@/types/database';
import { getStravaAuthUrl } from '@/utils/strava';
import { getStripe, SUBSCRIPTION_PRICES, formatPrice } from '@/utils/stripe';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';

const tabItems = [
  { id: 'profile', label: 'Profile' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'subscription', label: 'Subscription' },
];

export default function SettingsPage() {
  const { user, profile, updateProfile, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isConnectingStrava, setIsConnectingStrava] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileUpdateData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      weight: profile?.weight ?? undefined,
      target_plan: profile?.target_plan ?? undefined,
    },
  });

  const onSaveProfile = async (data: ProfileUpdateData) => {
    try {
      await updateProfile(data as Partial<UserProfile>);
    } catch {
      // Error handled in store
    }
  };

  const handleConnectStrava = () => {
    setIsConnectingStrava(true);
    window.location.href = getStravaAuthUrl();
  };

  const handleUpgrade = async (priceType: 'monthly' | 'yearly') => {
    setIsUpgrading(true);
    try {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe not loaded');
      }
      // In production, create a Checkout Session via Edge Function
      // and redirect to Stripe Checkout
      console.info('Stripe upgrade flow:', priceType);
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Tab navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabItems.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                pb-3 text-sm font-medium transition-colors border-b-2
                ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile tab */}
      {activeTab === 'profile' && (
        <Card title="Profile Information">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-500">Email</div>
            <div className="font-medium text-gray-900">{user?.email}</div>
          </div>
          <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              error={errors.weight?.message}
              {...register('weight', { valueAsNumber: true })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Training Plan</label>
              <select
                className="input"
                {...register('target_plan')}
              >
                <option value="galloway">Galloway Method</option>
                <option value="15km">15km Program</option>
                <option value="semi">Semi-Marathon</option>
              </select>
            </div>
            <Button type="submit" isLoading={isLoading}>Save Changes</Button>
          </form>
        </Card>
      )}

      {/* Integrations tab */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <Card title="Strava Integration">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mt-1">
                  Connect Strava to automatically sync your running activities.
                </p>
                {profile?.strava_athlete_id ? (
                  <div className="mt-2 text-sm text-success-600 font-medium">
                    ✅ Connected (Athlete #{profile.strava_athlete_id})
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-gray-400">Not connected</div>
                )}
              </div>
              <Button
                variant={profile?.strava_athlete_id ? 'secondary' : 'primary'}
                onClick={handleConnectStrava}
                isLoading={isConnectingStrava}
                style={{ backgroundColor: profile?.strava_athlete_id ? undefined : '#FC4C02', borderColor: '#FC4C02' }}
              >
                {profile?.strava_athlete_id ? 'Reconnect' : 'Connect Strava'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Subscription tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">Current Plan</div>
                <div className="text-sm text-gray-500 capitalize mt-1">{profile?.subscription_status ?? 'free'}</div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile?.subscription_status === 'premium'
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {profile?.subscription_status === 'premium' ? 'Premium' : 'Free'}
              </span>
            </div>
          </div>

          {profile?.subscription_status !== 'premium' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(Object.entries(SUBSCRIPTION_PRICES) as [string, typeof SUBSCRIPTION_PRICES[keyof typeof SUBSCRIPTION_PRICES]][]).map(([key, price]) => (
                <div key={key} className="p-5 rounded-xl border-2 border-gray-200 hover:border-primary-300 transition-colors">
                  <div className="font-semibold text-gray-900">{price.label}</div>
                  <div className="text-2xl font-bold text-primary-600 my-2">
                    {formatPrice(price.amount)}
                    <span className="text-sm font-normal text-gray-500">/{price.interval}</span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1 mb-4">
                    <li>✅ Unlimited training plans</li>
                    <li>✅ Advanced statistics</li>
                    <li>✅ Strava sync</li>
                    <li>✅ Nutrition recommendations</li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => void handleUpgrade(key as 'monthly' | 'yearly')}
                    isLoading={isUpgrading}
                  >
                    Upgrade to Premium
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
