import type { CartItem, CheckoutFormData } from '../types'
import { formatCurrency } from './utils'

export function buildWhatsAppMessage(
  storeName: string,
  items: CartItem[],
  checkout: CheckoutFormData,
  total: number
): string {
  const separator = '━━━━━━━━━━━━━━━━━━━'

  const itemLines = items
    .map((item) => {
      const subtotal = formatCurrency(item.product.price * item.quantity)
      const obs = item.observation ? `\n    📝 _${item.observation}_` : ''
      return `▪️ *${item.quantity}x ${item.product.name}*\n    💰 ${subtotal}${obs}`
    })
    .join('\n')

  const deliveryLine =
    checkout.delivery_method === 'Delivery'
      ? `🛵 *Entrega:* ${checkout.address}`
      : `🏪 *Retirada na loja*`

  const paymentEmojis: Record<string, string> = {
    Pix: '💠',
    'Cartão de Crédito': '💳',
    'Cartão de Débito': '💳',
    Dinheiro: '💵',
    'Pagamento na Entrega': '🤝',
  }
  const payEmoji = paymentEmojis[checkout.payment_method] ?? '💳'

  const changeLine =
    checkout.payment_method === 'Dinheiro' && checkout.change_for
      ? checkout.change_for === 'sem_troco'
        ? `💵 *Troco:* Não precisa`
        : `💵 *Troco para:* R$ ${checkout.change_for}`
      : null

  const lines = [
    `🛍️ *NOVO PEDIDO*`,
    `📍 *${storeName}*`,
    separator,
    `👤 *Cliente:* ${checkout.customer_name}`,
    deliveryLine,
    `${payEmoji} *Pagamento:* ${checkout.payment_method}`,
    ...(changeLine ? [changeLine] : []),
    separator,
    `🛒 *ITENS DO PEDIDO:*`,
    ``,
    itemLines,
    ``,
    separator,
    `💰 *TOTAL: ${formatCurrency(total)}*`,
    separator,
    `✅ _Pedido enviado via Menuflux_`,
  ]

  return encodeURIComponent(lines.join('\n'))
}

export function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = phone.replace(/\D/g, '')
  window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank')
}
