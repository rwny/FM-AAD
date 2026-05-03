import React, { useEffect, useState } from 'react'
import { X, PlusCircle, AlertCircle } from 'lucide-react'
import { supabase, ensureAssetExists } from '../../utils/supabase'

async function fetchWONumber(): Promise<string> {
  const year = new Date().getFullYear()
  const { data, error } = await supabase.rpc('next_wo_number', { year_input: year })
  if (error || !data) {
    const fallback = `WO-${year}-${String(Date.now() % 10000).padStart(4, '0')}`
    return fallback
  }
  return data as string
}

interface AddLogModalProps {
  assetId: string
  assetDbId?: string
  roomCode?: string
  category?: string
  logToEdit?: { id: string; date: string; issue: string; reporter?: string; contractor?: string; contractor_contact?: string; status: string; note?: string; wo_number?: string; cost?: number; appointment_date?: string } | null
  initialIssue?: string
  initialWoNumber?: string
  onClose: () => void
  onSuccess: () => void
}

export const AddLogModal: React.FC<AddLogModalProps> = ({
  assetId,
  assetDbId,
  roomCode,
  category = 'OTHER',
  logToEdit,
  initialIssue,
  initialWoNumber,
  onClose,
  onSuccess
}) => {
  const isEdit = !!logToEdit
  const [date, setDate] = useState(logToEdit?.date || new Date().toISOString().split('T')[0])
  const [issue, setIssue] = useState(logToEdit?.issue || initialIssue || '')
  const [reporter, setReporter] = useState(logToEdit?.reporter || '')
  const [contractor, setContractor] = useState(logToEdit?.contractor || '')
  const [note, setNote] = useState(logToEdit?.note || '')
  const [cost, setCost] = useState(logToEdit?.cost?.toString() || '')
  const [contractorContact, setContractorContact] = useState(logToEdit?.contractor_contact || '')
  const [appointmentDate, setAppointmentDate] = useState(logToEdit?.appointment_date || '')
  const [woNumber, setWoNumber] = useState(logToEdit?.wo_number || initialWoNumber || '')

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const [status, setStatus] = useState<'Completed' | 'Pending' | 'In Progress' | 'Faulty'>((logToEdit?.status as any) || 'Completed')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Generate WO number on submit (not on open — prevents gaps)
      let finalWONumber = woNumber
      if (!isEdit && !woNumber) {
        finalWONumber = await fetchWONumber()
        setWoNumber(finalWONumber)
      }

      if (category === 'AC') {
        if (isEdit && logToEdit) {
          const { error } = await supabase
            .from('ac_maintenance_logs')
            .update({
              date,
              issue,
              reporter: reporter || null,
              contractor: contractor || null,
              contractor_contact: contractorContact || null,
              note: note || null,
              cost: cost ? parseFloat(cost) : null,
              appointment_date: appointmentDate || null,
              status
            })
            .eq('id', logToEdit.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('ac_maintenance_logs')
            .insert({
            asset_id: assetId,
            date,
            issue,
            reporter: reporter || null,
            contractor: contractor || null,
            contractor_contact: contractorContact || null,
            note: note || null,
            cost: cost ? parseFloat(cost) : null,
            wo_number: finalWONumber,
            appointment_date: appointmentDate || null,
            status
          })
          if (error) throw error
        }
      } else {
        // Existing logic for other assets (Furniture, etc.)
        let finalDbId = assetDbId;

        // If no DB ID, try to find/create the asset first
        if (!finalDbId) {
          if (!roomCode) throw new Error('Cannot create asset record: Room code missing.');
          
          console.log(`ðŸ“¡ Asset ${assetId} not in DB, creating first in ${roomCode}...`);
          finalDbId = await ensureAssetExists(assetId, roomCode, category);
        }

        const { error } = await supabase
          .from('maintenance_logs')
          .insert({
            asset_id: finalDbId,
            date,
            issue,
            reporter: reporter || null,
            contractor: contractor || null,
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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-[16px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-zinc-800">
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50 dark:bg-zinc-950 shrink-0">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-800 dark:text-orange-500" />
            <h2 className="text-sm font-black text-slate-800 dark:text-zinc-100 uppercase tracking-tight">{isEdit ? 'Edit Log Entry' : 'Add Daily Log'}</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-[4px] transition-colors">
            <X className="w-5 h-5 text-slate-400 dark:text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1 bg-white dark:bg-zinc-900">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/40 border border-orange-200 dark:border-orange-600/30 rounded-[8px]">
            <div className="text-[9px] font-black text-orange-500 dark:text-orange-600 uppercase tracking-wider">Asset</div>
            <div className="text-sm font-black text-amber-800 dark:text-orange-400">{assetId}</div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-900/40 border border-rose-100 dark:border-rose-500/30 rounded-[8px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-rose-700 dark:text-rose-300">{error}</p>
            </div>
          )}

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[8px] text-[11px] font-bold outline-none focus:ring-2 focus:ring-orange-600/20 dark:bg-zinc-900 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Appointment Date</label>
              <input
                type="date"
                value={appointmentDate}
                onChange={(e) => setAppointmentDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[8px] text-[11px] font-bold outline-none focus:ring-2 focus:ring-orange-600/20 dark:bg-zinc-900 dark:text-white"
              />
            </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Issue / Activity</label>
            <input
              type="text"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="e.g., Routine inspection, Repair leg"
              required
              maxLength={100}
              className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[8px] text-sm font-bold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-500 dark:focus:border-orange-700 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Reporter (Optional)</label>
            <input
              type="text"
              value={reporter}
              onChange={(e) => setReporter(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[8px] text-sm font-bold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-500 dark:focus:border-orange-700 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Contractor (Optional)</label>
            <input
              type="text"
              value={contractor}
              onChange={(e) => setContractor(e.target.value)}
              placeholder="e.g., ModernForm, Carrier"
              maxLength={100}
              className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[8px] text-sm font-bold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-500 dark:focus:border-orange-700 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Contractor Contact (Optional)</label>
            <input
              type="text"
              value={contractorContact}
              onChange={(e) => setContractorContact(e.target.value)}
              placeholder="Tel / Email"
              maxLength={100}
              className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[8px] text-sm font-bold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-500 dark:focus:border-orange-700 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Cost (THB)</label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[8px] text-sm font-bold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-500 dark:focus:border-orange-700 transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">WO Number</label>
              <input
                type="text"
                value={woNumber}
                readOnly
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-[8px] text-sm font-bold text-amber-800 dark:text-orange-500 bg-orange-50 dark:bg-orange-950/30 cursor-default"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Note (Optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Additional details..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-[8px] text-sm font-bold text-slate-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-orange-500 dark:focus:border-orange-700 transition-all resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">Status</label>
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
                      : 'bg-white dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2 pb-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-zinc-700 rounded-[8px] text-sm font-black text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-amber-800 dark:bg-amber-800 hover:bg-amber-800 dark:hover:bg-amber-800 rounded-[8px] text-sm font-black text-white shadow-lg shadow-orange-300 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : isEdit ? 'Update Log' : 'Save Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}





