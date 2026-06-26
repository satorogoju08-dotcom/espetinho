import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import type { Product } from '../../types'
import { Button } from '../ui/Button'
import { useCartStore } from '../../store/cartStore'
import { cn, formatCurrency, getEmbedUrl, getImageFallback } from '../../lib/utils'

interface ProductModalProps {
  product: Product | null
  onClose: () => void
}

export function ProductModal({ product, onClose }: ProductModalProps) {
  const [mediaIndex, setMediaIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [observation, setObservation] = useState('')
  const { addItem } = useCartStore()

  useEffect(() => {
    if (product) {
      document.body.style.overflow = 'hidden'
      setMediaIndex(0)
      setQuantity(1)
      setObservation('')
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [product])

  if (!product) return null

  const media = product.media ?? []
  const currentMedia = media[mediaIndex]
  const embedUrl = currentMedia?.type === 'video' ? getEmbedUrl(currentMedia.url) : null

  const handleAdd = () => {
    for (let i = 0; i < quantity; i++) {
      addItem(product, observation)
    }
    onClose()
  }

  const goNext = () => setMediaIndex((i) => (i + 1) % media.length)
  const goPrev = () => setMediaIndex((i) => (i - 1 + media.length) % media.length)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative bg-[#1a0d00] border border-orange-950/60 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-4 border-b border-orange-950/60">
          <h2 className="font-condensed font-bold text-white text-lg leading-snug pr-2">{product.name}</h2>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="shrink-0 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-orange-200/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* Gallery */}
          {media.length > 0 && (
            <div className="relative aspect-[4/3] bg-[#0f0800]">
              {currentMedia.type === 'video' && embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={product.name}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <img
                  src={currentMedia.url}
                  alt={product.name}
                  onError={(e) => { e.currentTarget.src = getImageFallback() }}
                  className="w-full h-full object-cover"
                />
              )}

              {media.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    aria-label="Mídia anterior"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goNext}
                    aria-label="Próxima mídia"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {media.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setMediaIndex(i)}
                        aria-label={`Ir para mídia ${i + 1}`}
                        className={cn(
                          'w-2 h-2 rounded-full transition-all',
                          i === mediaIndex ? 'bg-brand-500 scale-125' : 'bg-white/40'
                        )}
                      />
                    ))}
                  </div>
                </>
              )}

              {media.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 flex gap-1 p-2 overflow-x-auto no-scrollbar">
                  {media.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => setMediaIndex(i)}
                      aria-label={`Miniatura ${i + 1}`}
                      className={cn(
                        'shrink-0 w-12 h-9 rounded-lg overflow-hidden border-2 transition-all',
                        i === mediaIndex ? 'border-brand-500' : 'border-transparent opacity-60'
                      )}
                    >
                      {m.type === 'image' ? (
                        <img
                          src={m.url}
                          alt=""
                          onError={(e) => { e.currentTarget.src = getImageFallback() }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center text-white text-xs">
                          ▶
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-4 flex flex-col gap-3">
            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              {product.promotional_badge && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold bg-brand-500 text-white uppercase tracking-wide">
                  # pedido
                </span>
              )}
              {!product.in_stock && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold bg-white/10 text-orange-200/60 uppercase tracking-wide">
                  Indisponível
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-orange-200/60 leading-relaxed">{product.description}</p>
            )}

            {/* Price */}
            <p className="font-display text-3xl text-brand-500 tracking-wide">{formatCurrency(product.price)}</p>

            {/* Observation */}
            <div className="flex flex-col gap-1">
              <label htmlFor="observation" className="text-sm font-medium text-orange-200/70">
                Alguma observação? <span className="text-orange-200/40 font-normal">(opcional)</span>
              </label>
              <textarea
                id="observation"
                rows={2}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Ex: sem cebola, ponto bem passado..."
                className="w-full rounded-xl border border-orange-950/60 bg-[#0f0800] px-3 py-2.5 text-sm text-white placeholder-orange-200/30 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-orange-950/60 p-4 bg-[#1a0d00]">
          {product.in_stock ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/[0.08] rounded-xl p-1">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Diminuir quantidade"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-orange-200/70 transition-colors active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-white">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Aumentar quantidade"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-orange-200/70 transition-colors active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button onClick={handleAdd} fullWidth variant="primary" size="lg">
                Adicionar • {formatCurrency(product.price * quantity)}
              </Button>
            </div>
          ) : (
            <div className="w-full bg-white/[0.08] rounded-xl py-3 text-center text-sm font-medium text-orange-200/40">
              Produto temporariamente indisponível
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
