import { useMemo, useState } from 'react';
import { toast, Toaster } from 'sonner';
import {
  Search,
  Percent,
  Gift,
  Edit3,
  Trash2,
  Plus,
  X,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';

/* ═══════════════════════════════════════
   DEMO DATA – Batches expiring in ≤6 months (22-05-2026)
═══════════════════════════════════════ */
const EXPIRING_BATCHES = [
  { id: 'BATCH-001', productName: 'Paracetamol 500mg', company: 'Cipla', batchNumber: 'PCM-A12/26', expiryDate: '2026-08-31', remainingUnits: 450 },
  { id: 'BATCH-002', productName: 'Amoxicillin 250mg', company: 'Sun Pharma', batchNumber: 'AMX-C21/26', expiryDate: '2026-06-30', remainingUnits: 85 },
  { id: 'BATCH-003', productName: 'Metformin 500mg', company: 'USV', batchNumber: 'MET-E15/25', expiryDate: '2026-08-15', remainingUnits: 234 },
  { id: 'BATCH-004', productName: 'Omeprazole 20mg', company: "Dr. Reddy's", batchNumber: 'OMZ-X03/26', expiryDate: '2026-07-15', remainingUnits: 120 },
  { id: 'BATCH-005', productName: 'Atorvastatin 10mg', company: 'Torrent', batchNumber: 'ATV-F09/26', expiryDate: '2026-05-25', remainingUnits: 40 },
].filter((b) => {
  const expiry = new Date(b.expiryDate);
  const sixMonthsFromNow = new Date('2026-05-22');
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  return expiry <= sixMonthsFromNow;
});

const LINES = [
  { name: 'Cuttack Line', area: 'Cuttack', parties: ['Sharma Medical Stores', 'MedCare Stores', 'Ravi Drug House'] },
  { name: 'BBSR Line', area: 'Bhubaneswar', parties: ['City Pharma', 'Metro Medics'] },
  { name: 'Puri Line', area: 'Puri', parties: ['HealthFirst Pharmacy', 'New Life Pharmacy'] },
  { name: 'Berhampur Line', area: 'Berhampur', parties: ['Patnaik Medicals', 'CarePlus Chemist'] },
];

/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
const cls = (...parts) => parts.filter(Boolean).join(' ');

const getExpiryFormatted = (dateStr) => {
  const today = new Date('2026-05-22');
  const expiry = new Date(dateStr);
  let months = (expiry.getFullYear() - today.getFullYear()) * 12;
  months += expiry.getMonth() - today.getMonth();
  let days = expiry.getDate() - today.getDate();
  if (days < 0) {
    months--;
    const lastMonth = new Date(expiry.getFullYear(), expiry.getMonth(), 0);
    days += lastMonth.getDate();
  }
  return `${months} month${months !== 1 ? 's' : ''} and ${days} day${days !== 1 ? 's' : ''}`;
};

const getExpiryBadge = (dateStr) => {
  const today = new Date('2026-05-22');
  const expiry = new Date(dateStr);
  const monthsLeft = (expiry.getFullYear() - today.getFullYear()) * 12 + (expiry.getMonth() - today.getMonth());
  if (monthsLeft <= 0) return { text: 'Expired', className: 'bg-red-100 text-red-700 border-red-200' };
  if (monthsLeft <= 1) return { text: 'Critical', className: 'bg-rose-100 text-rose-700 border-rose-200' };
  if (monthsLeft <= 3) return { text: 'Warning', className: 'bg-amber-100 text-amber-700 border-amber-200' };
  return { text: 'Valid', className: 'bg-slate-100 text-slate-700 border-slate-200' };
};

const toneStyles = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
};

const Pill = ({ tone = 'slate', children }) => (
  <span className={cls('inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold', toneStyles[tone])}>
    {children}
  </span>
);

const uniqueAreas = Array.from(new Set(LINES.map((line) => line.area)));
const getPartiesByArea = (area) => {
  const matched = LINES.filter((line) => line.area === area);
  return Array.from(new Set(matched.flatMap((line) => line.parties)));
};
const getPartiesByLine = (lineName) => LINES.find((l) => l.name === lineName)?.parties || [];

