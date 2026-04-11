import React from 'react';
import { X, Printer, FileText } from 'lucide-react';

interface PrintReportModalProps {
  asset: any;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({ asset, onClose }) => {
  if (!asset) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-full print:shadow-none print:rounded-none print:max-w-none print:h-auto">
        
        {/* Modal Header (Hidden on Print) */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">Maintenance Report Preview</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Ready for A4 PDF export</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-200 text-xs font-black uppercase"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Report Content (A4 Container) */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100 print:bg-white print:overflow-visible print:p-0">
          <div className="bg-white shadow-xl mx-auto min-h-[29.7cm] w-[21cm] p-[2cm] text-slate-800 print:shadow-none print:w-full print:min-h-0 print:mx-0">
            
            {/* Report Header */}
            <div className="flex justify-between items-start border-b-4 border-indigo-600 pb-6 mb-8">
              <div>
                <h1 className="text-3xl font-black tracking-tighter text-indigo-900 mb-1">ASSET REPORT</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Facility Management - AR15 Building</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-slate-400 uppercase">Report Generated</div>
                <div className="text-sm font-bold text-slate-700">{new Date().toLocaleDateString('th-TH')} {new Date().toLocaleTimeString('th-TH')}</div>
              </div>
            </div>

            {/* Asset Identity */}
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="space-y-4">
                <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1">Asset Identity</h2>
                <div className="space-y-3">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase">System Name</div>
                    <div className="text-base font-black text-slate-900">{asset.name}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase">System Type</div>
                    <div className="text-sm font-bold text-indigo-600 uppercase">{asset.acType || '---'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase">Object ID (GLB)</div>
                      <div className="text-sm font-bold">{asset.id.toUpperCase()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase">Asset ID (Tag)</div>
                      <div className="text-sm font-black text-indigo-700">{asset.assetId || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1">Technical Specifications</h2>
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase">Brand</div>
                    <div className="text-sm font-bold">{asset.brand || '---'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase">Model</div>
                    <div className="text-sm font-bold">{asset.model || '---'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase">Capacity</div>
                    <div className="text-sm font-bold">{asset.capacity || '---'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase">Installation Date</div>
                    <div className="text-sm font-bold">{asset.install || '---'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-slate-50 rounded-xl p-4 mb-10 flex items-center justify-between border border-slate-100">
              <div>
                <div className="text-[10px] font-black text-slate-400 uppercase">Current Operational Status</div>
                <div className="text-xl font-black text-slate-900">{asset.status}</div>
              </div>
              <div className={`px-4 py-2 rounded-lg font-black text-sm uppercase ${
                asset.status === 'Normal' ? 'bg-emerald-100 text-emerald-700' :
                asset.status === 'Faulty' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {asset.status}
              </div>
            </div>

            {/* Service Logs Table */}
            <div className="space-y-4">
              <h2 className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100 pb-1">Maintenance History (Service Logs)</h2>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="p-3 text-[10px] font-black text-slate-500 uppercase border-b border-slate-200 w-32">Date / Time</th>
                      <th className="p-3 text-[10px] font-black text-slate-500 uppercase border-b border-slate-200">Issue & Description</th>
                      <th className="p-3 text-[10px] font-black text-slate-500 uppercase border-b border-slate-200 w-24 text-center">Status</th>
                      <th className="p-3 text-[10px] font-black text-slate-500 uppercase border-b border-slate-200 w-24">Reporter</th>
                      <th className="p-3 text-[10px] font-black text-slate-500 uppercase border-b border-slate-200 w-32 text-indigo-600">Contractor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {asset.logs && asset.logs.length > 0 ? (
                      asset.logs.map((log: any, i: number) => (
                        <tr key={i} className="align-top">
                          <td className="p-3">
                            <div className="text-sm font-bold text-slate-900">{log.date}</div>
                            <div className="text-[10px] font-bold text-slate-400">
                              {log.created_at ? new Date(log.created_at).toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'}) : ''}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm font-black text-slate-800 mb-1">{log.issue}</div>
                            <div className="text-xs font-bold text-slate-500 italic">{log.note || '---'}</div>
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase ${
                              log.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="p-3 text-xs font-bold text-slate-600">
                            {log.reporter || '---'}
                          </td>
                          <td className="p-3 text-xs font-black text-indigo-700">
                            {log.contractor || '---'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 text-xs italic">No maintenance history found for this asset.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-20 pt-8 border-t border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Authorized BIM Facility Management System</p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:static, .print\\:static * {
            visibility: visible;
          }
          .print\\:static {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}} />
    </div>
  );
};
