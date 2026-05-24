'use client'

import { X, Heart, Star, RotateCcw } from 'lucide-react'

interface Props {
  onPass: () => void
  onLike: () => void
  onSuperLike: () => void
  onUndo?: () => void
  canUndo?: boolean
}

export function ActionButtons({ onPass, onLike, onSuperLike, onUndo, canUndo }: Props) {
  return (
    <div className="flex items-center justify-center gap-5">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-yellow-500 hover:scale-110 active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
        title="Undo"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
      <button
        onClick={onPass}
        className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-400 hover:text-red-400 hover:scale-110 active:scale-95 transition-all"
      >
        <X className="w-8 h-8 stroke-[2.5]" />
      </button>
      <button
        onClick={onLike}
        className="w-20 h-20 rounded-full bg-gradient-to-br from-[#e8566c] to-[#c93a52] shadow-xl shadow-rose-200 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all"
      >
        <Heart className="w-9 h-9 fill-white" />
      </button>
      <button
        onClick={onSuperLike}
        className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-[#c9a84c] hover:text-[#a88530] hover:scale-110 active:scale-95 transition-all"
      >
        <Star className="w-8 h-8 fill-[#c9a84c]" />
      </button>
    </div>
  )
}
