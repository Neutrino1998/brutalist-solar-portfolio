import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const SIGNAL_DECODE_GLYPHS = ['#', '0', '1', 'X', '/', '\\', '[', ']', '+', '-'] as const

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function decodeSignalFrame(target: string, progress: number, tick: number) {
  if (progress >= 1) return target
  if (progress <= 0) return '#'

  const visibleLength = Math.min(
    target.length,
    Math.max(1, Math.ceil(progress * target.length * 2.2)),
  )
  const lockedLength = Math.min(
    visibleLength,
    Math.floor((progress ** 1.65) * target.length),
  )

  return Array.from({ length: visibleLength }, (_, index) => {
    if (index < lockedLength) return target[index]
    return SIGNAL_DECODE_GLYPHS[(tick + index * 3) % SIGNAL_DECODE_GLYPHS.length]
  }).join('')
}
