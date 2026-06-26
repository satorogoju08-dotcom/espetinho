import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PackageX, Plus } from 'lucide-react'
import { useStore } from '../hooks/useStore'
import { useCategories } from '../hooks/useCategories'
import { useProducts } from '../hooks/useProducts'
import type { Product } from '../types'
import { StoreHeader } from '../components/catalog/StoreHeader'
import { CategoryBar } from '../components/catalog/CategoryBar'
import { ProductCard } from '../components/catalog/ProductCard'
import { ProductModal } from '../components/catalog/ProductModal'
import { CartBar } from '../components/catalog/CartBar'
import { CartDrawer } from '../components/catalog/CartDrawer'
import { getStoreStatusLabel } from '../lib/storeStatus'
import { applyStoreTheme, formatCurrency } from '../lib/utils'
import { useCartStore } from '../store/cartStore'

const STORE_SLUG = 'espetinho-file'

function OfferCard({ product, onClick }: { product: Product; onClick: () => void }) {
  const { addItem } = useCartStore()
  return (
    <div
      className="shrink-0 w-52 rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-200"
      style={{ background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)' }}
      onClick={onClick}
    >
      <div className="p-4 flex flex-col h-full min-h-[180px]">
        {product.promotional_badge && (
          <p className="text-white/80 text-[10px] font-condensed uppercase tracking-widest mb-1">
            oferta da casa
          </p>
        )}
        <h3 className="font-display text-2xl text-white leading-none uppercase tracking-wide">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-white/70 text-xs mt-2 leading-relaxed line-clamp-3 flex-1">
            {product.description}
          </p>
        )}
        {product.price > 0 && (
          <p className="font-condensed font-bold text-white text-lg mt-2">
            {formatCurrency(product.price)}
          </p>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); addItem(product) }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 bg-black/30 hover:bg-black/50 text-white rounded-xl py-2 text-sm font-condensed font-semibold tracking-wide transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar oferta
        </button>
      </div>
    </div>
  )
}

export function Catalog() {
  const [searchParams] = useSearchParams()
  const mesa = searchParams.get('mesa')

  const { store, loading: storeLoading, error } = useStore(STORE_SLUG)
  const { categories } = useCategories(store?.id)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { products, loading: productsLoading } = useProducts(store?.id, selectedCategory)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (store?.primary_color) applyStoreTheme(store.primary_color)
  }, [store?.primary_color])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f0800]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="font-condensed text-orange-300/60 text-sm tracking-wide">acendendo a brasa...</p>
        </div>
      </div>
    )
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0f0800]">
        <div className="text-center">
          <PackageX className="w-16 h-16 text-orange-900/60 mx-auto mb-4" />
          <h1 className="font-display text-3xl text-white mb-2 uppercase tracking-wide">Loja não encontrada</h1>
          <p className="text-sm text-orange-200/50">
            Verifique o endereço ou tente novamente mais tarde.
          </p>
        </div>
      </div>
    )
  }

  const statusInfo = getStoreStatusLabel(store.is_open, store.opening_hours)

  // Separa ofertas (produtos com promotional_badge) dos demais — só quando "Todos" está selecionado
  const offerProducts = selectedCategory === null ? products.filter((p) => p.promotional_badge) : []
  const regularProducts = selectedCategory === null ? products.filter((p) => !p.promotional_badge) : products

  return (
    <div className="min-h-screen bg-[#0f0800]">
      <StoreHeader store={store} statusInfo={statusInfo} mesa={mesa} />
      <CategoryBar
        categories={categories}
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      <main className="max-w-2xl mx-auto px-4 py-5 pb-28">
        {/* Hero */}
        {selectedCategory === null && (
          <div className="mb-6">
            <h2 className="font-display text-5xl sm:text-6xl text-white leading-none uppercase tracking-wide">
              ACENDEU,<br />TÁ NA BRASA.
            </h2>
            <p className="text-sm text-orange-200/50 mt-2 max-w-xs leading-relaxed">
              Monte seu pedido sem esperar atendimento. É só escolher, mandar pra brasa e a gente leva na sua mesa.
            </p>
          </div>
        )}

        {productsLoading ? (
          /* Skeleton escuro */
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#1a0d00] rounded-2xl overflow-hidden border border-orange-950/40 animate-pulse">
                <div className="w-full aspect-[16/9] bg-[#2a1500]" />
                <div className="px-4 py-3 flex justify-between items-end gap-3">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-4 w-3/4 bg-[#2a1500] rounded" />
                    <div className="h-3 w-full bg-[#2a1500] rounded" />
                    <div className="h-4 w-1/3 bg-[#2a1500] rounded mt-1" />
                  </div>
                  <div className="w-24 h-9 bg-[#2a1500] rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4 opacity-30">🍢</span>
            <p className="text-orange-200/50 font-medium">Nenhum produto encontrado</p>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="mt-3 text-sm text-brand-500 hover:underline"
              >
                Ver todos os produtos
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Seção de Ofertas — scroll horizontal com cards laranja */}
            {offerProducts.length > 0 && (
              <section className="mb-6">
                <h3 className="flex items-center gap-2 font-condensed font-bold text-sm text-orange-300/80 uppercase tracking-widest mb-3">
                  <span>🔥</span> Ofertas da Casa
                </h3>
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                  {offerProducts.map((product) => (
                    <OfferCard
                      key={product.id}
                      product={product}
                      onClick={() => setSelectedProduct(product)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Título da seção de produtos regulares */}
            {regularProducts.length > 0 && selectedCategory === null && (
              <h3 className="flex items-center gap-2 font-condensed font-bold text-sm text-orange-300/80 uppercase tracking-widest mb-3">
                <span>🔥</span> No Cardápio
              </h3>
            )}

            {/* Lista de produtos */}
            <div className="flex flex-col gap-4">
              {regularProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <CartBar />
      <CartDrawer />
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </div>
  )
}
