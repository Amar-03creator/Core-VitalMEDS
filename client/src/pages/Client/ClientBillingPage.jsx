

import { useState } from 'react';

import {

  FileText, Wallet, BarChart2, CreditCard, Download,

  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2,

  Clock, XCircle, Search, Filter

} from 'lucide-react';



/* ── DEMO DATA ── */

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];

const currentMonthIdx = 4;



const monthlySummary = {

  4: { prevBalance: 12000, newPurchases: 84000, totalPaid: 51000, creditNotes: 0, outstanding: 45000 },

  3: { prevBalance: 15500, newPurchases: 72000, totalPaid: 72000, creditNotes: 0, outstanding: 15500 },

  2: { prevBalance: 1000, newPurchases: 95000, totalPaid: 94000, creditNotes: 1000, outstanding: 1000 },

};



const invoices = [

  { id: 'MIL-05-2025-042', date: '06 May', dueDate: '20 May', amount: 15200, paid: 0, status: 'UNPAID', overdueDays: 0 },

  { id: 'MIL-05-2025-040', date: '04 May', dueDate: '18 May', amount: 45000, paid: 25000, status: 'PARTIALLY_PAID', overdueDays: 0 },

  { id: 'MIL-05-2025-038', date: '03 May', dueDate: '17 May', amount: 34500, paid: 34500, status: 'PAID', overdueDays: 0 },

  { id: 'MIL-04-2025-035', date: '18 Apr', dueDate: '02 May', amount: 28000, paid: 0, status: 'UNPAID', overdueDays: 11 },

  { id: 'MIL-04-2025-030', date: '01 Apr', dueDate: '15 Apr', amount: 18200, paid: 18200, status: 'PAID', overdueDays: 0 },

  { id: 'MIL-03-2025-022', date: '10 Mar', dueDate: '24 Mar', amount: 34500, paid: 0, status: 'UNPAID', overdueDays: 47 },

];



const payments = [

  { id: 'APO-SHA-25-008', date: '05 May', amount: 25000, mode: 'UPI', ref: 'UPI12345678', invoices: ['MIL-05-2025-040'] },

  { id: 'APO-SHA-25-007', date: '01 May', amount: 34500, mode: 'Bank Transfer', ref: 'NEFT0987654', invoices: ['MIL-05-2025-038'] },

  { id: 'APO-SHA-25-006', date: '15 Apr', amount: 18200, mode: 'Cheque', ref: 'CHQ-445621', invoices: ['MIL-04-2025-030'] },

];



const creditNotes = [

  {
    id: 'CN-2025-003', date: '12 Mar', amount: 2400, reason: 'Damaged goods', originalBill: 'MIL-03-2025-022', status: 'Applied',

    items: [{ name: 'Paracetamol 500mg', qty: 20, refund: 264 }, { name: 'Amoxicillin 250mg', qty: 10, refund: 2136 }]
  },

];



const statusConfig = {

  UNPAID: { color: 'text-red-700', bg: 'bg-red-100', label: 'Unpaid' },

  PARTIALLY_PAID: { color: 'text-amber-700', bg: 'bg-amber-100', label: 'Partial' },

  PAID: { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'Paid' },

};



const modeIcon = { Cash: '💵', UPI: '📱', Cheque: '🏦', 'Bank Transfer': '🔁' };



/* ── TIER / SCORE ── */

const tierInfo = { tier: 'Diamond', score: 88, riskColor: 'bg-emerald-500', borderColor: 'border-cyan-400' };



/* ── INVOICES TAB ── */

