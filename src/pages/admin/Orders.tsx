import { useEffect, useState, useRef } from 'react'
import {
  ShoppingBag, ChevronDown, ChevronUp, Search,
  Bike, Store, Clock, TrendingUp, Package, XCircle, RefreshCw, AlertCircle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Order, OrderStatus } from '../../types'
import { formatCurrency } from '../../lib/utils'
import { Skeleton } from '../../components/ui/Skeleton'
import { useToast } from '../../components/ui/Toast'

type Period = 'hoje' | 'semana' | 'mes' | 'todos'

const STATUS_LABELS: Record<OrderStatus, string> = {
  novo: 'Novo',
  em_preparo: 'Em Preparo',
  saiu_entrega: 'Saiu p/ Entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  novo: 'bg-blue-100 text-blue-700',
  em_preparo: 'bg-yellow-100 text-yellow-700',
  saiu_entrega: 'bg-purple-100 text-purple-700',
  entregue: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-600',
}

const STATUS_FLOW: OrderStatus[] = ['novo', 'em_preparo', 'saiu_entrega', 'entregue']

function periodStart(p: Period): string | null {
  const now = new Date()
  if (p === 'hoje') { now.setHours(0, 0, 0, 0); return now.toISOString() }
  if (p === 'semana') { now.setDate(now.getDate() - now.getDay()); now.setHours(0, 0, 0, 0); return now.toISOString() }
  if (p === 'mes') { now.setDate(1); now.setHours(0, 0, 0, 0); return now.toISOString() }
  return null
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function shortId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`
}

export function Orders() {
  const { showToast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [period, setPeriod] = useState<Period>('hoje')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'todos'>('todos')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(0)
  const storeIdRef = useRef<string | null>(null)

  // Fetch único, limpo — period e refresh são as únicas dependências reais
  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setDbError(null)

      try {
        // Busca store_id uma vez e guarda em ref para não repetir
        if (!storeIdRef.current) {
          const { data: { session } } = await supabase.auth.getSession()
          if (!session || !active) return

          const { data: profile } = await supabase
            .from('admin_profiles')
            .select('store_id')
            .eq('id', session.user.id)
            .single()

          if (!profile || !active) return
          storeIdRef.current = profile.store_id
        }

        let q = supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('store_id', storeIdRef.current)
          .order('created_at', { ascending: false })

        const start = periodStart(period)
        if (start) q = q.gte('created_at', start)

        const { data, error } = await q
        if (!active) return

        if (error) {
          setDbError(error.message)
          setOrders([])
        } else {
          setOrders(data ?? [])
        }
      } catch (e) {
        if (active) setDbError(String(e))
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [period, refresh])

  const handleStatusChange = async (order: Order, newStatus: OrderStatus) => {
    setUpdatingId(order.id)
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id)
    if (error) {
      showToast('Erro ao atualizar status', 'error')
    } else {
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: newStatus } : o))
    }
    setUpdatingId(null)
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (!error) {
      setOrders((prev) => prev.filter((o) => o.id !== id))
      showToast('Pedido removido')
    } else {
      showToast('Erro ao remover pedido', 'error')
    }
  }

  // Stats sempre em cima de todos os pedidos carregados
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
  const todayOrders = orders.filter((o) => new Date(o.created_at) >= todayStart)
  const monthOrders = orders.filter((o) => new Date(o.created_at) >= monthStart)
  const todayRevenue = todayOrders.filter((o) => o.status !== 'cancelado').reduce((s, o) => s + o.total, 0)
  const monthRevenue = monthOrders.filter((o) => o.status !== 'cancelado').reduce((s, o) => s + o.total, 0)

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === 'todos' || o.status === statusFilter
    const matchSearch = search === '' || o.customer_name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const periods: { key: Period; label: string }[] = [
    { key: 'hoje', label: 'Hoje' },
    { key: 'semana', label: 'Semana' },
    { key: 'mes', label: 'Mês' },
    { key: 'todos', label: 'Todos' },
  ]

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-bold text-2xl text-gray-900">Pedidos</h1>
        <button
          onClick={() => setRefresh((r) => r + 1)}
          disabled={loading}
          aria-label="Atualizar pedidos"
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-40"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Erro de banco de dados */}
      {dbError && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Erro ao carregar pedidos</p>
            <p className="text-xs text-red-600 mt-1 font-mono">{dbError}</p>
            <p className="text-xs text-red-500 mt-2">
              Se a tabela não existe, rode o SQL de criação no Supabase e recarregue.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Pedidos hoje', value: todayOrders.length, sub: formatCurrency(todayRevenue), Icon: ShoppingBag, color: 'text-brand-600 bg-brand-50' },
          { label: 'Pedidos no mês', value: monthOrders.length, sub: formatCurrency(monthRevenue), Icon: TrendingUp, color: 'text-green-600 bg-green-50' },
          { label: 'Em andamento', value: orders.filter((o) => o.status === 'em_preparo' || o.status === 'saiu_entrega').length, sub: 'em preparo/entrega', Icon: Clock, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'Entregues', value: orders.filter((o) => o.status === 'entregue').length, sub: 'concluídos', Icon: Package, color: 'text-blue-600 bg-blue-50' },
        ].map(({ label, value, sub, Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{loading ? '—' : value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{loading ? '' : sub}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex flex-col gap-3">
        <div className="flex gap-2 flex-wrap">
          {periods.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${period === key ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'todos')}
            className="rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white"
          >
            <option value="todos">Todos os status</option>
            {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum pedido encontrado</p>
          {period !== 'todos' && (
            <button onClick={() => setPeriod('todos')} className="mt-2 text-sm text-brand-500 hover:underline">
              Ver todos os períodos
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((order) => {
            const isExpanded = expanded === order.id
            const isUpdating = updatingId === order.id
            const currentIdx = STATUS_FLOW.indexOf(order.status)
            const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1 ? STATUS_FLOW[currentIdx + 1] : null

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                >
                  <div className="shrink-0">
                    {order.delivery_method === 'Delivery'
                      ? <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Bike className="w-4 h-4" /></div>
                      : <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Store className="w-4 h-4" /></div>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-gray-400 font-medium">{shortId(order.id)}</span>
                      <span className="font-semibold text-sm text-gray-900 truncate">{order.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">{formatDate(order.created_at)} às {formatTime(order.created_at)}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{order.payment_method}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-sm text-gray-900">{formatCurrency(order.total)}</span>
                    <span className={`hidden sm:inline-flex text-xs font-semibold rounded-full px-2.5 py-1 ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 flex flex-col gap-4">
                    <div className="sm:hidden">
                      <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>

                    <div className="text-sm text-gray-700">
                      {order.delivery_method === 'Delivery' ? '🛵 Delivery' : '🏪 Retirada na loja'}
                      {order.address ? ` — ${order.address}` : ''}
                    </div>

                    <div className="flex flex-col gap-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Itens do pedido</p>
                      {(order.order_items ?? []).map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-3 py-1.5 border-b border-gray-50 last:border-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{item.quantity}× {item.product_name}</p>
                            {item.observation && (
                              <p className="text-xs text-gray-400 mt-0.5">📝 {item.observation}</p>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-700 shrink-0">
                            {formatCurrency(item.product_price * item.quantity)}
                          </p>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-1">
                        <span className="font-semibold text-gray-700 text-sm">Total</span>
                        <span className="font-bold text-brand-600">{formatCurrency(order.total)}</span>
                      </div>
                    </div>

                    {order.status !== 'cancelado' && (
                      <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100">
                        {nextStatus && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(order, nextStatus)}
                            className="flex-1 min-w-32 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 active:scale-95"
                          >
                            {isUpdating ? '...' : `→ ${STATUS_LABELS[nextStatus]}`}
                          </button>
                        )}
                        {order.status !== 'entregue' && (
                          <button
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(order, 'cancelado')}
                            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-medium transition-all disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" /> Cancelar
                          </button>
                        )}
                      </div>
                    )}

                    {order.status === 'cancelado' && (
                      <div className="flex justify-end pt-1 border-t border-gray-100">
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="px-3 py-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Remover pedido
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
