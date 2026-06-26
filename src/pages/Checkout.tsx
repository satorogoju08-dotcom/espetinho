import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, Plus, Minus, MessageCircle } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { buildWhatsAppMessage, openWhatsApp } from '../lib/whatsapp'
import { useStore } from '../hooks/useStore'
import { supabase } from '../lib/supabase'
import { formatCurrency, getImageFallback } from '../lib/utils'
import type { DeliveryMethod, PaymentMethod } from '../types'
import { Button } from '../components/ui/Button'

const STORE_SLUG = 'espetinho-file'

const paymentMethods: PaymentMethod[] = [
  'Pix',
  'Cartão de Crédito',
  'Cartão de Débito',
  'Dinheiro',
  'Pagamento na Entrega',
]

export function Checkout() {
  const navigate = useNavigate()
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore()
  const { store } = useStore(STORE_SLUG)

  const [customerName, setCustomerName] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('Retirada na Loja')
  const [address, setAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix')
  const [needsChange, setNeedsChange] = useState<'sim' | 'nao' | null>(null)
  const [changeFor, setChangeFor] = useState('')

  const [nameError, setNameError] = useState('')
  const [addressError, setAddressError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (items.length === 0) {
    navigate('/')
    return null
  }

  const handleSubmit = async () => {
    let valid = true
    if (!customerName.trim()) {
      setNameError('Informe seu nome')
      valid = false
    } else {
      setNameError('')
    }
    if (deliveryMethod === 'Delivery' && !address.trim()) {
      setAddressError('Informe o endereço de entrega')
      valid = false
    } else {
      setAddressError('')
    }
    if (!valid) return
    if (!store) return

    setSubmitting(true)

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: store.id,
          customer_name: customerName.trim(),
          delivery_method: deliveryMethod,
          address: deliveryMethod === 'Delivery' ? address.trim() : '',
          payment_method: paymentMethod,
          total: getTotalPrice(),
        })
        .select()
        .single()

      if (orderError) throw orderError

      if (order) {
        const { error: itemsError } = await supabase.from('order_items').insert(
          items.map((item) => ({
            order_id: order.id,
            product_id: item.product.id,
            product_name: item.product.name,
            product_price: item.product.price,
            quantity: item.quantity,
            observation: item.observation,
          }))
        )
        if (itemsError) console.error('order_items:', itemsError.message)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? ''
      console.error('Falha ao salvar pedido no banco:', msg)
      if (msg.includes('does not exist') || msg.includes('relation')) {
        alert('⚠️ Pedido enviado pelo WhatsApp, mas não foi salvo no painel admin.\n\nRode o SQL de criação das tabelas orders/order_items no Supabase.')
      }
    }

    const changeValue =
      paymentMethod === 'Dinheiro'
        ? needsChange === 'nao' ? 'sem_troco' : changeFor.trim() || undefined
        : undefined

    const msg = buildWhatsAppMessage(store.name, items, {
      customer_name: customerName,
      delivery_method: deliveryMethod,
      address: deliveryMethod === 'Delivery' ? address : undefined,
      payment_method: paymentMethod,
      change_for: changeValue,
    }, getTotalPrice())

    openWhatsApp(store.whatsapp_number, msg)
    clearCart()
    setSubmitting(false)
    navigate('/')
  }

  const inputClass = "w-full rounded-xl border border-orange-950/60 bg-[#0f0800] px-3 py-2.5 text-sm text-white placeholder-orange-200/30 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all duration-200"
  const cardClass = "bg-[#1a0d00] rounded-2xl p-4 border border-orange-950/40 flex flex-col gap-3"
  const sectionTitle = "font-condensed font-bold text-base text-white uppercase tracking-wide"

  return (
    <div className="min-h-screen bg-[#0f0800] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0500] border-b border-orange-950/60">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="p-2 rounded-xl hover:bg-white/10 text-orange-200/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">Seu pedido</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 flex flex-col gap-4">
        {/* Itens */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>Itens do pedido</h2>
          {items.map((item) => {
            const firstImg = item.product.media?.find((m) => m.type === 'image')
            return (
              <div key={item.product.id} className="flex gap-3 py-2 border-b border-orange-950/40 last:border-0">
                {firstImg ? (
                  <img
                    src={firstImg.url}
                    alt={item.product.name}
                    onError={(e) => { e.currentTarget.src = getImageFallback() }}
                    className="w-14 h-14 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-[#2a1500] shrink-0 flex items-center justify-center text-xl opacity-40">
                    🍢
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-condensed font-semibold text-sm text-white truncate">{item.product.name}</p>
                  {item.observation && (
                    <p className="text-xs text-orange-200/40 truncate">📝 {item.observation}</p>
                  )}
                  <p className="text-sm font-bold text-brand-500 mt-0.5">
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-white/[0.08] rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        aria-label="Diminuir quantidade"
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-orange-200/60 transition-colors active:scale-95"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        aria-label="Aumentar quantidade"
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-orange-200/60 transition-colors active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      aria-label="Remover item"
                      className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
          <div className="flex justify-between items-center pt-2 border-t border-orange-950/40">
            <span className="font-condensed font-semibold text-orange-200/60">Total</span>
            <span className="font-display text-2xl text-brand-500 tracking-wide">{formatCurrency(getTotalPrice())}</span>
          </div>
        </div>

        {/* Dados */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>Seus dados</h2>
          <div className="flex flex-col gap-1">
            <label htmlFor="customerName" className="text-sm font-medium text-orange-200/70">
              Nome completo *
            </label>
            <input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ex: João Silva"
              className={inputClass}
            />
            {nameError && <p className="text-xs text-red-400">{nameError}</p>}
          </div>
        </div>

        {/* Entrega */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>Tipo de entrega</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['Retirada na Loja', 'Delivery'] as DeliveryMethod[]).map((method) => (
              <button
                key={method}
                onClick={() => setDeliveryMethod(method)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-sm font-condensed font-semibold ${
                  deliveryMethod === method
                    ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                    : 'border-orange-950/60 text-orange-200/60 hover:border-orange-700/40'
                }`}
              >
                <span className="text-2xl">{method === 'Retirada na Loja' ? '🏪' : '🛵'}</span>
                {method}
              </button>
            ))}
          </div>

          {deliveryMethod === 'Delivery' && (
            <div className="flex flex-col gap-1 transition-all duration-200">
              <label htmlFor="address" className="text-sm font-medium text-orange-200/70">
                Endereço de entrega *
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro..."
                className={inputClass}
              />
              {addressError && <p className="text-xs text-red-400">{addressError}</p>}
            </div>
          )}
        </div>

        {/* Pagamento */}
        <div className={cardClass}>
          <h2 className={sectionTitle}>Forma de pagamento</h2>
          <div className="grid grid-cols-2 gap-2">
            {paymentMethods.map((method) => (
              <button
                key={method}
                onClick={() => {
                  setPaymentMethod(method)
                  if (method !== 'Dinheiro') { setNeedsChange(null); setChangeFor('') }
                }}
                className={`px-3 py-3 rounded-xl border-2 text-sm font-condensed font-semibold transition-all duration-200 text-left ${
                  paymentMethod === method
                    ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                    : 'border-orange-950/60 text-orange-200/60 hover:border-orange-700/40'
                }`}
              >
                {method}
              </button>
            ))}
          </div>

          {paymentMethod === 'Dinheiro' && (
            <div className="flex flex-col gap-3 pt-2 border-t border-orange-950/40">
              <p className="text-sm font-medium text-orange-200/70">Precisa de troco?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setNeedsChange('nao'); setChangeFor('') }}
                  className={`py-2.5 rounded-xl border-2 text-sm font-condensed font-semibold transition-all duration-200 ${
                    needsChange === 'nao'
                      ? 'border-green-500 bg-green-900/20 text-green-400'
                      : 'border-orange-950/60 text-orange-200/60 hover:border-orange-700/40'
                  }`}
                >
                  Não preciso
                </button>
                <button
                  onClick={() => setNeedsChange('sim')}
                  className={`py-2.5 rounded-xl border-2 text-sm font-condensed font-semibold transition-all duration-200 ${
                    needsChange === 'sim'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                      : 'border-orange-950/60 text-orange-200/60 hover:border-orange-700/40'
                  }`}
                >
                  Sim, preciso
                </button>
              </div>

              {needsChange === 'sim' && (
                <div className="flex flex-col gap-1">
                  <label htmlFor="changeFor" className="text-sm font-medium text-orange-200/70">
                    Troco para quanto? *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-orange-200/40 font-medium">R$</span>
                    <input
                      id="changeFor"
                      type="number"
                      min="0"
                      step="0.01"
                      value={changeFor}
                      onChange={(e) => setChangeFor(e.target.value)}
                      placeholder="0,00"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                  <p className="text-xs text-orange-200/40">
                    Total do pedido: <span className="font-semibold text-orange-200/60">{formatCurrency(getTotalPrice())}</span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0500] border-t border-orange-950/60 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleSubmit}
            fullWidth
            size="lg"
            loading={submitting}
            className="bg-green-600 hover:bg-green-700 text-white gap-2 font-condensed font-bold tracking-wide"
          >
            <MessageCircle className="w-5 h-5" />
            Enviar pedido pelo WhatsApp
          </Button>
        </div>
      </div>
    </div>
  )
}
