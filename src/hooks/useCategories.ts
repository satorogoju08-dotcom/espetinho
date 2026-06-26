import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category } from '../types'

export function useCategories(storeId?: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!storeId) return
    supabase
      .from('categories')
      .select('*')
      .eq('store_id', storeId)
      .eq('active', true)
      .order('order_index')
      .then(({ data }) => {
        setCategories(data || [])
        setLoading(false)
      })
  }, [storeId])

  return { categories, loading }
}
