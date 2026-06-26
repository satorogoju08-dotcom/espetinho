import type { Category } from '../../types'
import { cn } from '../../lib/utils'

interface CategoryBarProps {
  categories: Category[]
  selected: string | null
  onSelect: (id: string | null) => void
}

export function CategoryBar({ categories, selected, onSelect }: CategoryBarProps) {
  if (categories.length === 0) return null

  return (
    <div className="sticky top-0 z-30 bg-[#0a0500] border-b border-orange-950/50">
      <div className="relative">
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#0a0500] to-transparent z-10" />

        <div className="flex gap-2 py-2.5 pl-4 pr-10 overflow-x-auto no-scrollbar">
          {/* Todos */}
          <button
            onClick={() => onSelect(null)}
            className={cn(
              'flex-none whitespace-nowrap inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-condensed font-semibold tracking-wide transition-all duration-200',
              selected === null
                ? 'bg-brand-500 text-white shadow-md shadow-orange-500/30'
                : 'bg-white/[0.08] text-orange-200/70 hover:bg-white/[0.12] hover:text-white border border-white/10'
            )}
          >
            Todos
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                'flex-none whitespace-nowrap inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-condensed font-semibold tracking-wide transition-all duration-200',
                selected === cat.id
                  ? 'bg-brand-500 text-white shadow-md shadow-orange-500/30'
                  : 'bg-white/[0.08] text-orange-200/70 hover:bg-white/[0.12] hover:text-white border border-white/10'
              )}
            >
              <span>{cat.emoji}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
