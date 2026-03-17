import React, { useState } from 'react'
import { X, PlusCircle, AlertCircle } from 'lucide-react'
import { supabase, ensureAssetExists } from '../../utils/supabase'

interface AddLogModalProps {
  assetId: string
  assetDbId?: string
  roomCode?: string
  category?: string
  onClose: () => void
  onSuccess: () => void
}

export const AddLogModal: React.FC<AddLogModalProps> = ({
  assetId,
  assetDbId,
  roomCode,
  category = 'OTHER',
  onClose,
  onSuccess
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [issue, setIssue] = useState('')
  const [reporter, setReporter] = useState('')
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'Completed' | 'Pending' | 'In Progress' | 'Faulty'>('Completed')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (category === 'AC') {
        // For AC, we link directly using the TEXT assetId (matched with JSON)
        const { error } = await supabase
          .from('ac_maintenance_logs')
          .insert({
            asset_id: assetId,
            date,
            issue,
            reporter: reporter || null,
            note: note || null,
            status
          })
        if (error) throw error
      } else {
        // Existing logic for other assets (Furniture, etc.)
        let finalDbId = assetDbId;

        // If no DB ID, try to find/create the asset first
        if (!finalDbId) {
          if (!roomCode) throw new Error('Cannot create asset record: Room code missing.');
          
          console.log(`📡 Asset ${assetId} not in DB, creating first in ${roomCode}...`);
          finalDbId = await ensureAssetExists(assetId, roomCode, category);
        }

        const { error } = await supabase
          .from('maintenance_logs')
          .insert({
            asset_id: finalDbId,
            date,
            issue,
            reporter: reporter || null,
            note: note || null,
            status
          })

        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to add log')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Add Daily Log</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-[4px] transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-[8px]">
            <div className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">Asset</div>
            <div className="text-sm font-black text-indigo-700">{assetId}</div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-[8px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-rose-700">{error}</p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Issue / Activity</label>
            <input
              type="text"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g., Routine inspection, Repair leg"
              required
              maxLength={100}
              className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Reporter (Optional)</label>
            <input
              type="text"
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Note (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional details..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-slate-200 rounded-[8px] text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Completed', 'In Progress', 'Faulty'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-1 py-2.5 rounded-[8px] text-[10px] font-black uppercase transition-all border ${
                    status === s
                      ? s === 'Completed'
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                        : s === 'In Progress'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                        : 'bg-rose-500 text-white border-rose-600 shadow-md'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-slate-200 rounded-[8px] text-sm font-black text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-[8px] text-sm font-black text-white shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
