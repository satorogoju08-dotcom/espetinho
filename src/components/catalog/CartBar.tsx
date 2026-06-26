import { useNavigate } from 'react-router-dom'
import { ChevronRight, ShoppingBag } from 'lucide-react'
import { useCartStore } from '../../store/cartStore'
import { formatCurrency } from '../../lib/utils'

export function CartBar() {
  const navigate = useNavigate()
  const { getTotalItems, getTotalPrice } = useCartStore()
  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  if (totalItems === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-5 pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        <button
          onClick={() => navigate('/checkout')}
          className="w-full bg-brand-500 hover:bg-brand-600 text-white rounded-2xl shadow-2xl shadow-orange-500/30 py-4 px-5 flex items-center justify-between gap-3 transition-all duration-200 active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold shrink-0">
              {totalItems}
            </span>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span className="font-condensed font-semibold text-sm tracking-wide">Ver carrinho</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-condensed font-bold text-base">{formatCurrency(totalPrice)}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  )
}
