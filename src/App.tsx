import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { SetupBanner } from './components/ui/SetupBanner'
import { supabaseConfigured } from './lib/supabase'
import { Catalog } from './pages/Catalog'
import { Checkout } from './pages/Checkout'
import { Login } from './pages/admin/Login'
import { AdminLayout } from './components/admin/AdminLayout'
import { PrivateRoute } from './components/admin/PrivateRoute'
import { Dashboard } from './pages/admin/Dashboard'
import { Products } from './pages/admin/Products'
import { Categories } from './pages/admin/Categories'
import { Settings } from './pages/admin/Settings'
import { Orders } from './pages/admin/Orders'

export default function App() {
  return (
    <ToastProvider>
      {!supabaseConfigured && <SetupBanner />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin/login" element={<Login />} />
          <Route element={<PrivateRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/produtos" element={<Products />} />
              <Route path="/admin/categorias" element={<Categories />} />
              <Route path="/admin/pedidos" element={<Orders />} />
              <Route path="/admin/configuracoes" element={<Settings />} />
            </Route>
          </Route>
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <p className="text-6xl mb-4">🍽️</p>
                  <h1 className="font-bold text-2xl text-gray-900">Página não encontrada</h1>
                  <a href="/" className="text-brand-500 hover:underline mt-2 block text-sm">
                    Voltar ao catálogo
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
