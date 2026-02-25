'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import { Link } from '@/i18n/navigation'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Package, LogOut, LogIn, UserPlus } from 'lucide-react'
import { signOutAction } from '@/app/actions'
import { CurrencyIndicator } from './currency-indicator'
import LocaleSwitcher from './locale-switcher'

type Props = {
  onClose: () => void
}

export function MobileAuthSection({ onClose }: Props) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="px-3 py-3 space-y-2">
        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        <div className="h-9 w-full rounded-lg bg-muted animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {user ? (
        <>
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="text-xs bg-primary/20 text-primary font-semibold">
                {user.email?.charAt(0).toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold">Account</span>
              <span className="text-xs text-muted-foreground truncate">{user.email}</span>
            </div>
          </div>

          <Link
            href="/orders"
            onClick={onClose}
            className="flex items-center justify-between px-3 py-2.5 text-sm text-foreground/90 hover:text-foreground hover:bg-accent/40 rounded-lg transition-colors"
          >
            My Orders
            <Package className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Separator className="my-3" />

          <div className="flex items-center justify-between px-3 py-2 rounded-lg">
            <span className="text-sm text-foreground/75">Language</span>
            <LocaleSwitcher />
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-lg">
            <span className="text-sm text-foreground/75">Currency</span>
            <CurrencyIndicator variant="full" />
          </div>

          <Separator className="my-3" />

          <form action={signOutAction} className="px-1">
            <Button
              type="submit"
              variant="ghost"
              className="w-full justify-between text-red-500 hover:text-red-500 hover:bg-red-500/10"
            >
              Log out
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </>
      ) : (
        <>
          <div className="px-1 space-y-2 pb-1">
            <Button asChild className="w-full">
              <Link href="/auth/login" onClick={onClose}>
                <LogIn className="h-4 w-4 mr-2" />
                Sign in
              </Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/auth/sign-up" onClick={onClose}>
                <UserPlus className="h-4 w-4 mr-2" />
                Sign up
              </Link>
            </Button>
          </div>

          <Separator className="my-3" />

          <div className="flex items-center justify-between px-3 py-2 rounded-lg">
            <span className="text-sm text-foreground/75">Language</span>
            <LocaleSwitcher />
          </div>
          <div className="flex items-center justify-between px-3 py-2 rounded-lg">
            <span className="text-sm text-foreground/75">Currency</span>
            <CurrencyIndicator variant="full" />
          </div>
        </>
      )}
    </div>
  )
}
