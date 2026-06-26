import { Plus, Image } from 'lucide-react'
import type { Product } from '../../types'
import { useCartStore } from '../../store/cartStore'
import { cn, formatCurrency } from '../../lib/utils'

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const { addItem } = useCartStore()
  const firstImage = product.media?.find((m) => m.type === 'image')

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    addItem(product)
  }

  return (
    <div
      onClick={onClick}
      className="bg-[#1a0d00] rounded-2xl overflow-hidden border border-orange-950/40 hover:border-orange-500/30 cursor-pointer active:scale-[0.99] transition-all duration-200 group"
    >
      {/* Imagem */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#0f0800]">
        {firstImage ? (
          <img
            src={firstImage.url}
            alt={product.name}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-20">🍢</span>
          </div>
        )}

        {/* Gradiente inferior na imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0d00]/80 via-transparent to-transparent pointer-events-none" />

        {/* Badge "mais pedido" */}
        {product.promotional_badge && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-brand-500 text-white uppercase tracking-wide">
              # pedido
            </span>
          </div>
        )}

        {/* Botão foto */}
        {firstImage && (
          <button
            onClick={(e) => { e.stopPropagation(); onClick() }}
            aria-label="Ver fotos"
            className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white/80 hover:text-white rounded-lg px-2 py-1 text-[10px] font-medium transition-all"
          >
            <Image className="w-3 h-3" />
            foto
          </button>
        )}

        {/* Indisponível overlay */}
        {!product.in_stock && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-xs font-semibold text-white/70 bg-black/50 px-3 py-1 rounded-full">
              Indisponível
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3 flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className={cn('font-condensed font-semibold text-base text-white leading-snug', !product.in_stock && 'opacity-50')}>
            {product.name}
          </p>
          {product.description && (
            <p className="text-xs text-orange-200/50 line-clamp-2 mt-0.5 leading-relaxed">
              {product.description}
            </p>
          )}
          <p className={cn('font-condensed font-bold text-brand-500 mt-1.5 text-base', !product.in_stock && 'opacity-50')}>
            {formatCurrency(product.price)}
          </p>
        </div>

        {product.in_stock && (
          <button
            onClick={handleAdd}
            aria-label={`Adicionar ${product.name}`}
            className="shrink-0 flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-3 py-2 text-sm font-condensed font-semibold tracking-wide transition-all active:scale-95 shadow-md shadow-orange-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
        )}
      </div>
    </div>
  )
}
