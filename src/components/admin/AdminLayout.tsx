import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ShoppingBag,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { cn } from '../../lib/utils'

const navItems = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/pedidos', label: 'Pedidos', Icon: ShoppingBag },
  { to: '/admin/produtos', label: 'Produtos', Icon: Package },
  { to: '/admin/categorias', label: 'Categorias', Icon: FolderOpen },
  { to: '/admin/configuracoes', label: 'Configurações', Icon: Settings },
]

export function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const NavContent = () => (
    <nav className="flex flex-col h-full">
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="font-bold text-gray-900 text-sm">Espetinho Só Filé</p>
            <p className="text-xs text-gray-500">Painel Admin</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 flex flex-col gap-1">
        {navItems.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sair
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-white border-r border-gray-100 flex-col z-30">
        <NavContent />
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 h-14 flex items-center px-4 gap-3">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menu"
          className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="font-bold text-gray-900">Painel Admin</span>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative w-60 bg-white h-full flex flex-col shadow-2xl">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Fechar menu"
              className="absolute top-3 right-3 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Content */}
      <main className="md:ml-60 pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  )
}
