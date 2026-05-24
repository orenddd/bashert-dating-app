'use client'

import { useAuth } from './AuthProvider'
import { useTranslation } from '@/lib/i18n'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Crown } from 'lucide-react'
import { useState } from 'react'
import type { SubscriptionTier } from '@/lib/types/database'

const tierOrder: SubscriptionTier[] = ['free', 'gold', 'platinum']

interface Props {
  requiredTier: SubscriptionTier
  feature?: string
  children: React.ReactNode
}

export function PremiumGate({ requiredTier, feature, children }: Props) {
  const { user } = useAuth()
  const { t } = useTranslation()
  const [showDialog, setShowDialog] = useState(false)

  const userTier = user?.profile?.subscription_tier ?? 'free'
  const hasAccess = tierOrder.indexOf(userTier) >= tierOrder.indexOf(requiredTier)

  if (hasAccess) return <>{children}</>

  return (
    <>
      <div onClick={() => setShowDialog(true)} className="cursor-pointer">
        <div className="pointer-events-none opacity-60 relative">
          {children}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
            <Crown className="text-yellow-400 w-8 h-8" />
          </div>
        </div>
      </div>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="text-yellow-500 w-5 h-5" />
              {t.settings.upgrade_to} {requiredTier === 'gold' ? t.subscription.gold_name : t.subscription.platinum_name}
            </DialogTitle>
            <DialogDescription>
              {feature ? `${feature} — ` : ''}
              {t.common.upgrade}
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700">
            <Crown className="w-4 h-4 me-2" />
            {t.common.upgrade}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
