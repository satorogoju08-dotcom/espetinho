import { useEffect, useState, useCallback } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Category } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import { useToast } from '../../components/ui/Toast'
import { Skeleton } from '../../components/ui/Skeleton'

const EMOJI_SUGGESTIONS = ['🧀','🥩','🍞','🥗','🍰','🥤','🛒','🍖','🫙','🫒','🍫','🥛','🧈','🫕','🥚','🍳','🥓','🌽','🫑','🥦']

const schema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(50, 'Máximo 50 caracteres'),
  emoji: z.string(),
  active: z.boolean(),
})
type FormData = z.infer<typeof schema>

interface CategoryWithCount extends Category {
  product_count?: number
}

export function Categories() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState<CategoryWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [storeId, setStoreId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryWithCount | null>(null)
  const [saving, setSaving] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { emoji: '🍽️', active: true },
  })

  const watchEmoji = watch('emoji')

  const fetchStoreId = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return null
    const { data } = await supabase
      .from('admin_profiles')
      .select('store_id')
      .eq('id', session.user.id)
      .single()
    return data?.store_id ?? null
  }, [])

  const fetchCategories = useCallback(async (sid: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('store_id', sid)
      .order('order_index')

    const cats: CategoryWithCount[] = await Promise.all(
      (data ?? []).map(async (cat) => {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', cat.id)
        return { ...cat, product_count: count ?? 0 }
      })
    )
    setCategories(cats)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStoreId().then((sid) => {
      if (sid) {
        setStoreId(sid)
        fetchCategories(sid)
      }
    })
  }, [fetchStoreId, fetchCategories])

  const openCreate = () => {
    setEditingCategory(null)
    reset({ name: '', emoji: '🍽️', active: true })
    setModalOpen(true)
  }

  const openEdit = (cat: Category) => {
    setEditingCategory(cat)
    reset({ name: cat.name, emoji: cat.emoji, active: cat.active })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingCategory(null)
  }

  const onSubmit = async (data: FormData) => {
    if (!storeId) return
    setSaving(true)
    try {
      if (editingCategory) {
        const { error } = await supabase.from('categories').update(data).eq('id', editingCategory.id)
        if (error) throw error
        showToast('Categoria atualizada com sucesso!')
      } else {
        const maxOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.order_index)) + 1 : 0
        const { error } = await supabase.from('categories').insert({ ...data, store_id: storeId, order_index: maxOrder })
        if (error) throw error
        showToast('Categoria criada com sucesso!')
      }
      closeModal()
      fetchCategories(storeId)
    } catch {
      showToast('Erro ao salvar categoria', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !storeId) return
    const { error } = await supabase.from('categories').delete().eq('id', deleteTarget.id)
    if (error) {
      showToast('Erro ao deletar categoria', 'error')
    } else {
      showToast('Categoria removida!')
      fetchCategories(storeId)
    }
    setDeleteTarget(null)
  }

  const handleToggleActive = async (cat: Category) => {
    const { error } = await supabase.from('categories').update({ active: !cat.active }).eq('id', cat.id)
    if (!error && storeId) fetchCategories(storeId)
  }

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const newCats = [...categories]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newCats.length) return
    ;[newCats[index], newCats[targetIndex]] = [newCats[targetIndex], newCats[index]]

    const updates = newCats.map((cat, i) =>
      supabase.from('categories').update({ order_index: i }).eq('id', cat.id)
    )
    await Promise.all(updates)
    if (storeId) fetchCategories(storeId)
  }

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-bold text-2xl text-gray-900">Categorias</h1>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" />
          Nova Categoria
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Buscar categoria..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Nenhuma categoria encontrada</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((cat, index) => (
            <div key={cat.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
              <span className="text-2xl shrink-0">{cat.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                <p className="text-xs text-gray-400">{cat.product_count} produto(s)</p>
              </div>

              <button
                onClick={() => handleToggleActive(cat)}
                aria-label={cat.active ? 'Desativar categoria' : 'Ativar categoria'}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${cat.active ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${cat.active ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleReorder(index, 'up')}
                  disabled={index === 0}
                  aria-label="Mover para cima"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReorder(index, 'down')}
                  disabled={index === filtered.length - 1}
                  aria-label="Mover para baixo"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEdit(cat)}
                  aria-label="Editar categoria"
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(cat)}
                  aria-label="Deletar categoria"
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} aria-hidden="true" />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-lg">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button onClick={closeModal} aria-label="Fechar" className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <Input label="Nome da categoria *" error={errors.name?.message} {...register('name')} />

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Emoji</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_SUGGESTIONS.map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setValue('emoji', em)}
                      className={`text-xl p-2 rounded-xl border-2 transition-all ${watchEmoji === em ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
                <input type="hidden" {...register('emoji')} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" {...register('active')} className="w-4 h-4 accent-brand-500" />
                <span className="text-sm font-medium text-gray-700">Categoria ativa</span>
              </label>

              <div className="flex gap-3 mt-2">
                <Button type="button" variant="secondary" fullWidth onClick={closeModal}>Cancelar</Button>
                <Button type="submit" fullWidth loading={saving}>Salvar</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Deletar categoria"
        message={`${deleteTarget?.product_count ?? 0} produto(s) serão desvinculados desta categoria. Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel="Deletar"
        danger
      />
    </div>
  )
}
