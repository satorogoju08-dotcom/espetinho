import { useEffect, useState, useCallback, useRef } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, ImageOff } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Product, Category, ProductMedia } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { useToast } from '../../components/ui/Toast'
import { Skeleton } from '../../components/ui/Skeleton'
import { formatCurrency, getEmbedUrl, getImageFallback } from '../../lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().positive('Preço deve ser positivo'),
  category_id: z.string().nullable().optional(),
  promotional_badge: z.boolean(),
  in_stock: z.boolean(),
  active: z.boolean(),
})
type FormData = z.infer<typeof schema>

interface MediaPreview {
  id?: string
  url: string
  type: 'image' | 'video'
  file?: File
  order_index: number
  toDelete?: boolean
}

export function Products() {
  const { showToast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [saving, setSaving] = useState(false)
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([])
  const [videoUrl, setVideoUrl] = useState('')
  const [videoError, setVideoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { promotional_badge: false, in_stock: true, active: true },
  })

  const fetchStoreId = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const { data } = await supabase.from('admin_profiles').select('store_id').eq('id', session.user.id).single()
    return data?.store_id ?? null
  }, [])

  const fetchAll = useCallback(async (sid: string) => {
    setLoading(true)
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, media:product_media(*)').eq('store_id', sid).order('order_index'),
      supabase.from('categories').select('*').eq('store_id', sid).eq('active', true).order('order_index'),
    ])
    setProducts(prods ?? [])
    setCategories(cats ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStoreId().then((sid) => {
      if (sid) {
        setStoreId(sid)
        fetchAll(sid)
      }
    })
  }, [fetchStoreId, fetchAll])

  const openCreate = () => {
    setEditingProduct(null)
    reset({ promotional_badge: false, in_stock: true, active: true, category_id: null })
    setMediaPreviews([])
    setVideoUrl('')
    setVideoError('')
    setModalOpen(true)
  }

  const openEdit = (product: Product) => {
    setEditingProduct(product)
    reset({
      name: product.name,
      description: product.description,
      price: product.price,
      category_id: product.category_id ?? null,
      promotional_badge: product.promotional_badge,
      in_stock: product.in_stock,
      active: product.active,
    })
    const existingMedia: MediaPreview[] = (product.media ?? [])
      .filter((m) => m.type === 'image')
      .map((m) => ({ id: m.id, url: m.url, type: 'image', order_index: m.order_index }))
    setMediaPreviews(existingMedia)
    const existingVideo = (product.media ?? []).find((m) => m.type === 'video')
    setVideoUrl(existingVideo?.url ?? '')
    setVideoError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingProduct(null)
    setMediaPreviews([])
    setVideoUrl('')
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newPreviews: MediaPreview[] = Array.from(files).map((file, i) => ({
      url: URL.createObjectURL(file),
      type: 'image',
      file,
      order_index: mediaPreviews.length + i,
    }))
    setMediaPreviews((prev) => [...prev, ...newPreviews])
  }

  const removePreview = (index: number) => {
    setMediaPreviews((prev) => {
      const updated = [...prev]
      const item = updated[index]
      if (item.id) {
        updated[index] = { ...item, toDelete: true }
      } else {
        updated.splice(index, 1)
      }
      return updated
    })
  }

  const movePreview = (index: number, dir: 'up' | 'down') => {
    const visible = mediaPreviews.filter((m) => !m.toDelete)
    const targetIdx = dir === 'up' ? index - 1 : index + 1
    if (targetIdx < 0 || targetIdx >= visible.length) return
    const newVisible = [...visible]
    ;[newVisible[index], newVisible[targetIdx]] = [newVisible[targetIdx], newVisible[index]]
    setMediaPreviews(newVisible.map((m, i) => ({ ...m, order_index: i })))
  }

  const handleVideoUrl = (url: string) => {
    setVideoUrl(url)
    if (url && !getEmbedUrl(url)) setVideoError('URL de vídeo inválida (use YouTube ou Vimeo)')
    else setVideoError('')
  }

  const uploadImage = async (file: File, sid: string): Promise<string> => {
    const path = `${sid}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('product-images').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data.publicUrl
  }

  const onSubmit = async (data: FormData) => {
    if (!storeId) return
    setSaving(true)
    try {
      let productId = editingProduct?.id

      if (editingProduct) {
        const { error } = await supabase.from('products').update({
          name: data.name,
          description: data.description ?? '',
          price: data.price,
          category_id: data.category_id ?? null,
          promotional_badge: data.promotional_badge,
          in_stock: data.in_stock,
          active: data.active,
        }).eq('id', editingProduct.id)
        if (error) throw error

        const toDelete = mediaPreviews.filter((m) => m.id && m.toDelete)
        for (const m of toDelete) {
          await supabase.from('product_media').delete().eq('id', m.id!)
        }
      } else {
        const maxOrder = products.length > 0 ? Math.max(...products.map((p) => p.order_index)) + 1 : 0
        const { data: inserted, error } = await supabase.from('products').insert({
          store_id: storeId,
          name: data.name,
          description: data.description ?? '',
          price: data.price,
          category_id: data.category_id ?? null,
          promotional_badge: data.promotional_badge,
          in_stock: data.in_stock,
          active: data.active,
          order_index: maxOrder,
        }).select().single()
        if (error) throw error
        productId = inserted.id
      }

      const visible = mediaPreviews.filter((m) => !m.toDelete)
      for (let i = 0; i < visible.length; i++) {
        const m = visible[i]
        if (m.file) {
          const url = await uploadImage(m.file, storeId)
          await supabase.from('product_media').insert({ product_id: productId, url, type: 'image', order_index: i })
        } else if (m.id) {
          await supabase.from('product_media').update({ order_index: i }).eq('id', m.id)
        }
      }

      if (videoUrl && !videoError) {
        const existingVideo = editingProduct?.media?.find((m) => m.type === 'video')
        if (existingVideo) {
          await supabase.from('product_media').update({ url: videoUrl }).eq('id', existingVideo.id)
        } else {
          await supabase.from('product_media').insert({ product_id: productId, url: videoUrl, type: 'video', order_index: 999 })
        }
      } else if (!videoUrl && editingProduct) {
        const existingVideo = editingProduct.media?.find((m) => m.type === 'video')
        if (existingVideo) await supabase.from('product_media').delete().eq('id', existingVideo.id)
      }

      showToast(editingProduct ? 'Produto atualizado!' : 'Produto criado!')
      closeModal()
      fetchAll(storeId)
    } catch {
      showToast('Erro ao salvar produto', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !storeId) return
    const { error } = await supabase.from('products').delete().eq('id', deleteTarget.id)
    if (error) showToast('Erro ao deletar produto', 'error')
    else {
      showToast('Produto removido!')
      fetchAll(storeId)
    }
    setDeleteTarget(null)
  }

  const handleToggleActive = async (product: Product) => {
    const { error } = await supabase.from('products').update({ active: !product.active }).eq('id', product.id)
    if (!error && storeId) fetchAll(storeId)
  }

  const handleSearchChange = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setSearch(value), 300)
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = filterCategory === '' || p.category_id === filterCategory
    return matchesSearch && matchesCategory
  })

  const visiblePreviews = mediaPreviews.filter((m) => !m.toDelete)
  const embedPreview = videoUrl && !videoError ? getEmbedUrl(videoUrl) : null

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-2xl text-gray-900">Produtos</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" />
          Novo Produto
        </Button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input placeholder="Buscar produto..." onChange={(e) => handleSearchChange(e.target.value)} />
        </div>
        <select
          className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white transition-all duration-200"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Nenhum produto encontrado</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredProducts.map((product) => {
            const firstImg = product.media?.find((m: ProductMedia) => m.type === 'image')
            const cat = categories.find((c) => c.id === product.category_id)
            return (
              <div key={product.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
                {firstImg ? (
                  <img
                    src={firstImg.url}
                    alt={product.name}
                    onError={(e) => { e.currentTarget.src = getImageFallback() }}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <ImageOff className="w-5 h-5 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">
                    {cat ? `${cat.emoji} ${cat.name}` : 'Sem categoria'} · {formatCurrency(product.price)}
                  </p>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {product.promotional_badge && (
                      <span className="text-[10px] bg-red-100 text-red-700 rounded-full px-1.5 py-0.5 font-bold">PROMO</span>
                    )}
                    {!product.in_stock && (
                      <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5 font-bold">SEM ESTOQUE</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActive(product)}
                  aria-label={product.active ? 'Desativar produto' : 'Ativar produto'}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${product.active ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${product.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(product)} aria-label="Editar produto" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(product)} aria-label="Deletar produto" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} aria-hidden="true" />
          <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={closeModal} aria-label="Fechar" className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 p-5 flex flex-col gap-4">
              <Input label="Nome *" error={errors.name?.message} placeholder="Nome do produto" {...register('name')} />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Descrição</label>
                <textarea
                  rows={3}
                  placeholder="Descreva o produto..."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none transition-all duration-200"
                  {...register('description')}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>

              <Input label="Preço *" type="number" step="0.01" min="0" error={errors.price?.message} placeholder="0,00" {...register('price')} />

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Categoria</label>
                <select
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white transition-all duration-200"
                  {...register('category_id')}
                >
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Opções</label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('promotional_badge')} className="w-4 h-4 accent-brand-500" />
                  <span className="text-sm text-gray-700">Badge de promoção</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('in_stock')} className="w-4 h-4 accent-brand-500" />
                  <span className="text-sm text-gray-700">Em estoque</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" {...register('active')} className="w-4 h-4 accent-brand-500" />
                  <span className="text-sm text-gray-700">Produto ativo (visível no catálogo)</span>
                </label>
              </div>

              {/* Imagens */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Imagens</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Plus className="w-4 h-4" /> Adicionar imagens
                </Button>
                {visiblePreviews.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {visiblePreviews.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-2">
                        <img
                          src={m.url}
                          alt=""
                          onError={(e) => { e.currentTarget.src = getImageFallback() }}
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 truncate">Imagem {i + 1}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button type="button" onClick={() => movePreview(i, 'up')} disabled={i === 0} aria-label="Mover para cima" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 disabled:opacity-30 transition-colors">
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => movePreview(i, 'down')} disabled={i === visiblePreviews.length - 1} aria-label="Mover para baixo" className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 disabled:opacity-30 transition-colors">
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => removePreview(mediaPreviews.indexOf(m))} aria-label="Remover imagem" className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Vídeo */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">URL de vídeo (opcional)</label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => handleVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
                />
                {videoError && <p className="text-xs text-red-500">{videoError}</p>}
                {embedPreview && (
                  <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                    <iframe src={embedPreview} title="Preview" className="w-full h-full" allowFullScreen />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" fullWidth onClick={closeModal}>Cancelar</Button>
                <Button type="submit" fullWidth loading={saving}>Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deletar produto"
        message={`Tem certeza que deseja deletar "${deleteTarget?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Deletar"
        danger
      />
    </div>
  )
}
