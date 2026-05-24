import type { DbLike } from '@/lib/types/database'
import { CURRENT_USER_ID } from './mock-profiles'

export const MOCK_LIKES_RECEIVED: DbLike[] = [
  { id: 'like-r-001', from_user_id: 'user-008', to_user_id: CURRENT_USER_ID, is_super_like: false, created_at: '2024-09-10T10:00:00Z' },
  { id: 'like-r-002', from_user_id: 'user-010', to_user_id: CURRENT_USER_ID, is_super_like: true,  created_at: '2024-09-12T08:30:00Z' },
  { id: 'like-r-003', from_user_id: 'user-012', to_user_id: CURRENT_USER_ID, is_super_like: false, created_at: '2024-09-14T15:00:00Z' },
  { id: 'like-r-004', from_user_id: 'user-016', to_user_id: CURRENT_USER_ID, is_super_like: false, created_at: '2024-09-17T11:00:00Z' },
  { id: 'like-r-005', from_user_id: 'user-018', to_user_id: CURRENT_USER_ID, is_super_like: false, created_at: '2024-09-20T09:00:00Z' },
  { id: 'like-r-006', from_user_id: 'user-020', to_user_id: CURRENT_USER_ID, is_super_like: true,  created_at: '2024-09-22T14:00:00Z' },
]

export const MOCK_LIKES_SENT: DbLike[] = [
  { id: 'like-s-001', from_user_id: CURRENT_USER_ID, to_user_id: 'user-001', is_super_like: false, created_at: '2024-09-01T10:00:00Z' },
  { id: 'like-s-002', from_user_id: CURRENT_USER_ID, to_user_id: 'user-003', is_super_like: false, created_at: '2024-09-05T10:00:00Z' },
  { id: 'like-s-003', from_user_id: CURRENT_USER_ID, to_user_id: 'user-005', is_super_like: true,  created_at: '2024-09-09T10:00:00Z' },
  { id: 'like-s-004', from_user_id: CURRENT_USER_ID, to_user_id: 'user-007', is_super_like: false, created_at: '2024-09-14T10:00:00Z' },
  { id: 'like-s-005', from_user_id: CURRENT_USER_ID, to_user_id: 'user-011', is_super_like: false, created_at: '2024-09-19T10:00:00Z' },
]

let nextLikeId = 200
export function mockLikeUser(toUserId: string, isSuperLike = false): DbLike {
  const like: DbLike = {
    id: `like-${++nextLikeId}`,
    from_user_id: CURRENT_USER_ID,
    to_user_id: toUserId,
    is_super_like: isSuperLike,
    created_at: new Date().toISOString(),
  }
  MOCK_LIKES_SENT.push(like)
  return like
}

export function mockUnlikeUser(toUserId: string) {
  const idx = MOCK_LIKES_SENT.findIndex(l => l.to_user_id === toUserId && l.from_user_id === CURRENT_USER_ID)
  if (idx >= 0) MOCK_LIKES_SENT.splice(idx, 1)
}

export function isLikedByCurrentUser(toUserId: string): boolean {
  return MOCK_LIKES_SENT.some(l => l.to_user_id === toUserId && l.from_user_id === CURRENT_USER_ID)
}
