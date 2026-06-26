import { cn } from '../../lib/utils'

interface BadgeProps {
  variant: 'promo' | 'unavailable' | 'new'
  className?: string
}

const labels = {
  promo: 'PROMOÇÃO',
  unavailable: 'INDISPONÍVEL',
  new: 'NOVO',
}

const styles = {
  promo: 'bg-red-500 text-white',
  unavailable: 'bg-gray-400 text-white',
  new: 'bg-green-500 text-white',
}

export function Badge({ variant, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
        styles[variant],
        className
      )}
    >
      {labels[variant]}
    </span>
  )
}
