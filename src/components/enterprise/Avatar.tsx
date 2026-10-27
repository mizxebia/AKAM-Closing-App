import { getColorForName, getInitials } from './avatarColors'

const SIZE_CLASSES = {
  xs: 'size-5 text-[9px]',
  sm: 'size-6 text-[10px]',
  md: 'size-8 text-xs',
}

interface AvatarProps {
  name?: string | null
  size?: keyof typeof SIZE_CLASSES
  className?: string
}

/** A small, deterministic initials avatar — used in place of a real profile
 * photo, since this app has no Microsoft Graph connector wired up to fetch
 * one for a given user/email. */
export function Avatar({
  name,
  size = 'sm',
  className = '',
}: AvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase text-[#F5F2EC] ${SIZE_CLASSES[size]} ${className}`}
      style={{ backgroundColor: getColorForName(name) }}
      title={name ?? undefined}
      aria-hidden="true"
    >
      {getInitials(name)}
    </span>
  )
}
