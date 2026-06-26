import { useEffect, useState, useRef } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import type { Store, OpeningHours, DayKey } from '../../types'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { getImageFallback, applyStoreTheme } from '../../lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Nome da loja é obrigatório').max(100),
  description: z.string().max(200, 'Máximo 200 caracteres').optional(),
  whatsapp_number: z.string().min(10, 'WhatsApp é obrigatório — inclua DDI+DDD+número'),
  address: z.string().optional(),
  instagram_url: z.string().optional(),
  facebook_url: z.string().optional(),
  is_open: z.boolean(),
  primary_color: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: 'seg', label: 'Segunda' },
  { key: 'ter', label: 'Terça' },
  { key: 'qua', label: 'Quarta' },
  { key: 'qui', label: 'Quinta' },
  { key: 'sex', label: 'Sexta' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
]

const DEFAULT_HOURS: OpeningHours = {
  enabled: false,
  days: {
    seg: { open: true, from: '09:00', to: '22:00' },
    ter: { open: true, from: '09:00', to: '22:00' },
    qua: { open: true, from: '09:00', to: '22:00' },
    qui: { open: true, from: '09:00', to: '22:00' },
    sex: { open: true, from: '09:00', to: '22:00' },
    sab: { open: true, from: '09:00', to: '23:00' },
    dom: { open: false, from: '00:00', to: '00:00' },
  },
}