/* ═══════════════════════════════════════
   UI SHELL
═══════════════════════════════════════ */
const DialogShell = ({ title, subtitle, onClose, children, footer }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <button onClick={onClose} className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200" aria-label="Close modal">
          <X size={18} />
        </button>
      </div>
      <div className="p-5">{children}</div>
      {footer && <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">{footer}</div>}
    </div>
  </div>
);

const OfferFields = ({
  title,
  subtitle,
  offerType,
  setOfferType,
  percentValue,
  setPercentValue,
  bogoBuy,
  setBogoBuy,
  bogoFree,
  setBogoFree,
  minQty,
  setMinQty,
  validityDate,
  setValidityDate,
  onCancel,
  onSubmit,
  buttonLabel,
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4">
      <h4 className="font-semibold text-slate-900">{title}</h4>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>

    <div className="mt-4 flex gap-2 rounded-2xl bg-slate-100 p-1">
      <button
        type="button"
        onClick={() => setOfferType('percent')}
        className={cls('flex-1 rounded-xl py-2 text-sm font-semibold transition-all', offerType === 'percent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}
      >
        <Percent size={14} className="mr-1 inline" /> Discount %
      </button>
      <button
        type="button"
        onClick={() => setOfferType('bogo')}
        className={cls('flex-1 rounded-xl py-2 text-sm font-semibold transition-all', offerType === 'bogo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}
      >
        <Gift size={14} className="mr-1 inline" /> Buy X Get Y
      </button>
    </div>

    <div className="mt-4 grid gap-3 md:grid-cols-2">
      {offerType === 'percent' ? (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Discount %</label>
          <input type="number" value={percentValue} onChange={(e) => setPercentValue(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
        </div>
      ) : (
        <>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Buy</label>
            <input type="number" value={bogoBuy} onChange={(e) => setBogoBuy(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Free</label>
            <input type="number" value={bogoFree} onChange={(e) => setBogoFree(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
          </div>
        </>
      )}

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Min order qty (optional)</label>
        <input type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Validity (optional)</label>
        <input type="date" value={validityDate} onChange={(e) => setValidityDate(e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
      </div>
    </div>

    <div className="mt-4 flex gap-2 pt-1">
      <button onClick={onCancel} type="button" className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 font-semibold text-slate-600 hover:bg-slate-50">
        Cancel
      </button>
      <button onClick={onSubmit} type="button" className="flex-1 rounded-xl bg-slate-900 py-2.5 font-bold text-white hover:bg-slate-800">
        {buttonLabel}
      </button>
    </div>
  </div>
);

/* ═══════════════════════════════════════
   MODALS (using sonner toast)
═══════════════════════════════════════ */
const CommonOfferModal = ({ batch, offers, onSave, onClose }) => {
  const [offerType, setOfferType] = useState(offers.common?.offerType || 'percent');
  const [percentValue, setPercentValue] = useState(offers.common?.value || 30);
  const [bogoBuy, setBogoBuy] = useState(offers.common?.bogoBuy || 5);
  const [bogoFree, setBogoFree] = useState(offers.common?.bogoFree || 10);
  const [minQty, setMinQty] = useState(offers.common?.minQty || 0);
  const [validityDate, setValidityDate] = useState(offers.common?.validityDate || '');

  const handleSave = () => {
    const next = {
      offerType,
      minQty: Number(minQty) || 0,
      validityDate: validityDate || null,
    };
    if (offerType === 'percent') next.value = Number(percentValue) || 0;
    else {
      next.bogoBuy = Number(bogoBuy) || 0;
      next.bogoFree = Number(bogoFree) || 0;
    }
    onSave({ common: next, special: offers.special || [] });
    toast.success(offers.common ? 'Common offer updated' : 'Common offer added');
    onClose();
  };

  return (
    <DialogShell title={`Common Offer · ${batch.productName}`} subtitle={`Batch ${batch.batchNumber}`} onClose={onClose}>
      <OfferFields
        title={offers.common ? 'Edit common offer' : 'Add common offer'}
        subtitle="This offer applies to all parties unless overridden."
        offerType={offerType}
        setOfferType={setOfferType}
        percentValue={percentValue}
        setPercentValue={setPercentValue}
        bogoBuy={bogoBuy}
        setBogoBuy={setBogoBuy}
        bogoFree={bogoFree}
        setBogoFree={bogoFree}
        minQty={minQty}
        setMinQty={setMinQty}
        validityDate={validityDate}
        setValidityDate={setValidityDate}
        onCancel={onClose}
        onSubmit={handleSave}
        buttonLabel={offers.common ? 'Update common offer' : 'Save common offer'}
      />
    </DialogShell>
  );
};

const SpecialOfferModal = ({ batch, offers, onSave, onClose }) => {
  const [specialOffers, setSpecialOffers] = useState(offers.special || []);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const [searchMode, setSearchMode] = useState('area');
  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [partyOpen, setPartyOpen] = useState(false);

  const commonOffer = offers.common || null;
  const usedParties = specialOffers.map((o) => o.party);

  const filteredAreas = useMemo(
    () => uniqueAreas.filter((area) => area.toLowerCase().includes(searchValue.toLowerCase())),
    [searchValue]
  );

  const filteredLines = useMemo(
    () => LINES.filter((line) => line.name.toLowerCase().includes(searchValue.toLowerCase())),
    [searchValue]
  );

  const partiesInCurrentScope = useMemo(() => {
    if (searchMode === 'area') return selectedArea ? getPartiesByArea(selectedArea) : [];
    if (selectedLine) return getPartiesByLine(selectedLine);
    return [];
  }, [searchMode, selectedArea, selectedLine]);

  const handleAddSpecial = (offerData) => {
    if (!offerData.party) {
      toast.error('Please select a party');
      return;
    }
    if (specialOffers.some((o) => o.party === offerData.party)) {
      toast.error(`Offer for ${offerData.party} already exists. Please edit instead.`);
      return;
    }
    const next = [...specialOffers, { ...offerData, id: Date.now() }];
    setSpecialOffers(next);
    onSave({ common: commonOffer, special: next });
    toast.success(`Special offer added for ${offerData.party}`);
    setShowAddForm(false);
  };

  const handleUpdateSpecial = (index, updatedOffer) => {
    const currentParty = specialOffers[index].party;
    const newParty = updatedOffer.party;
    if (newParty && newParty !== currentParty && specialOffers.some((o, i) => i !== index && o.party === newParty)) {
      toast.error(`Offer for ${newParty} already exists. Cannot change party.`);
      return;
    }
    const next = [...specialOffers];
    next[index] = { ...next[index], ...updatedOffer };
    setSpecialOffers(next);
    onSave({ common: commonOffer, special: next });
    toast.success(`Offer updated for ${updatedOffer.party}`);
    setEditingIndex(null);
  };

  const handleDeleteSpecial = (index) => {
    const party = specialOffers[index].party;
    const next = specialOffers.filter((_, i) => i !== index);
    setSpecialOffers(next);
    onSave({ common: commonOffer, special: next });
    toast.info(`Removed special offer for ${party}`);
  };

  const buildPartyPicker = () => {
    const list = partiesInCurrentScope.filter((party) => !usedParties.includes(party) || party === selectedParty);
    return list;
  };

  const SpecialOfferForm = ({ initialOffer = null, isEdit = false, onSubmit, onCancel }) => {
    const [offerType, setOfferType] = useState(initialOffer?.offerType || 'percent');
    const [percentValue, setPercentValue] = useState(initialOffer?.value || 30);
    const [bogoBuy, setBogoBuy] = useState(initialOffer?.bogoBuy || 5);
    const [bogoFree, setBogoFree] = useState(initialOffer?.bogoFree || 10);
    const [minQty, setMinQty] = useState(initialOffer?.minQty || 0);
    const [validityDate, setValidityDate] = useState(initialOffer?.validityDate || '');

    const currentSelectedParty = isEdit ? initialOffer?.party || '' : selectedParty;
    const currentSelectedLine = isEdit ? initialOffer?.line || '' : selectedLine;
    const currentSelectedArea = isEdit ? initialOffer?.area || selectedArea : selectedArea;

    const submit = () => {
      onSubmit({
        offerType,
        party: currentSelectedParty,
        line: currentSelectedLine,
        area: currentSelectedArea,
        minQty: Number(minQty) || 0,
        validityDate: validityDate || null,
        ...(offerType === 'percent'
          ? { value: Number(percentValue) || 0 }
          : { bogoBuy: Number(bogoBuy) || 0, bogoFree: Number(bogoFree) || 0 }),
      });
    };

    return (
      <OfferFields
        title={isEdit ? 'Edit party offer' : 'Add party offer'}
        subtitle="Pick an area or line, then select the party and set the offer."
        offerType={offerType}
        setOfferType={setOfferType}
        percentValue={percentValue}
        setPercentValue={setPercentValue}
        bogoBuy={bogoBuy}
        setBogoBuy={setBogoBuy}
        bogoFree={bogoFree}
        setBogoFree={bogoFree}
        minQty={minQty}
        setMinQty={setMinQty}
        validityDate={validityDate}
        setValidityDate={setValidityDate}
        onCancel={onCancel}
        onSubmit={submit}
        buttonLabel={isEdit ? 'Update party offer' : 'Save party offer'}
      />
    );
  };

  return (
    <DialogShell title={`Special Offers · ${batch.productName}`} subtitle={`Batch ${batch.batchNumber}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-slate-900">Party-specific offers</h4>
              <p className="text-xs text-slate-500">Select an area or line, then pick a party from the matching list.</p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingIndex(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
            >
              <Plus size={14} /> Add party offer
            </button>
          </div>
        </div>

        {showAddForm && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setSearchMode('area');
                  setSearchValue('');
                  setSearchOpen(false);
                  setSelectedLine('');
                  setSelectedParty('');
                }}
                className={cls('flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all', searchMode === 'area' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}
              >
                Area
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearchMode('line');
                  setSearchValue('');
                  setSearchOpen(false);
                  setSelectedArea('');
                  setSelectedParty('');
                }}
                className={cls('flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all', searchMode === 'line' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}
              >
                Line
              </button>
            </div>

            <div className="relative">
              <label className="mb-1 block text-xs font-semibold text-slate-500">{searchMode === 'area' ? 'Search area' : 'Search line'}</label>
              <button
                type="button"
                onClick={() => setSearchOpen((s) => !s)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm"
              >
                <span className={searchValue ? 'text-slate-900' : 'text-slate-400'}>{searchValue || (searchMode === 'area' ? 'Type an area...' : 'Type a line...')}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {searchOpen && (
                <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="border-b border-slate-100 p-2">
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                      <Search size={14} className="text-slate-400" />
                      <input
                        autoFocus
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        placeholder={searchMode === 'area' ? 'Search area...' : 'Search line...'}
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div className="max-h-52 overflow-y-auto p-1">
                    {searchMode === 'area'
                      ? filteredAreas.map((area) => (
                          <button
                            key={area}
                            type="button"
                            onClick={() => {
                              setSelectedArea(area);
                              setSelectedLine('');
                              setSelectedParty('');
                              setSearchValue(area);
                              setSearchOpen(false);
                            }}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            {area}
                          </button>
                        ))
                      : filteredLines.map((line) => (
                          <button
                            key={line.name}
                            type="button"
                            onClick={() => {
                              setSelectedLine(line.name);
                              setSelectedArea(line.area);
                              setSelectedParty('');
                              setSearchValue(line.name);
                              setSearchOpen(false);
                            }}
                            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <div className="font-medium text-slate-900">{line.name}</div>
                            <div className="text-xs text-slate-500">{line.area}</div>
                          </button>
                        ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <label className="mb-1 block text-xs font-semibold text-slate-500">Party</label>
              <button
                type="button"
                onClick={() => setPartyOpen((s) => !s)}
                disabled={searchMode === 'area' ? !selectedArea : !selectedLine}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm disabled:cursor-not-allowed disabled:bg-slate-50"
              >
                <span className={selectedParty ? 'text-slate-900' : 'text-slate-400'}>{selectedParty || 'Select party...'}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {partyOpen && (
                <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                  {buildPartyPicker().length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-400">No available parties</div>
                  ) : (
                    buildPartyPicker().map((party) => (
                      <button
                        key={party}
                        type="button"
                        onClick={() => {
                          setSelectedParty(party);
                          setPartyOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        {party}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <SpecialOfferForm
              onSubmit={handleAddSpecial}
              onCancel={() => {
                setShowAddForm(false);
                setSearchOpen(false);
                setPartyOpen(false);
              }}
            />
          </div>
        )}

        <div className="space-y-3">
          {specialOffers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-400">
              No special offers yet.
            </div>
          ) : (
            specialOffers.map((offer, idx) => (
              <div key={offer.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                {editingIndex === idx ? (
                  <SpecialEditCard
                    offer={offer}
                    onSubmit={(updated) => handleUpdateSpecial(idx, updated)}
                    onCancel={() => setEditingIndex(null)}
                    usedParties={usedParties.filter((p) => p !== offer.party)}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{offer.party}</p>
                        <Pill tone="blue">{offer.line}</Pill>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {offer.offerType === 'percent' ? `${offer.value}% extra discount` : `Buy ${offer.bogoBuy} get ${offer.bogoFree} free`}
                      </p>
                      {offer.minQty > 0 && <p className="text-xs text-slate-500">Min order: {offer.minQty} units</p>}
                      {offer.validityDate && <p className="text-xs text-slate-500">Valid until: {offer.validityDate}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button onClick={() => setEditingIndex(idx)} className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200" aria-label="Edit offer">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => handleDeleteSpecial(idx)} className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100" aria-label="Delete offer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DialogShell>
  );
};

const SpecialEditCard = ({ offer, onSubmit, onCancel, usedParties }) => {
  const [searchMode, setSearchMode] = useState('area');
  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState(offer.area || '');
  const [selectedLine, setSelectedLine] = useState(offer.line || '');
  const [selectedParty, setSelectedParty] = useState(offer.party || '');
  const [partyOpen, setPartyOpen] = useState(false);

  const [offerType, setOfferType] = useState(offer.offerType || 'percent');
  const [percentValue, setPercentValue] = useState(offer.value || 30);
  const [bogoBuy, setBogoBuy] = useState(offer.bogoBuy || 5);
  const [bogoFree, setBogoFree] = useState(offer.bogoFree || 10);
  const [minQty, setMinQty] = useState(offer.minQty || 0);
  const [validityDate, setValidityDate] = useState(offer.validityDate || '');

  const filteredAreas = uniqueAreas.filter((area) => area.toLowerCase().includes(searchValue.toLowerCase()));
  const filteredLines = LINES.filter((line) => line.name.toLowerCase().includes(searchValue.toLowerCase()));
  const partiesInCurrentScope = searchMode === 'area' ? (selectedArea ? getPartiesByArea(selectedArea) : []) : (selectedLine ? getPartiesByLine(selectedLine) : []);
  const availableParties = partiesInCurrentScope.filter((party) => !usedParties.includes(party) || party === offer.party);

  const save = () => {
    onSubmit({
      ...offer,
      party: selectedParty,
      line: selectedLine,
      area: selectedArea,
      offerType,
      minQty: Number(minQty) || 0,
      validityDate: validityDate || null,
      ...(offerType === 'percent' ? { value: Number(percentValue) || 0 } : { bogoBuy: Number(bogoBuy) || 0, bogoFree: Number(bogoFree) || 0 }),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          type="button"
          onClick={() => {
            setSearchMode('area');
            setSearchValue('');
            setSearchOpen(false);
            setSelectedLine('');
            setSelectedParty('');
          }}
          className={cls('flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all', searchMode === 'area' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}
        >
          Area
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchMode('line');
            setSearchValue('');
            setSearchOpen(false);
            setSelectedArea('');
            setSelectedParty('');
          }}
          className={cls('flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-all', searchMode === 'line' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500')}
        >
          Line
        </button>
      </div>

      <div className="relative">
        <label className="mb-1 block text-xs font-semibold text-slate-500">{searchMode === 'area' ? 'Search area' : 'Search line'}</label>
        <button type="button" onClick={() => setSearchOpen((s) => !s)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm">
          <span className={searchValue ? 'text-slate-900' : 'text-slate-400'}>{searchValue || (searchMode === 'area' ? 'Type an area...' : 'Type a line...')}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {searchOpen && (
          <div className="absolute z-20 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 p-2">
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <Search size={14} className="text-slate-400" />
                <input
                  autoFocus
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchMode === 'area' ? 'Search area...' : 'Search line...'}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto p-1">
              {searchMode === 'area'
                ? filteredAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setSelectedArea(area);
                        setSelectedLine('');
                        setSelectedParty('');
                        setSearchValue(area);
                        setSearchOpen(false);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      {area}
                    </button>
                  ))
                : filteredLines.map((line) => (
                    <button
                      key={line.name}
                      type="button"
                      onClick={() => {
                        setSelectedLine(line.name);
                        setSelectedArea(line.area);
                        setSelectedParty('');
                        setSearchValue(line.name);
                        setSearchOpen(false);
                      }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <div className="font-medium text-slate-900">{line.name}</div>
                      <div className="text-xs text-slate-500">{line.area}</div>
                    </button>
                  ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <label className="mb-1 block text-xs font-semibold text-slate-500">Party</label>
        <button
          type="button"
          onClick={() => setPartyOpen((s) => !s)}
          disabled={searchMode === 'area' ? !selectedArea : !selectedLine}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm disabled:cursor-not-allowed disabled:bg-slate-50"
        >
          <span className={selectedParty ? 'text-slate-900' : 'text-slate-400'}>{selectedParty || 'Select party...'}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {partyOpen && (
          <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {availableParties.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-400">No available parties</div>
            ) : (
              availableParties.map((party) => (
                <button
                  key={party}
                  type="button"
                  onClick={() => {
                    setSelectedParty(party);
                    setPartyOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                >
                  {party}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <OfferFields
        title="Offer details"
        subtitle="The saved party offer stays visible in this dialog after saving."
        offerType={offerType}
        setOfferType={setOfferType}
        percentValue={percentValue}
        setPercentValue={setPercentValue}
        bogoBuy={bogoBuy}
        setBogoBuy={setBogoBuy}
        bogoFree={bogoFree}
        setBogoFree={bogoFree}
        minQty={minQty}
        setMinQty={setMinQty}
        validityDate={validityDate}
        setValidityDate={setValidityDate}
        onCancel={onCancel}
        onSubmit={save}
        buttonLabel="Save party offer"
      />
    </div>
  );
};

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
const ExpiryOffersPage = () => {
  const [batches, setBatches] = useState(() => EXPIRING_BATCHES.map((batch) => ({ ...batch, offers: { common: null, special: [] } })));
  const [search, setSearch] = useState('');
  const [commonModalBatch, setCommonModalBatch] = useState(null);
  const [specialModalBatch, setSpecialModalBatch] = useState(null);

  const filteredBatches = useMemo(() => {
    const s = search.trim().toLowerCase();
    return batches.filter((b) => {
      if (!s) return true;
      return [b.productName, b.company, b.batchNumber].some((x) => x.toLowerCase().includes(s));
    });
  }, [batches, search]);

  const handleSaveOffers = (batchId, newOffers) => {
    setBatches((prev) => prev.map((b) => (b.id === batchId ? { ...b, offers: newOffers } : b)));
  };

  return (
    <>
      <Toaster position="bottom-right" richColors />
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Short Expiry Products Management</h1>
            <p className="mt-1 text-sm text-slate-500">Total due batches: {filteredBatches.length}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search medicine, company, or batch"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredBatches.map((batch) => {
            const expiryFormatted = getExpiryFormatted(batch.expiryDate);
            const badge = getExpiryBadge(batch.expiryDate);
            const hasOffers = batch.offers.common || (batch.offers.special || []).length > 0;

            return (
              <div key={batch.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className={cls('border-b p-4', badge.text === 'Critical' ? 'bg-rose-50 border-rose-200' : badge.text === 'Warning' ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200')}>
                  <div className="flex flex-wrap justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{batch.productName}</h3>
                      <p className="text-sm text-slate-500">{batch.company}</p>
                    </div>
                    <Pill tone={badge.text === 'Critical' ? 'red' : badge.text === 'Warning' ? 'amber' : 'slate'}>
                      {badge.text} ({expiryFormatted})
                    </Pill>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
                    <span>🧬 Batch: {batch.batchNumber}</span>
                    <span>📆 Expiry: {batch.expiryDate}</span>
                    <span>📦 Remaining: {batch.remainingUnits} units</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      {hasOffers ? (
                        <>
                          <p className="text-sm font-semibold text-slate-700">Active offers</p>
                          {batch.offers.common && (
                            <Pill tone="blue">
                              Common: {batch.offers.common.offerType === 'percent'
                                ? `${batch.offers.common.value}% off`
                                : `${batch.offers.common.bogoBuy}+${batch.offers.common.bogoFree} free`}
                            </Pill>
                          )}
                          {(batch.offers.special || []).length > 0 && (
                            <Pill tone="emerald">Special offers: {(batch.offers.special || []).length}</Pill>
                          )}
                        </>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
                          No offer configured yet.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={() => setCommonModalBatch(batch)}
                        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                      >
                        {batch.offers.common ? 'Edit common offer' : 'Add common offer'}
                      </button>
                      <button
                        onClick={() => setSpecialModalBatch(batch)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                      >
                        Special offer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {commonModalBatch && (
          <CommonOfferModal
            batch={commonModalBatch}
            offers={commonModalBatch.offers}
            onSave={(newOffers) => handleSaveOffers(commonModalBatch.id, newOffers)}
            onClose={() => setCommonModalBatch(null)}
          />
        )}

        {specialModalBatch && (
          <SpecialOfferModal
            batch={specialModalBatch}
            offers={specialModalBatch.offers}
            onSave={(newOffers) => handleSaveOffers(specialModalBatch.id, newOffers)}
            onClose={() => setSpecialModalBatch(null)}
          />
        )}
      </div>
    </>
  );
};

export default ExpiryOffersPage;