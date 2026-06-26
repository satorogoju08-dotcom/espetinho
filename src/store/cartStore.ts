import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '../types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (p: Product, obs?: string) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  updateObservation: (id: string, obs: string) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (product, observation = '') => {
        const existing = get().items.find((i) => i.product.id === product.id)
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          })
        } else {
          set({ items: [...get().items, { product, quantity: 1, observation }] })
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.product.id !== id) }),
      updateQuantity: (id, qty) => {
        if (qty <= 0) {
          get().removeItem(id)
          return
        }
        set({ items: get().items.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i)) })
      },
      updateObservation: (id, observation) =>
        set({ items: get().items.map((i) => (i.product.id === id ? { ...i, observation } : i)) }),
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set({ isOpen: !get().isOpen }),
      getTotalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((s, i) => s + i.product.price * i.quantity, 0),
    }),
    { name: 'cart-storage', partialize: (s) => ({ items: s.items }) }
  )
)
