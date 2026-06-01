import { buildings, type Building } from '../utils/buildings'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'

const TITLE_BG = "AAD · FACULTY OF ARCHITECTURE"

export function LandingPage() {
  const navigate = useNavigate()
  const switchBuilding = useAppStore(s => s.switchBuilding)

  const handleSelect = (b: Building) => {
    switchBuilding(b.code)
    navigate(`/${b.code}/ac`)
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 font-sans select-none">
      {/* Header */}
      <header className="border-b border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">🏗️ AAD</h1>
          <p className="text-xs text-stone-500 dark:text-zinc-500 mt-0.5">
            คณะสถาปัตยกรรม ศิลปะและการออกแบบ · ระบบบริหารจัดการอาคาร
          </p>
        </div>
        <div className="text-right flex items-center gap-3">
          <button
            onClick={() => navigate('/master')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5 transition-colors"
          >
            📊 Master
          </button>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-zinc-500">
              Buildings
            </div>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {buildings.length}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats bar */}
        <div className="flex gap-3 mb-6 flex-wrap text-sm">
          <span className="text-stone-500 dark:text-zinc-500">
            อาคารทั้งหมด <strong className="text-slate-900 dark:text-zinc-100">{buildings.length}</strong>
          </span>
          <span className="text-stone-300 dark:text-zinc-700">|</span>
          <span className="text-stone-500 dark:text-zinc-500">
            มีโมเดล 3D <strong className="text-emerald-600 dark:text-emerald-400">{buildings.filter(b => b.hasModel).length}</strong>
          </span>
          <span className="text-stone-300 dark:text-zinc-700">|</span>
          <span className="text-stone-500 dark:text-zinc-500">
            ยังไม่มี 3D <strong className="text-stone-400 dark:text-zinc-500">{buildings.filter(b => !b.hasModel).length}</strong>
          </span>
        </div>

        {/* Building Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {buildings.map((b) => (
            <button
              key={b.code}
              onClick={() => handleSelect(b)}
              className={`
                relative group text-left
                bg-white dark:bg-zinc-900
                border border-stone-200 dark:border-zinc-800
                rounded-xl p-4
                hover:border-amber-400 dark:hover:border-amber-600
                hover:shadow-md hover:shadow-amber-200/20 dark:hover:shadow-amber-900/20
                transition-all duration-150
                ${b.hasModel ? 'ring-1 ring-emerald-200 dark:ring-emerald-900' : ''}
              `}
            >
              {/* Has model badge */}
              {b.hasModel && (
                <span className="absolute top-2 right-2 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded">
                  3D
                </span>
              )}

              {/* Icon */}
              <div className="text-2xl mb-2 opacity-80">
                {b.name === 'x' ? '🏚️' : b.hasModel ? '🏛️' : '🏗️'}
              </div>

              {/* Code */}
              <div className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                {b.code}
              </div>

              {/* Name */}
              <div className="text-sm font-medium mt-0.5 line-clamp-2 leading-tight">
                {b.name === 'x' ? '-' : b.name}
              </div>

              {/* Floor */}
              <div className="text-[10px] text-stone-400 dark:text-zinc-600 mt-1.5 font-mono">
                {b.floors} ชั้น
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-zinc-800 px-6 py-3 text-[10px] text-stone-400 dark:text-zinc-600 text-center">
        AAD FM — Facility Management BIM Digital Twin
      </footer>
    </div>
  )
}
