import { useState, useMemo } from 'react';
import { BookOpen, MapPin, Users, Info, Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { LINES, INVOICES, RECEIPTS } from './utils/constants';
import { generateLedgerForParty } from './utils/ledgerHelpers';
import { generateLedgerPDF } from './utils/pdfGenerator';

export const PartyLedgerTab = () => {
  const [scope, setScope] = useState('party');
  const [lineF, setLineF] = useState(LINES[0].name);
  const [partyF, setPartyF] = useState('');
  const [dateFrom, setDateFrom] = useState('2025-03-01');
  const [dateTo, setDateTo] = useState('2025-05-07');
  const [generated, setGenerated] = useState(false);
  const [currentPartyIndex, setCurrentPartyIndex] = useState(0);

  const partiesList = useMemo(() => {
    if (scope === 'party') return partyF ? [partyF] : [];
    if (scope === 'line') return LINES.find(l => l.name === lineF)?.parties || [];
    if (scope === 'area') {
      const area = LINES.find(l => l.name === lineF)?.area;
      return LINES.filter(l => l.area === area).flatMap(l => l.parties);
    }
    return LINES.flatMap(l => l.parties);
  }, [scope, lineF, partyF]);

  const ledgers = useMemo(() => {
    if (!generated || partiesList.length === 0) return [];
    return partiesList.map(party => ({
      party,
      rows: generateLedgerForParty(party, dateFrom, dateTo),
    }));
  }, [generated, partiesList, dateFrom, dateTo]);

  const currentLedger = ledgers[currentPartyIndex];
  const canPrev = currentPartyIndex > 0;
  const canNext = currentPartyIndex < ledgers.length - 1;

  const getButtonLabel = () => {
    if (scope === 'party') return currentLedger?.party || 'Selected Party';
    if (scope === 'line') return lineF;
    if (scope === 'area') return LINES.find(l => l.name === lineF)?.area || 'Area';
    return 'All Parties';
  };

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 rounded-2xl p-4">
        <h3 className="text-white font-bold text-base flex items-center gap-2 mb-3">
          <BookOpen size={16} className="text-emerald-400" /> Collection Statement Generator
        </h3>
        <p className="text-slate-400 text-sm">Generate party, line, area or all‑parties statements.</p>
      </div>

      {/* Scope selector */}
      <div>
        <p className="text-sm font-semibold text-slate-600 mb-2">Statement For</p>
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {['party', 'line', 'area', 'all'].map(key => (
            <button key={key} onClick={() => { setScope(key); setGenerated(false); setCurrentPartyIndex(0); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${scope === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
              {key === 'party' ? '1 Party' : key === 'line' ? '1 Line' : key === 'area' ? '1 Area' : 'All Parties'}
            </button>
          ))}
        </div>
      </div>

      {/* Line selector */}
      {scope !== 'all' && (
        <div>
          <p className="text-sm font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><MapPin size={14} /> Collection Line</p>
          <select value={lineF} onChange={e => { setLineF(e.target.value); setPartyF(''); setGenerated(false); setCurrentPartyIndex(0); }}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-base outline-none">
            {LINES.map(l => <option key={l.name}>{l.name}</option>)}
          </select>
        </div>
      )}

      {/* Party selector */}
      {scope === 'party' && (
        <div>
          <p className="text-sm font-semibold text-slate-600 mb-1.5 flex items-center gap-1"><Users size={14} /> Party <span className="text-emerald-600">({lineF})</span></p>
          <select value={partyF} onChange={e => { setPartyF(e.target.value); setGenerated(false); setCurrentPartyIndex(0); }}
            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-base outline-none">
            <option value="">Select party...</option>
            {LINES.find(l => l.name === lineF)?.parties.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>
      )}

      {/* Date range */}
      <div>
        <div className="flex justify-between mb-2">
          <p className="text-sm font-semibold text-slate-600">Statement Period</p>
          <button onClick={() => { setDateFrom('2025-03-01'); setDateTo('2025-05-07'); }}
            className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">⚡ Auto "Month A"</button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs text-slate-500 font-semibold uppercase">From</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full border rounded-xl px-3 py-2" /></div>
          <div><label className="text-xs text-slate-500 font-semibold uppercase">To</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full border rounded-xl px-3 py-2" /></div>
        </div>
        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex gap-2"><Info size={14} className="text-blue-500" /><p className="text-blue-700 text-sm">Opening balance includes all unpaid transactions before the start date.</p></div>
      </div>

      <button onClick={() => { setGenerated(true); setCurrentPartyIndex(0); }} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl flex justify-center gap-2"><Eye size={16} /> Generate Preview</button>

      {generated && ledgers.length > 0 && (
        <div className="space-y-4">
          {ledgers.length > 1 && (
            <div className="flex justify-between bg-white rounded-2xl border p-3">
              <button onClick={() => canPrev && setCurrentPartyIndex(p => p-1)} disabled={!canPrev} className="p-2 rounded-xl disabled:opacity-50"><ChevronLeft size={20} /></button>
              <div className="text-center"><p className="font-bold text-lg">{currentLedger.party}</p><p className="text-sm">Ledger from {dateFrom} to {dateTo}</p><p className="text-xs text-slate-400">Party {currentPartyIndex+1} of {ledgers.length}</p></div>
              <button onClick={() => canNext && setCurrentPartyIndex(p => p+1)} disabled={!canNext} className="p-2 rounded-xl disabled:opacity-50"><ChevronRight size={20} /></button>
            </div>
          )}
          <div className="rounded-2xl border overflow-hidden">
            <div className="bg-slate-900 px-3 py-2 grid grid-cols-[48px_1fr_60px_60px_80px_36px] text-[10px] font-bold text-slate-400 uppercase gap-1">
              <span>Date</span><span>Particulars</span><span className="text-right">Dr</span><span className="text-right">Cr</span><span className="text-right">Balance</span><span className="text-right">Days</span>
            </div>
            {currentLedger.rows.map((row, i) => (
              <div key={i} className={`px-3 py-2.5 grid grid-cols-[48px_1fr_60px_60px_80px_36px] gap-1 border-t text-sm items-center ${row.isOpening ? 'bg-amber-50' : row.isClosing ? 'bg-slate-900' : ''}`}>
                <span className={`text-xs ${row.isClosing ? 'text-slate-400' : 'text-slate-500'}`}>{row.date}</span>
                <div><p className={`font-semibold ${row.isOpening ? 'text-amber-800' : row.isClosing ? 'text-white' : 'text-slate-800'}`}>{row.type}</p><p className="font-mono text-[10px] text-slate-400">{row.voucher}</p></div>
                <span className="text-right font-semibold text-red-600">{row.dr > 0 ? row.dr.toLocaleString() : ''}</span>
                <span className="text-right font-semibold text-emerald-600">{row.cr > 0 ? row.cr.toLocaleString() : ''}</span>
                <span className={`text-right font-bold ${row.isOpening ? 'text-amber-700' : row.isClosing ? 'text-emerald-400' : 'text-slate-900'}`}>{Math.abs(row.balance).toLocaleString()} {row.balance >= 0 ? 'Dr' : 'Cr'}</span>
                <span className="text-right text-xs">{row.days || '—'}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => generateLedgerPDF(ledgers, dateFrom, dateTo)} className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2">
              <Download size={15} /> Download PDF for {getButtonLabel()}
            </button>
          </div>
        </div>
      )}
      {generated && ledgers.length === 0 && <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center text-amber-700">No parties found. Adjust filters.</div>}
    </div>
  );
};