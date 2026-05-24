'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { useTranslation } from '@/lib/i18n'
import { useAuth } from '@/components/shared/AuthProvider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, LogOut, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState({ matches: true, messages: true, likes: false, views: false })
  const [privacy, setPrivacy] = useState({ show_online: true, show_distance: true, pause_profile: false })

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const plans = [
    {
      name: t.subscription.free_name, price: t.subscription.free_price,
      features: t.subscription.features_free, tier: 'free',
    },
    {
      name: t.subscription.gold_name, price: '$19.99',
      features: t.subscription.features_gold, tier: 'gold', highlight: true,
    },
    {
      name: t.subscription.platinum_name, price: '$34.99',
      features: t.subscription.features_platinum, tier: 'platinum',
    },
  ]

  const currentTier = user?.profile?.subscription_tier ?? 'free'

  return (
    <div>
      <AppHeader title={t.settings.title} />
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <Tabs defaultValue="account">
          <TabsList className="w-full mb-6 bg-gray-100 rounded-2xl p-1">
            <TabsTrigger value="account" className="flex-1 rounded-xl">{t.settings.account}</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 rounded-xl">{t.settings.notifications}</TabsTrigger>
            <TabsTrigger value="privacy" className="flex-1 rounded-xl">{t.settings.privacy}</TabsTrigger>
            <TabsTrigger value="subscription" className="flex-1 rounded-xl">{t.settings.subscription}</TabsTrigger>
          </TabsList>

          {/* Account */}
          <TabsContent value="account" className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4">
              <div>
                <Label className="text-xs text-gray-400 uppercase tracking-wide">{t.settings.email}</Label>
                <p className="font-medium text-[#1a3a5c] mt-1">{user?.email ?? 'user@example.com'}</p>
              </div>
              <Separator />
              <Button variant="outline" className="w-full rounded-2xl justify-start text-[#1a3a5c]">
                {t.settings.change_password}
              </Button>
              <Button asChild variant="outline" className="w-full rounded-2xl justify-start text-[#1a3a5c]">
                <Link href="/profile/me">
                  {t.profile.edit_profile}
                </Link>
              </Button>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-3">
              <Button
                variant="ghost"
                className="w-full rounded-2xl justify-start text-[#e8566c] hover:text-[#c93a52] hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 me-3" />
                {t.settings.logout}
              </Button>
              <Button
                variant="ghost"
                className="w-full rounded-2xl justify-start text-red-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 me-3" />
                {t.settings.delete_account}
              </Button>
            </div>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4">
              {[
                { key: 'matches' as const, label: t.settings.notify_matches },
                { key: 'messages' as const, label: t.settings.notify_messages },
                { key: 'likes' as const, label: t.settings.notify_likes },
                { key: 'views' as const, label: t.settings.notify_views },
              ].map(({ key, label }, i, arr) => (
                <div key={key}>
                  <div className="flex items-center justify-between py-1">
                    <Label>{label}</Label>
                    <Switch
                      checked={notifications[key]}
                      onCheckedChange={v => setNotifications(n => ({ ...n, [key]: v }))}
                    />
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Privacy */}
          <TabsContent value="privacy" className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-gray-100 space-y-4">
              {[
                { key: 'show_online' as const, label: t.settings.show_online },
                { key: 'show_distance' as const, label: t.settings.show_distance },
                { key: 'pause_profile' as const, label: t.settings.pause_profile },
              ].map(({ key, label }, i, arr) => (
                <div key={key}>
                  <div className="flex items-center justify-between py-1">
                    <Label>{label}</Label>
                    <Switch
                      checked={privacy[key]}
                      onCheckedChange={v => setPrivacy(p => ({ ...p, [key]: v }))}
                    />
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Subscription */}
          <TabsContent value="subscription" className="space-y-4">
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                {t.settings.current_plan}: <span className="font-bold text-[#1a3a5c]">
                  {currentTier === 'gold' ? t.subscription.gold_name : currentTier === 'platinum' ? t.subscription.platinum_name : t.subscription.free_name}
                </span>
              </p>

              {plans.map(plan => {
                const isCurrent = plan.tier === currentTier
                return (
                  <div
                    key={plan.tier}
                    className={`bg-white rounded-3xl p-5 border-2 transition-all ${
                      isCurrent ? 'border-[#c9a84c]' : plan.highlight ? 'border-[#1a3a5c]/20' : 'border-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#1a3a5c]">{plan.name}</h3>
                          {isCurrent && <Badge className="bg-[#c9a84c] text-white border-0 text-xs">{t.settings.current_plan}</Badge>}
                        </div>
                        <p className="text-2xl font-bold text-[#1a3a5c] mt-1">
                          {plan.price}
                          {plan.price !== t.subscription.free_price && <span className="text-sm font-normal text-gray-400">{t.common.per_month}</span>}
                        </p>
                      </div>
                      {plan.highlight && <Crown className="w-7 h-7 text-[#c9a84c] fill-[#c9a84c]" />}
                    </div>

                    <ul className="space-y-2 mb-4">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {!isCurrent && (
                      <Button className={`w-full rounded-2xl font-bold ${plan.highlight ? 'bg-[#1a3a5c] text-white' : 'bg-gray-100 text-[#1a3a5c]'}`}>
                        {t.settings.upgrade_to} {plan.name}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
