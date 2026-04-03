import { useState, useRef, useEffect } from 'react'
import { Search, X, Building2, Wind, Share2, Sofa, Zap, ChevronRight } from 'lucide-react'
import type { BIMMode } from '../types/bim'

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

  const getIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'room': return <Building2 className="w-3.5 h-3.5" />
      case 'ac': return <Wind className="w-3.5 h-3.5" />
      case 'ee': return <Zap className="w-3.5 h-3.5" />
      case 'furniture': return <Sofa className="w-3.5 h-3.5" />
      case 'connection': return <Share2 className="w-3.5 h-3.5" />
      default: return <ChevronRight className="w-3.5 h-3.5" />
    }
  }

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'room': return 'text-blue-600 bg-blue-50'
      case 'ac': return 'text-cyan-600 bg-cyan-50'
      case 'ee': return 'text-amber-600 bg-amber-50'
      case 'furniture': return 'text-emerald-600 bg-emerald-50'
      case 'connection': return 'text-purple-600 bg-purple-50'
      default: return 'text-slate-600 bg-slate-50'
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
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            onQueryChange(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search everything... (Ctrl+K)"
          className="w-full bg-white/50 border border-slate-200 rounded-[8px] py-1.5 pl-9 pr-8 text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-slate-700 placeholder:text-slate-400"
        />
        {query && (
          <button
            onClick={() => {
              onQueryChange('')
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded text-slate-400"
          >
            <X className="w-3 h-3" />
          </button>
        )}
        <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
          ⌘K
        </kbd>
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-[10px] border border-slate-200 shadow-xl z-50 max-h-[400px] overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No results found for "{query}"
            </div>
          ) : (
            <>
              <div className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              <div className="py-1">
                {results.map((result, idx) => (
                  <button
                    key={`${result.id}-${idx}`}
                    onClick={() => handleSelect(result)}
                    className="w-full px-3 py-2 flex items-center gap-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <span className={`shrink-0 p-1 rounded ${getTypeColor(result.type)}`}>
                      {getIcon(result.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-slate-800 truncate">
                        {result.label}
                      </div>
                      {result.sublabel && (
                        <div className="text-[11px] text-slate-400 truncate">
                          {result.sublabel}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-[10px] font-bold text-slate-300 uppercase">
                      {result.type === 'connection' ? 'Link' : result.type}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  </button>
                ))}
              </div>
              <div className="px-3 py-2 text-[10px] text-slate-400 border-t border-slate-100 bg-slate-50/50 rounded-b-[10px]">
                <span className="font-medium">Tips:</span> Search by ID, type, brand, status, or connection
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
