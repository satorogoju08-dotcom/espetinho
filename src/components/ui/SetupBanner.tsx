import { AlertTriangle } from 'lucide-react'

export function SetupBanner() {
  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900/95 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
          <h1 className="font-bold text-gray-900 text-lg">Configure o Supabase</h1>
        </div>

        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          O arquivo <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">.env</code> ainda
          contém valores de exemplo. Siga os passos abaixo para conectar ao seu projeto Supabase:
        </p>

        <ol className="flex flex-col gap-3 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span>Acesse <strong>supabase.com</strong>, entre no seu projeto e vá em <strong>Settings → API</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span>Copie a <strong>Project URL</strong> e a <strong>anon public key</strong></span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span>Abra o arquivo <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">.env</code> na raiz do projeto e substitua os valores</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-brand-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <span>Salve e reinicie o servidor com <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">npm run dev</code></span>
          </li>
        </ol>

        <div className="mt-5 bg-gray-50 rounded-xl p-4 font-mono text-xs text-gray-600 leading-relaxed">
          <p className="text-gray-400 mb-1"># .env</p>
          <p>VITE_SUPABASE_URL=<span className="text-brand-600">https://xxxx.supabase.co</span></p>
          <p>VITE_SUPABASE_ANON_KEY=<span className="text-brand-600">eyJhbGci...</span></p>
        </div>
      </div>
    </div>
  )
}