const InvoicesTab = () => {

  const [search, setSearch] = useState('');

  const [filter, setFilter] = useState('All');



  const filtered = invoices.filter(inv => {

    const matchSearch = inv.id.toLowerCase().includes(search.toLowerCase());

    const matchFilter = filter === 'All' || inv.status === filter;

    return matchSearch && matchFilter;

  });



  const totalDue = invoices.reduce((s, i) => s + (i.amount - i.paid), 0);



  return (

    <div className="space-y-3">

      <div className="grid grid-cols-2 gap-2">

        <div className="bg-red-50 border border-red-200 rounded-2xl p-3">

          <p className="text-red-700 text-xl font-bold">₹{(totalDue / 1000).toFixed(1)}K</p>

          <p className="text-red-500 text-xs font-medium">Total Due</p>

        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">

          <p className="text-slate-800 text-xl font-bold">{invoices.length}</p>

          <p className="text-slate-500 text-xs font-medium">Total Invoices</p>

        </div>

      </div>



      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">

        <Search size={15} className="text-slate-400 shrink-0" />

        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoice ID..."

          className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-transparent outline-none" />

      </div>



      <div className="flex gap-2 overflow-x-auto scrollbar-none">

        {['All', 'UNPAID', 'PARTIALLY_PAID', 'PAID'].map(s => (

          <button key={s} onClick={() => setFilter(s)}

            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter === s ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>

            {s === 'PARTIALLY_PAID' ? 'Partial' : s === 'PAID' ? 'Paid' : s === 'UNPAID' ? 'Unpaid' : 'All'}

          </button>

        ))}

      </div>



      {filtered.map(inv => {

        const due = inv.amount - inv.paid;

        const { color, bg, label } = statusConfig[inv.status];

        return (

          <div key={inv.id} className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-slate-400 text-xs font-mono">{inv.id}</p>

                <div className="flex items-center gap-2 mt-1.5">

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bg} ${color}`}>{label}</span>

                  {inv.overdueDays > 0 && (

                    <span className="text-red-600 text-xs font-semibold">{inv.overdueDays}d overdue</span>

                  )}

                </div>

                <p className="text-slate-400 text-xs mt-1">Due: {inv.dueDate}</p>

              </div>

              <div className="text-right">

                <p className="text-slate-800 font-bold">₹{inv.amount.toLocaleString()}</p>

                {due > 0 && inv.status !== 'PAID' && (

                  <p className={`text-xs font-semibold ${inv.overdueDays > 0 ? 'text-red-600' : 'text-amber-600'}`}>

                    ₹{due.toLocaleString()} due

                  </p>

                )}

                <p className="text-slate-400 text-xs mt-1">{inv.date}</p>

              </div>

            </div>

            {inv.status !== 'UNPAID' || true ? (

              <div className="flex gap-2 mt-3">

                <button className="flex-1 flex items-center justify-center gap-1.5 bg-slate-50 text-slate-600 text-xs font-semibold py-2 rounded-xl border border-slate-200">

                  <Download size={12} /> Download PDF

                </button>

              </div>

            ) : null}

          </div>

        );

      })}

    </div>

  );

};



/* ── PAYMENTS TAB ── */

const PaymentsTab = () => (

  <div className="space-y-3">

    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">

      <p className="text-emerald-700 text-xl font-bold">

        ₹{payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}

      </p>

      <p className="text-emerald-600 text-xs font-medium">Total Paid This Month</p>

    </div>



    {payments.map(p => (

      <div key={p.id} className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5">

        <div className="flex items-start justify-between">

          <div>

            <p className="text-slate-400 text-xs font-mono">{p.id}</p>

            <div className="flex items-center gap-2 mt-1.5">

              <span className="text-xs text-slate-500">{modeIcon[p.mode]} {p.mode}</span>

              {p.ref && <span className="text-xs text-slate-400 font-mono">{p.ref}</span>}

            </div>

          </div>

          <div className="text-right">

            <p className="text-emerald-600 font-bold text-lg">₹{p.amount.toLocaleString()}</p>

            <p className="text-slate-400 text-xs">{p.date}</p>

          </div>

        </div>

        {p.invoices.length > 0 && (

          <div className="mt-2 pt-2 border-t border-slate-100">

            <p className="text-xs text-slate-400">Applied to: <span className="text-slate-600 font-mono">{p.invoices.join(', ')}</span></p>

          </div>

        )}

      </div>

    ))}

  </div>

);



/* ── CREDIT NOTES TAB ── */

const CreditNotesTab = () => (

  <div className="space-y-3">

    {creditNotes.length === 0 ? (

      <div className="text-center py-12 text-slate-400">

        <CreditCard className="mx-auto mb-2" size={32} />

        <p className="text-sm">No credit notes</p>

      </div>

    ) : (

      creditNotes.map(cn => (

        <div key={cn.id} className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-slate-400 text-xs font-mono">{cn.id}</p>

              <p className="text-slate-800 font-semibold text-sm mt-1">{cn.reason}</p>

              <p className="text-slate-400 text-xs mt-0.5">Ref: <span className="font-mono">{cn.originalBill}</span></p>

            </div>

            <div className="text-right">

              <p className="text-emerald-600 font-bold text-lg">-₹{cn.amount.toLocaleString()}</p>

              <p className="text-slate-400 text-xs">{cn.date}</p>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{cn.status}</span>

            </div>

          </div>

          <div className="mt-3 space-y-1.5 pt-2 border-t border-slate-100">

            {cn.items.map(item => (

              <div key={item.name} className="flex justify-between text-xs">

                <span className="text-slate-500">{item.name} × {item.qty}</span>

                <span className="text-slate-700 font-semibold">-₹{item.refund}</span>

              </div>

            ))}

          </div>

        </div>

      ))

    )}

  </div>

);



/* ── PAGE ── */

const ClientBillingPage = () => {

  const [activeTab, setActiveTab] = useState('summary');

  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx);

  const data = monthlySummary[selectedMonth] || monthlySummary[4];



  const tabs = [

    { key: 'summary', label: 'Summary', icon: BarChart2 },

    { key: 'invoices', label: 'Invoices', icon: FileText },

    { key: 'payments', label: 'Payments', icon: Wallet },

    { key: 'credits', label: 'Credits', icon: CreditCard },

  ];



  return (

    <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">

      {/* Header with tier badge */}

      <div className="flex items-start justify-between">

        <div>

          <h1 className="text-slate-900 text-lg font-bold">Billing & Dues</h1>

          <p className="text-slate-500 text-xs">Financial ledger & payment history</p>

        </div>

        <div className="text-right">

          <span className="bg-cyan-100 text-cyan-700 text-xs font-bold px-2.5 py-1 rounded-xl">💎 Diamond</span>

          <div className="flex items-center gap-1.5 mt-1.5 justify-end">

            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">

              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${tierInfo.score}%` }} />

            </div>

            <span className="text-xs text-slate-500 font-semibold">{tierInfo.score}/100</span>

          </div>

        </div>

      </div>



      {/* Tabs */}

      <div className="flex gap-2 bg-slate-100 rounded-2xl p-1">

        {tabs.map(({ key, label, icon: Icon }) => (

          <button key={key} onClick={() => setActiveTab(key)}

            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-semibold transition-all ${activeTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>

            <Icon size={15} />

            {label}

          </button>

        ))}

      </div>



      {/* SUMMARY */}

      {activeTab === 'summary' && (

        <div className="space-y-3">

          {/* Month selector */}

          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-4 py-3">

            <button onClick={() => setSelectedMonth(m => Math.max(0, m - 1))} disabled={selectedMonth === 0}

              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 disabled:opacity-30">

              <ChevronLeft size={16} />

            </button>

            <div className="text-center">

              <p className="text-slate-900 font-bold">{months[selectedMonth]} 2025</p>

              {selectedMonth === currentMonthIdx && (

                <p className="text-emerald-600 text-[10px] font-semibold uppercase">Current Month</p>

              )}

            </div>

            <button onClick={() => setSelectedMonth(m => Math.min(currentMonthIdx, m + 1))} disabled={selectedMonth === currentMonthIdx}

              className="p-1.5 rounded-lg bg-slate-100 text-slate-500 disabled:opacity-30">

              <ChevronRight size={16} />

            </button>

          </div>



          {/* Ledger grid */}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">

            {[

              { label: 'Previous Balance', value: data.prevBalance, color: 'text-amber-600', bg: 'bg-amber-50' },

              { label: 'New Purchases', value: data.newPurchases, color: 'text-blue-600', bg: 'bg-blue-50' },

              { label: 'Total Paid', value: data.totalPaid, color: 'text-emerald-600', bg: 'bg-emerald-50' },

              { label: 'Credit Notes', value: data.creditNotes, color: 'text-violet-600', bg: 'bg-violet-50' },

            ].map(({ label, value, color, bg }, i, arr) => (

              <div key={label} className={`flex items-center justify-between px-4 py-3.5 ${i < arr.length - 1 ? 'border-b border-slate-100' : ''}`}>

                <div className={`w-2 h-2 rounded-full ${bg.replace('bg-', 'bg-').replace('-50', '-400')}`} />

                <span className="flex-1 text-slate-600 text-sm ml-3">{label}</span>

                <span className={`font-bold text-sm ${color}`}>₹{value.toLocaleString()}</span>

              </div>

            ))}

            <div className="flex items-center justify-between px-4 py-4 bg-slate-900">

              <span className="text-slate-400 text-sm font-semibold">Total Outstanding</span>

              <span className={`font-black text-lg ${data.outstanding > 50000 ? 'text-red-400' : 'text-white'}`}>

                ₹{data.outstanding.toLocaleString()}

              </span>

            </div>

          </div>



          {data.outstanding > 100000 && (

            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-start gap-2">

              <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />

              <p className="text-red-700 text-xs font-medium">Outstanding is high. New orders may be paused if limit is exceeded.</p>

            </div>

          )}

        </div>

      )}



      {activeTab === 'invoices' && <InvoicesTab />}

      {activeTab === 'payments' && <PaymentsTab />}

      {activeTab === 'credits' && <CreditNotesTab />}

    </div>

  );

};



export default ClientBillingPage;

