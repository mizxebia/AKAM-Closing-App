import { motion } from 'framer-motion'
import akamLogo from '../../assets/akam_logo.png'

interface LoadingScreenProps {
  message?: string
}

/** Full-screen, AKAM-branded loading state — shown while the app's first
 * batch of data is still in flight (not on every background refresh). */
export function LoadingScreen({
  message = 'Loading Closing Suite…',
}: LoadingScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
      style={{ background: '#F5F2EC' }}
      role="status"
      aria-live="polite"
    >
      <div className="relative grid place-items-center">
        <motion.span
          className="absolute rounded-full"
          style={{
            width: '72px',
            height: '72px',
            border: '2.5px solid #D5CBB8',
            borderTopColor: '#1E3A47',
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <motion.img
          src={akamLogo}
          alt="AKAM"
          style={{
            height: '40px',
            width: '40px',
            borderRadius: '6px',
            objectFit: 'cover',
          }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
      <p
        className="text-xs font-semibold uppercase tracking-[0.14em]"
        style={{ color: '#8a8578' }}
      >
        {message}
      </p>
    </motion.div>
  )
}
