import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Product } from '../types'

export function useProducts(storeId?: string, categoryId?: string | null) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!storeId) return
    setLoading(true)
    let q = supabase
      .from('products')
      .select('*, media:product_media(*)')
      .eq('store_id', storeId)
      .eq('active', true)
      .order('order_index')
    if (categoryId) q = q.eq('category_id', categoryId)
    q.then(({ data }) => {
      setProducts(data || [])
      setLoading(false)
    })
  }, [storeId, categoryId])

  return { products, loading }
}
