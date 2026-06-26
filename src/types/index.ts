export interface DaySchedule {
  open: boolean
  from: string
  to: string
}

export interface OpeningHours {
  enabled: boolean
  days: {
    seg: DaySchedule
    ter: DaySchedule
    qua: DaySchedule
    qui: DaySchedule
    sex: DaySchedule
    sab: DaySchedule
    dom: DaySchedule
  }
}

export type DayKey = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom'

export interface Store {
  id: string; name: string; slug: string; logo_url: string | null
  banner_url: string | null; cover_url: string | null
  instagram_url: string | null; facebook_url: string | null
  whatsapp_number: string; whatsapp_display: string | null
  address: string; primary_color: string
  secondary_color: string; description: string; is_open: boolean
  opening_hours: OpeningHours | null
  created_at: string; updated_at: string
}

export interface Category {
  id: string; store_id: string; name: string; emoji: string
  order_index: number; active: boolean; created_at: string
}

export interface Product {
  id: string; store_id: string; category_id: string | null
  name: string; description: string; price: number
  promotional_badge: boolean; active: boolean; in_stock: boolean
  order_index: number; created_at: string; updated_at: string
  category?: Category; media?: ProductMedia[]
}

export interface ProductMedia {
  id: string; product_id: string; url: string
  type: 'image' | 'video'; order_index: number; created_at: string
}

export interface CartItem { product: Product; quantity: number; observation: string }

export type OrderStatus = 'novo' | 'em_preparo' | 'saiu_entrega' | 'entregue' | 'cancelado'

export interface OrderItem {
  id: string; order_id: string; product_id: string | null
  product_name: string; product_price: number; quantity: number
  observation: string; created_at: string
}

export interface Order {
  id: string; store_id: string; customer_name: string
  delivery_method: DeliveryMethod; address: string; payment_method: PaymentMethod
  total: number; status: OrderStatus; created_at: string; updated_at: string
  order_items?: OrderItem[]
}

export interface AdminProfile { id: string; store_id: string; email: string; name: string; created_at: string }

export type PaymentMethod = 'Pix' | 'Cartão de Crédito' | 'Cartão de Débito' | 'Dinheiro' | 'Pagamento na Entrega'

export type DeliveryMethod = 'Retirada na Loja' | 'Delivery'

export interface CheckoutFormData {
  customer_name: string; delivery_method: DeliveryMethod
  address?: string; payment_method: PaymentMethod
  change_for?: string
}
