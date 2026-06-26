import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { formatCurrency, getImageFallback } from '../../lib/utils'

export function CartDrawer() {
  const navigate = useNavigate()
  const { items, isOpen, closeCart, updateQuantity, removeItem, getTotalPrice } = useCartStore()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const handleCheckout = () => {
    closeCart()
    navigate('/checkout')
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed z-50 flex flex-col bg-[#1a0d00] shadow-2xl border-t border-orange-950/60
        bottom-0 left-0 right-0 rounded-t-3xl max-h-[85vh]
        md:top-0 md:right-0 md:bottom-0 md:left-auto md:w-96 md:rounded-none md:max-h-full md:border-t-0 md:border-l md:border-orange-950/60
        animate-slideUp md:animate-slideLeft"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-orange-950/60 shrink-0">
          <h2 className="font-display text-2xl text-white tracking-wide uppercase">Seu carrinho</h2>
          <button
            onClick={closeCart}
            aria-label="Fechar carrinho"
            className="p-2 rounded-xl hover:bg-white/10 text-orange-300/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <ShoppingBag className="w-12 h-12 text-orange-900/40 mb-3" />
              <p className="font-medium text-orange-200/40">Seu carrinho está vazio</p>
              <button
                onClick={closeCart}
                className="mt-3 text-sm text-brand-500 hover:underline"
              >
                Explorar produtos
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => {
                const firstImg = item.product.media?.find((m) => m.type === 'image')
                return (
                  <div key={item.product.id} className="flex gap-3">
                    {firstImg ? (
                      <img
                        src={firstImg.url}
                        alt={item.product.name}
                        onError={(e) => { e.currentTarget.src = getImageFallback() }}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-[#2a1500] shrink-0 flex items-center justify-center text-2xl opacity-40">
                        🍢
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-condensed font-semibold text-sm text-white line-clamp-2 leading-snug">
                        {item.product.name}
                      </p>
                      {item.observation && (
                        <p className="text-xs text-orange-200/40 mt-0.5 truncate">📝 {item.observation}</p>
                      )}
                      <p className="text-sm font-bold text-brand-500 mt-1">
                        {formatCurrency(item.product.price * item.quantity)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 bg-white/[0.08] rounded-lg p-0.5">
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            aria-label="Diminuir"
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-orange-200/70 transition-colors active:scale-95"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            aria-label="Aumentar"
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-orange-200/70 transition-colors active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          aria-label="Remover"
                          className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 px-5 py-4 border-t border-orange-950/60 bg-[#1a0d00]">
            <div className="flex items-center justify-between mb-4">
              <span className="font-condensed font-semibold text-orange-200/70">Total</span>
              <span className="font-display text-2xl text-brand-500 tracking-wide">{formatCurrency(getTotalPrice())}</span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-2xl py-4 font-condensed font-bold text-base tracking-wide transition-all active:scale-[0.98] shadow-md shadow-orange-500/30"
            >
              Finalizar pedido
            </button>
          </div>
        )}
      </div>
    </>
  )
}
