import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, FolderOpen, Tag, AlertCircle, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Skeleton } from '../../components/ui/Skeleton'

interface Stats {
  totalProducts: number
  activeCategories: number
  promotional: number
  outOfStock: number
}

interface AdminProfileData {
  store_id: string
  stores?: { name: string }
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('store_id, stores(name)')
        .eq('id', session.user.id)
        .single<AdminProfileData>()

      if (!profile) return
      setStoreName((profile.stores as unknown as { name: string })?.name ?? '')

      const storeId = profile.store_id

      const [
        { count: totalProducts },
        { count: activeCategories },
        { count: promotional },
        { count: outOfStock },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('active', true),
        supabase.from('categories').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('active', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('promotional_badge', true).eq('active', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('store_id', storeId).eq('in_stock', false).eq('active', true),
      ])

      setStats({
        totalProducts: totalProducts ?? 0,
        activeCategories: activeCategories ?? 0,
        promotional: promotional ?? 0,
        outOfStock: outOfStock ?? 0,
      })
      setLoading(false)
    }

    fetchData()
  }, [])

  const statCards = [
    { label: 'Total Produtos', value: stats?.totalProducts, Icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Categorias Ativas', value: stats?.activeCategories, Icon: FolderOpen, color: 'bg-green-50 text-green-600' },
    { label: 'Em Promoção', value: stats?.promotional, Icon: Tag, color: 'bg-brand-50 text-brand-600' },
    { label: 'Fora de Estoque', value: stats?.outOfStock, Icon: AlertCircle, color: 'bg-red-50 text-red-600' },
  ]

  const quickLinks = [
    { to: '/admin/produtos', label: 'Produtos', Icon: Package, desc: 'Adicione ou edite produtos' },
    { to: '/admin/categorias', label: 'Categorias', Icon: FolderOpen, desc: 'Organize as categorias' },
    { to: '/admin/configuracoes', label: 'Configurações', Icon: Tag, desc: 'Ajuste as info da loja' },
  ]

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bold text-2xl text-gray-900">Dashboard</h1>
          {storeName && <p className="text-sm text-gray-500 mt-0.5">{storeName}</p>}
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          Ver catálogo público
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-sm">
            {loading ? (
              <>
                <Skeleton className="w-9 h-9 mb-3" />
                <Skeleton className="h-7 w-12 mb-1" />
                <Skeleton className="h-3 w-20" />
              </>
            ) : (
              <>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <h2 className="font-bold text-gray-900 mb-3">Atalhos rápidos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickLinks.map(({ to, label, Icon, desc }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 group-hover:bg-brand-100 transition-colors">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
