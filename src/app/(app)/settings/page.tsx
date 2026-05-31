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
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Check, Crown, LogOut, Trash2, Plane } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user, logout, updateProfile } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState({ matches: true, messages: true, likes: false, views: false })
  const [privacy, setPrivacy] = useState({ show_online: true, show_distance: true, pause_profile: false })
  const [flightMode, setFlightMode] = useState(user?.profile?.flight_mode_active ?? false)
  const [flightCity, setFlightCity] = useState(user?.profile?.flight_mode_city ?? '')
  const [savingFlight, setSavingFlight] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleFlightSave = async () => {
    setSavingFlight(true)
    try {
      await updateProfile({
        flight_mode_active: flightMode,
        flight_mode_city: flightMode ? flightCity : '',
      })
      toast.success(flightMode ? `מצב טיסה פעיל — ${flightCity}` : 'מצב טיסה כובה')
    } catch {
      toast.error('שגיאה בשמירה')
    } finally {
      setSavingFlight(false)
    }
  }

  const plans = [
    { name: t.subscription.free_name, price: t.subscription.free_price, features: t.subscription.features_free, tier: 'free' },
    { name: t.subscription.gold_name, price: '$19.99', features: t.subscription.features_gold, tier: 'gold', highlight: true },
    { name: t.subscription.platinum_name, price: '$34.99', features: t.subscription.features_platinum, tier: 'platinum' },
  ]

  const currentTier = user?.profile?.subscription_tier ?? 'free'

  return (
    <div>
      <AppHeader title={t.settings.title} />
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <Tabs defaultValue="account">
          <TabsList className="w-full mb-6 bg-[#F5F5F5] rounded-2xl p-1">
            <TabsTrigger value="account" className="flex-1 rounded-xl text-xs">{t.settings.account}</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 rounded-xl text-xs">{t.settings.notifications}</TabsTrigger>
            <TabsTrigger value="privacy" className="flex-1 rounded-xl text-xs">{t.settings.privacy}</TabsTrigger>
            <TabsTrigger value="subscription" className="flex-1 rounded-xl text-xs">{t.settings.subscription}</TabsTrigger>
          </TabsList>

          {/* Account */}
          <TabsContent value="account" className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-4">
              <div>
                <Label className="text-xs text-[#A3A3A3] uppercase tracking-wide">{t.settings.email}</Label>
                <p className="font-medium text-[#0A0A0A] mt-1">{user?.email ?? 'user@example.com'}</p>
              </div>
              <Separator className="bg-[#E5E5E5]" />
              <Button variant="outline" className="w-full rounded-2xl justify-start border-[#E5E5E5] text-[#0A0A0A]">
                {t.settings.change_password}
              </Button>
              <Button asChild variant="outline" className="w-full rounded-2xl justify-start border-[#E5E5E5] text-[#0A0A0A]">
                <Link href="/profile/me">
                  {t.profile.edit_profile}
                </Link>
              </Button>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-3">
              <Button
                variant="ghost"
                className="w-full rounded-2xl justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
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
            <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-4">
              {[
                { key: 'matches' as const, label: t.settings.notify_matches },
                { key: 'messages' as const, label: t.settings.notify_messages },
                { key: 'likes' as const, label: t.settings.notify_likes },
                { key: 'views' as const, label: t.settings.notify_views },
              ].map(({ key, label }, i, arr) => (
                <div key={key}>
                  <div className="flex items-center justify-between py-1">
                    <Label className="text-[#0A0A0A]">{label}</Label>
                    <Switch
                      checked={notifications[key]}
                      onCheckedChange={v => setNotifications(n => ({ ...n, [key]: v }))}
                    />
                  </div>
                  {i < arr.length - 1 && <Separator className="bg-[#E5E5E5]" />}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Privacy */}
          <TabsContent value="privacy" className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5] space-y-4">
              {[
                { key: 'show_online' as const, label: t.settings.show_online },
                { key: 'show_distance' as const, label: t.settings.show_distance },
                { key: 'pause_profile' as const, label: t.settings.pause_profile },
              ].map(({ key, label }, i, arr) => (
                <div key={key}>
                  <div className="flex items-center justify-between py-1">
                    <Label className="text-[#0A0A0A]">{label}</Label>
                    <Switch
                      checked={privacy[key]}
                      onCheckedChange={v => setPrivacy(p => ({ ...p, [key]: v }))}
                    />
                  </div>
                  {i < arr.length - 1 && <Separator className="bg-[#E5E5E5]" />}
                </div>
              ))}
            </div>

            {/* Flight Mode */}
            <div className="bg-white rounded-3xl p-5 border border-[#E5E5E5]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#F5F5F5] rounded-2xl flex items-center justify-center">
                  <Plane className="w-5 h-5 text-[#0A0A0A]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#0A0A0A] text-sm">מצב טיסה ✈️</p>
                      <p className="text-xs text-[#A3A3A3]">הצג מיקום אחר בפרופיל שלך</p>
                    </div>
                    <Switch
                      checked={flightMode}
                      onCheckedChange={setFlightMode}
                    />
                  </div>
                </div>
              </div>

              {flightMode && (
                <div className="mt-4 space-y-3">
                  <div className="bg-[#F5F5F5] rounded-2xl p-3 text-xs text-[#737373]">
                    כשמצב טיסה פעיל, הפרופיל שלך יציג את המיקום שתבחר ויופיע
                    <strong className="text-[#0A0A0A]"> badge מיוחד</strong> שמציין מצב טיסה.
                    משתמשים יבינו שאתה גולש ממיקום אחר.
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[#0A0A0A]">מיקום למצב טיסה</label>
                    <Input
                      value={flightCity}
                      onChange={e => setFlightCity(e.target.value)}
                      placeholder="לוס אנג׳לס, ניו יורק, פריז..."
                      className="h-11 rounded-2xl border-[#E5E5E5]"
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleFlightSave}
                disabled={savingFlight || (flightMode && !flightCity.trim())}
                className="w-full mt-4 bg-[#0A0A0A] hover:bg-[#222] text-white rounded-2xl h-10 font-medium"
              >
                {savingFlight ? 'שומר...' : 'שמור הגדרות'}
              </Button>
            </div>
          </TabsContent>

          {/* Subscription */}
          <TabsContent value="subscription" className="space-y-4">
            <p className="text-sm text-[#737373]">
              {t.settings.current_plan}:{' '}
              <span className="font-bold text-[#0A0A0A]">
                {currentTier === 'gold' ? t.subscription.gold_name
                  : currentTier === 'platinum' ? t.subscription.platinum_name
                  : t.subscription.free_name}
              </span>
            </p>

            {plans.map(plan => {
              const isCurrent = plan.tier === currentTier
              return (
                <div
                  key={plan.tier}
                  className={`bg-white rounded-3xl p-5 border-2 transition-all ${
                    isCurrent ? 'border-[#0A0A0A]' : 'border-[#E5E5E5] hover:border-[#A3A3A3]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#0A0A0A]">{plan.name}</h3>
                        {isCurrent && <Badge className="bg-[#0A0A0A] text-white border-0 text-xs">{t.settings.current_plan}</Badge>}
                      </div>
                      <p className="text-2xl font-bold text-[#0A0A0A] mt-1">
                        {plan.price}
                        {plan.price !== t.subscription.free_price && (
                          <span className="text-sm font-normal text-[#A3A3A3]">{t.common.per_month}</span>
                        )}
                      </p>
                    </div>
                    {plan.highlight && <Crown className="w-7 h-7 text-[#0A0A0A]" />}
                  </div>

                  <ul className="space-y-2 mb-4">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-[#737373]">
                        <Check className="w-4 h-4 text-[#0A0A0A] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {!isCurrent && (
                    <Button className="w-full rounded-2xl font-bold bg-[#0A0A0A] text-white hover:bg-[#222]">
                      {t.settings.upgrade_to} {plan.name}
                    </Button>
                  )}
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
