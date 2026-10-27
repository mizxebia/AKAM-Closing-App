// A palette of muted, professional tones that sit well against the app's
// cream/tan background — deliberately avoids bright/saturated colors that
// would clash with the rest of the enterprise theme. Exported so charts
// (e.g. the User Activity pie chart) can reuse the same per-name colors
// as the avatars shown elsewhere.
export const AVATAR_PALETTE = [
  '#1E3A47', // teal (brand)
  '#8B5E3C', // warm brown
  '#4A6FA5', // dusty blue
  '#6B7F5E', // sage
  '#8B3A2A', // terracotta
  '#6B5B8A', // plum
  '#7A6A4F', // olive/khaki
  '#2d5468', // lighter teal
]

export function getInitials(name?: string | null): string {
  const trimmed = name?.trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) {
    return (
      parts[0][0] + parts[parts.length - 1][0]
    ).toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase()
}

export function getColorForName(name?: string | null): string {
  const key = name?.trim() || '?'
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length]
}
