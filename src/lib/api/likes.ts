import { createClient } from '@/lib/supabase/client'
import type { DbLike, DbProfile, DbPhoto } from '@/lib/types/database'

type R<T> = { data: T | null; error: { message: string } | null }

export async function fetchLikesReceived(userId: string): Promise<{ like: DbLike; profile: DbProfile; photos: DbPhoto[] }[]> {
  const supabase = createClient()

  const { data: likes } = await supabase
    .from('likes')
    .select('*')
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false }) as unknown as R<DbLike[]>

  if (!likes?.length) return []

  const fromIds = likes.map(l => l.from_user_id)
  const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', fromIds) as unknown as R<DbProfile[]>
  const { data: photos } = await supabase.from('photos').select('*').in('user_id', fromIds) as unknown as R<DbPhoto[]>

  return likes
    .map(like => {
      const profile = (profiles ?? []).find(p => p.user_id === like.from_user_id)
      if (!profile) return null
      return { like, profile, photos: (photos ?? []).filter(ph => ph.user_id === like.from_user_id) }
    })
    .filter(Boolean) as { like: DbLike; profile: DbProfile; photos: DbPhoto[] }[]
}

export async function fetchLikesSent(userId: string): Promise<{ like: DbLike; profile: DbProfile; photos: DbPhoto[] }[]> {
  const supabase = createClient()

  const { data: likes } = await supabase
    .from('likes')
    .select('*')
    .eq('from_user_id', userId)
    .order('created_at', { ascending: false }) as unknown as R<DbLike[]>

  if (!likes?.length) return []

  const toIds = likes.map(l => l.to_user_id)
  const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', toIds) as unknown as R<DbProfile[]>
  const { data: photos } = await supabase.from('photos').select('*').in('user_id', toIds) as unknown as R<DbPhoto[]>

  return likes
    .map(like => {
      const profile = (profiles ?? []).find(p => p.user_id === like.to_user_id)
      if (!profile) return null
      return { like, profile, photos: (photos ?? []).filter(ph => ph.user_id === like.to_user_id) }
    })
    .filter(Boolean) as { like: DbLike; profile: DbProfile; photos: DbPhoto[] }[]
}

export async function sendLike(fromUserId: string, toUserId: string, isSuperLike = false): Promise<void> {
  const supabase = createClient()
  await supabase.from('likes').upsert(
    { from_user_id: fromUserId, to_user_id: toUserId, is_super_like: isSuperLike } as never,
    { onConflict: 'from_user_id,to_user_id' }
  )
}

export async function removeLike(fromUserId: string, toUserId: string): Promise<void> {
  const supabase = createClient()
  await (supabase.from('likes').delete() as unknown as { eq: (col: string, val: string) => { eq: (col: string, val: string) => Promise<void> } })
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId)
}

export async function isLiked(fromUserId: string, toUserId: string): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('likes')
    .select('id')
    .eq('from_user_id', fromUserId)
    .eq('to_user_id', toUserId)
    .maybeSingle() as unknown as R<{ id: string }>
  return !!data
}