export function Settings() {
  const { showToast } = useToast()
  const [storeId, setStoreId] = useState<string | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [descCount, setDescCount] = useState(0)
  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_HOURS)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { is_open: true, primary_color: '#f97316' },
  })

  const watchColor = watch('primary_color')
  const watchDesc = watch('description')
  const isValidColor = /^#[0-9A-Fa-f]{6}$/.test(watchColor ?? '')

  // Aplica o tema em tempo real conforme o usuário muda a cor
  useEffect(() => {
    if (/^#[0-9A-Fa-f]{6}$/.test(watchColor ?? '')) {
      applyStoreTheme(watchColor!)
    }
  }, [watchColor])

  useEffect(() => {
    setDescCount(watchDesc?.length ?? 0)
  }, [watchDesc])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('store_id')
        .eq('id', session.user.id)
        .single()

      if (!profile) return
      setStoreId(profile.store_id)

      const { data: s } = await supabase
        .from('stores')
        .select('*')
        .eq('id', profile.store_id)
        .single()

      if (s) {
        setStore(s)
        reset({
          name: s.name,
          description: s.description ?? '',
          whatsapp_number: s.whatsapp_number,
          address: s.address ?? '',
          instagram_url: s.instagram_url ?? '',
          facebook_url: s.facebook_url ?? '',
          is_open: s.is_open,
          primary_color: s.primary_color ?? '#f97316',
        })
        setLogoPreview(s.logo_url)
        setBannerPreview(s.banner_url)
        if (s.opening_hours) {
          setOpeningHours(s.opening_hours as OpeningHours)
        }
      }
      setLoading(false)
    }
    fetchData()
  }, [reset])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: FormData) => {
    if (!storeId) return
    setSaving(true)
    try {
      let logo_url = store?.logo_url ?? null
      let banner_url = store?.banner_url ?? null

      if (logoFile) {
        const path = `${storeId}/logo`
        const { error: uploadError } = await supabase.storage.from('store-logos').upload(path, logoFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('store-logos').getPublicUrl(path)
        logo_url = urlData.publicUrl
      }

      if (bannerFile) {
        const path = `${storeId}/banner`
        const { error: uploadError } = await supabase.storage.from('store-logos').upload(path, bannerFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('store-logos').getPublicUrl(path)
        banner_url = urlData.publicUrl
      }

      const finalColor = isValidColor ? (watchColor ?? '#f97316') : '#f97316'

      // Campos base — sempre existem na tabela
      const { error } = await supabase.from('stores').update({
        name: data.name,
        description: data.description ?? '',
        whatsapp_number: data.whatsapp_number,
        address: data.address ?? '',
        instagram_url: data.instagram_url ?? '',
        facebook_url: data.facebook_url ?? '',
        is_open: data.is_open,
        primary_color: finalColor,
        logo_url,
        banner_url,
      }).eq('id', storeId)

      if (error) throw error

      // Horário de funcionamento — coluna JSONB adicionada via SQL; ignora silenciosamente se não existir
      await supabase.from('stores').update({ opening_hours: openingHours }).eq('id', storeId)

      showToast('Configurações salvas com sucesso!')
      setLogoFile(null)
      setBannerFile(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message
        : (err as { message?: string })?.message ?? 'Erro desconhecido'
      showToast(`Erro ao salvar: ${msg}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setLogoFile(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const handleRemoveBanner = () => {
    setBannerPreview(null)
    setBannerFile(null)
    if (bannerInputRef.current) bannerInputRef.current.value = ''
  }

  const setHoursEnabled = (enabled: boolean) => {
    setOpeningHours((prev) => ({ ...prev, enabled }))
  }

  const setDayOpen = (day: DayKey, open: boolean) => {
    setOpeningHours((prev) => ({
      ...prev,
      days: { ...prev.days, [day]: { ...prev.days[day], open } },
    }))
  }

  const setDayTime = (day: DayKey, field: 'from' | 'to', value: string) => {
    setOpeningHours((prev) => ({
      ...prev,
      days: { ...prev.days, [day]: { ...prev.days[day], [field]: value } },
    }))
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <h1 className="font-bold text-2xl text-gray-900 mb-6">Configurações da Loja</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Capa */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">Foto de capa</h2>
          {bannerPreview ? (
            <div className="relative rounded-xl overflow-hidden aspect-[3/1]">
              <img src={bannerPreview} alt="Capa" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleRemoveBanner}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-lg px-2 py-1 text-xs hover:bg-black/70 transition-colors"
              >
                Remover
              </button>
            </div>
          ) : (
            <div
              onClick={() => bannerInputRef.current?.click()}
              className="aspect-[3/1] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
            >
              <p className="text-sm text-gray-400 font-medium">Clique para adicionar capa</p>
              <p className="text-xs text-gray-300">Recomendado: 1200×400px</p>
            </div>
          )}
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
          {!bannerPreview && (
            <Button type="button" variant="secondary" size="sm" onClick={() => bannerInputRef.current?.click()}>
              Selecionar imagem
            </Button>
          )}
        </div>

        {/* Logo */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">Logo da loja</h2>
          <div className="flex items-center gap-4">
            <img
              src={logoPreview ?? getImageFallback()}
              alt="Logo"
              onError={(e) => { e.currentTarget.src = getImageFallback() }}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-gray-100 shrink-0"
            />
            <div className="flex flex-col gap-2">
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <Button type="button" variant="secondary" size="sm" onClick={() => logoInputRef.current?.click()}>
                Trocar logo
              </Button>
              {logoPreview && (
                <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo}>
                  Remover
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">Informações</h2>
          <Input label="Nome da loja *" error={errors.name?.message} {...register('name')} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Descrição
              <span className="text-gray-400 font-normal ml-1">({descCount}/200)</span>
            </label>
            <textarea
              rows={3}
              maxLength={200}
              placeholder="Apresente sua loja em poucas palavras..."
              className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm placeholder-gray-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none transition-all duration-200"
              {...register('description')}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <Input
            label="WhatsApp *"
            error={errors.whatsapp_number?.message}
            hint="Ex: 5537999999999 — inclua DDI+DDD+número"
            placeholder="5537999999999"
            {...register('whatsapp_number')}
          />

          <Input
            label="Endereço"
            error={errors.address?.message}
            placeholder="Rua, número, bairro, cidade..."
            {...register('address')}
          />
        </div>

        {/* Redes sociais */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">Redes sociais</h2>
          <Input
            label="Instagram"
            placeholder="https://instagram.com/sualoja"
            error={errors.instagram_url?.message}
            {...register('instagram_url')}
          />
          <Input
            label="Facebook"
            placeholder="https://facebook.com/sualoja"
            error={errors.facebook_url?.message}
            {...register('facebook_url')}
          />
        </div>

        {/* Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Status da loja</p>
            <p className="text-sm text-gray-500">
              {watch('is_open') ? 'Aberta para pedidos' : 'Fechada no momento'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setValue('is_open', !watch('is_open'))}
            aria-label="Toggle status da loja"
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${watch('is_open') ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${watch('is_open') ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Horário de funcionamento */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Horário de funcionamento</h2>
              <p className="text-xs text-gray-500 mt-0.5">Configure os horários por dia da semana</p>
            </div>
            <button
              type="button"
              onClick={() => setHoursEnabled(!openingHours.enabled)}
              aria-label="Toggle horário de funcionamento"
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${openingHours.enabled ? 'bg-brand-500' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${openingHours.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {openingHours.enabled && (
            <div className="flex flex-col gap-2">
              {DAY_LABELS.map(({ key, label }) => {
                const day = openingHours.days[key]
                return (
                  <div key={key} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    {/* Toggle do dia */}
                    <button
                      type="button"
                      onClick={() => setDayOpen(key, !day.open)}
                      aria-label={`${label} aberto`}
                      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors shrink-0 ${day.open ? 'bg-green-500' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${day.open ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>

                    {/* Nome do dia */}
                    <span className={`text-sm font-medium w-16 shrink-0 ${day.open ? 'text-gray-900' : 'text-gray-400'}`}>
                      {label}
                    </span>

                    {/* Horários */}
                    {day.open ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={day.from}
                          onChange={(e) => setDayTime(key, 'from', e.target.value)}
                          className="flex-1 min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                        />
                        <span className="text-xs text-gray-400 shrink-0">até</span>
                        <input
                          type="time"
                          value={day.to}
                          onChange={(e) => setDayTime(key, 'to', e.target.value)}
                          className="flex-1 min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                        />
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 flex-1">Fechado</span>
                    )}
                  </div>
                )
              })}

              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                ℹ️ O status "Aberto/Fechado" é calculado automaticamente. O toggle manual acima pode forçar fechamento em emergências.
              </p>
            </div>
          )}
        </div>

        {/* Cores */}
        <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="font-semibold text-gray-900">Cor primária</h2>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={isValidColor ? watchColor : '#f97316'}
              onChange={(e) => setValue('primary_color', e.target.value)}
              aria-label="Seletor de cor"
              className="w-12 h-10 rounded-xl border border-gray-300 cursor-pointer p-1"
            />
            <input
              type="text"
              value={watchColor}
              onChange={(e) => setValue('primary_color', e.target.value)}
              placeholder="#f97316"
              maxLength={7}
              className="w-36 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-mono outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
            />
          </div>
          {errors.primary_color && <p className="text-xs text-red-500">{errors.primary_color.message}</p>}
          <div>
            <p className="text-xs text-gray-500 mb-2">Preview do botão:</p>
            <button
              type="button"
              style={{ backgroundColor: isValidColor ? watchColor : '#f97316' }}
              className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm transition-all"
            >
              Exemplo de botão
            </button>
          </div>
        </div>

        {/* Alerta — campos obrigatórios com erro */}
        {(errors.name || errors.whatsapp_number) && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex flex-col gap-1.5">
            <p className="text-sm font-semibold text-red-700">Campos obrigatórios faltando</p>
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {errors.name.message}
              </p>
            )}
            {errors.whatsapp_number && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {errors.whatsapp_number.message}
              </p>
            )}
          </div>
        )}

        <Button type="submit" fullWidth size="lg" loading={saving}>
          Salvar alterações
        </Button>
      </form>
    </div>
  )
}
