import { ShoppingCart } from 'lucide-react'
import type { Store } from '../../types'
import type { getStoreStatusLabel } from '../../lib/storeStatus'
import { useCartStore } from '../../store/cartStore'

type StatusInfo = ReturnType<typeof getStoreStatusLabel>

interface StoreHeaderProps {
  store: Store
  statusInfo: StatusInfo
  mesa?: string | null
}

export function StoreHeader({ store, statusInfo, mesa }: StoreHeaderProps) {
  const { getTotalItems, toggleCart } = useCartStore()
  const totalItems = getTotalItems()

  return (
    <header className="bg-[#0f0800] border-b border-orange-950/60">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        {/* Logo / branding */}
        <div className="flex items-center gap-2.5 min-w-0">
          {store.logo_url ? (
            <img
              src={store.logo_url}
              alt={store.name}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
              className="w-10 h-10 rounded-xl object-cover shrink-0"
            />
          ) : (
            <span className="text-2xl shrink-0">🔥</span>
          )}
          <div className="min-w-0">
            <p className="font-condensed text-xs text-orange-400/80 uppercase tracking-widest leading-none font-semibold">
              Espetinho
            </p>
            <h1 className="font-display text-2xl text-white leading-none tracking-wide uppercase">
              {store.name}
            </h1>
            <p className="font-condensed text-xs text-orange-300/60 leading-none mt-0.5">
              só filé na brasa
            </p>
          </div>
        </div>

        {/* Mesa + status + carrinho */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Status da loja */}
          <span
            className={`hidden sm:inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              statusInfo.isOpen
                ? 'bg-green-900/40 text-green-400'
                : 'bg-red-900/40 text-red-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.isOpen ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            {statusInfo.label}
          </span>

          {/* Mesa */}
          {mesa && (
            <div className="text-right">
              <p className="text-[9px] text-orange-300/60 leading-none font-condensed uppercase tracking-wider">
                você está na
              </p>
              <p className="font-display text-xl text-white leading-tight tracking-wide">
                Mesa {mesa.padStart(2, '0')}
              </p>
            </div>
          )}

          {/* Carrinho */}
          <button
            onClick={toggleCart}
            aria-label="Abrir carrinho"
            className="relative w-10 h-10 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"
          >
            <ShoppingCart className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
