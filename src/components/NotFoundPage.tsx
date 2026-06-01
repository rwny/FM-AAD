import { useNavigate, useParams } from 'react-router-dom'
import { buildings } from '../utils/buildings'

export function NotFoundPage() {
  const navigate = useNavigate()
  const params = useParams()
  const badPath = params['*'] || ''

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans select-none flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-7xl mb-4">🏚️</div>
        <h1 className="text-2xl font-black text-slate-800 dark:text-zinc-100 mb-2">
          ไม่พบอาคาร
        </h1>
        <p className="text-sm text-stone-500 dark:text-zinc-500 mb-1 font-mono">
          <code>/{badPath}</code>
        </p>
        <p className="text-xs text-stone-400 dark:text-zinc-600 mb-6">
          อาคารนี้ไม่มีในระบบ หรือยังไม่ได้ลงทะเบียน
        </p>

        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            กลับหน้าแรก
          </button>
          <button
            onClick={() => navigate('/AR15/ac')}
            className="px-5 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors"
          >
            ไป AR15
          </button>
        </div>

        <p className="text-[10px] text-stone-400 dark:text-zinc-600 mt-8">
          อาคารทั้งหมด {buildings.length} อาคาร · AR01–AR31
        </p>
      </div>
    </div>
  )
}
