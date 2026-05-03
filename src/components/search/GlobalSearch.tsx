import { useState, useRef, useEffect } from 'react'
import { Search, X, Building2, AirVent, Fan, Share2, Sofa, Zap, ChevronRight } from 'lucide-react'
import type { BIMMode } from '../../types/bim'

interface SearchResult {
  id: string
  type: 'room' | 'ac' | 'ee' | 'furniture' | 'connection'
  label: string
  sublabel?: string
  mode: BIMMode
  data: any
}

interface GlobalSearchProps {
  query: string
  onQueryChange: (q: string) => void
  results: SearchResult[]
  onSelect: (result: SearchResult) => void
}

export function GlobalSearch({ query, onQueryChange, results, onSelect }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        onQueryChange('')
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onQueryChange])

  const getIcon = (result: SearchResult) => {
    switch (result.type) {
      case 'room': return <House className="w-3.5 h-3.5" />
      case 'ac': 
        if (result.id.toLowerCase().startsWith('fcu')) return <AirVent className="w-3.5 h-3.5" />
        if (result.id.toLowerCase().startsWith('cdu')) return <Fan className="w-3.5 h-3.5" />
        return <AirVent className="w-3.5 h-3.5" />
      case 'ee': return <Lightbulb className="w-3.5 h-3.5" />
      case 'furniture': return <Sofa className="w-3.5 h-3.5" />
      case 'connection': return <Share2 className="w-3.5 h-3.5" />
      default: return <ChevronRight className="w-3.5 h-3.5" />
    }
  }

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'room': return 'text-amber-600 bg-amber-50 dark:text-orange-400 dark:bg-orange-950/40'
      case 'ac': return 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/40'
      case 'ee': return 'text-amber-500 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30'
      case 'furniture': return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30'
      case 'connection': return 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30'
      default: return 'text-slate-600 bg-slate-50 dark:text-zinc-400 dark:bg-zinc-900/30'
    }
  }

  const handleSelect = (result: SearchResult) => {
    onSelect(result)
    setIsOpen(false)
    onQueryChange('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 dark:text-zinc-500 group-focus-within:text-orange-600 transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            onQueryChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search everything..."
          className="w-full h-14 bg-white dark:bg-zinc-900 border-2 border-slate-200 dark:border-zinc-800 rounded-[12px] pl-14 pr-12 text-2xl font-black tracking-tighter focus:outline-none focus:ring-4 focus:ring-orange-600/10 transition-all text-slate-700 dark:text-zinc-100 placeholder:text-slate-300 dark:placeholder:text-zinc-700 shadow-lg"
        />
        {query && (
          <button
            onClick={() => {
              onQueryChange('')
              inputRef.current?.focus()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 dark:text-zinc-500"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 1 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-[12px] border-2 border-slate-200 dark:border-zinc-800 shadow-2xl z-50 max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-zinc-500 text-sm font-bold uppercase">
              No results found for "{query}"
            </div>
          ) : (
            <>
              <div className="px-4 py-2.5 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest border-b border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/50">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              <div className="py-1">
                {results.map((result, idx) => (
                  <button
                    key={`${result.id}-${idx}`}
                    onClick={() => handleSelect(result)}
                    className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-amber-50 dark:hover:bg-orange-500/10 transition-colors text-left border-b border-slate-50 last:border-0 dark:border-zinc-800/30"
                  >
                    <span className={`shrink-0 p-1 rounded ${getTypeColor(result.type)}`}>
                      {getIcon(result)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-slate-800 dark:text-zinc-100 truncate">
                        {result.label}
                      </div>
                      {result.sublabel && (
                        <div className="text-[11px] text-slate-400 dark:text-zinc-500 truncate">
                          {result.sublabel}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-slate-300 dark:text-zinc-700 uppercase">
                      {result.type === 'connection' ? 'Link' : result.type}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-700" />
                  </button>
                ))}
              </div>
              <div className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-zinc-500 border-t border-slate-100 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950/50 rounded-b-[10px]">
                <span className="font-black text-amber-800/60 dark:text-orange-500/60 uppercase mr-1">Pro Tip:</span> Search by ID, type, brand, status, or connection
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}





