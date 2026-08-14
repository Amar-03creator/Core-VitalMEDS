// src/modals/MakeInvoiceModal/index.jsx
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '../../services/api'; // ✨ FIX: Imported API to fetch the populated order
import { useModalTrap, useScrollLock } from '../../hooks/useBackHandler';
import { downloadInvoicePDF, printInvoicePDF } from '../../features/Admin/BillingPage/pdf/invoice/generateInvoicePdf';
import { useInvoiceLogic } from './useInvoiceLogic';

import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';
import { Step4 } from './Step4';
import { ExitDialog, ModReasonPrompt, ClientEditingPrompt, LiveTimerOverlay, OrderCancelledPrompt } from './components/InvoiceOverlays';

export const MakeInvoiceModal = ({
  onClose, prefillClient = null, lockClient = false, disableBackTrap = false,
  prefillOrder = null, phoneIn = false, onOrderUpdated = null, onOpenOrder,
}) => {
  const navigate = useNavigate();

  const { state, setters, computed, handlers, misc } = useInvoiceLogic({
    prefillClient, lockClient, prefillOrder, phoneIn, onOrderUpdated
  });

  const closeModal = useCallback(() => {
    state.editingInvoiceId ? setters.setShowExitDialog(true) : (sessionStorage.removeItem(misc.STORAGE_KEY), onClose());
  }, [state.editingInvoiceId, onClose, misc.STORAGE_KEY, setters]);

  useModalTrap(true, { disabled: disableBackTrap, onBackClose: onClose, customId: misc.STORAGE_KEY });
  useScrollLock(true);

  const handleDiscardChanges = () => {
    setters.setShowExitDialog(false);
    setters.setEditingInvoiceId(null);
    sessionStorage.removeItem(misc.STORAGE_KEY);
    onClose();
    toast.info('Unsaved edits discarded. Original invoice is unchanged.');
  };

  const handleViewAllInvoices = () => {
    closeModal();
    if (!prefillClient) navigate('/admin-dashboard/billing');
  };

  if (state.loading) return <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4"><div className="w-full max-w-5xl bg-white rounded-2xl flex items-center justify-center h-[50vh]"><Loader2 className="animate-spin text-slate-500" /></div></div>;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center md:justify-center md:p-4 md:pt-[85px]">
        <div className="w-full md:max-w-2xl bg-white rounded-t-3xl md:rounded-3xl max-h-[92vh] md:max-h-[calc(100vh-100px)] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white z-30 border-b border-slate-100">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{state.editingInvoiceId ? 'Edit Invoice' : prefillOrder ? `Invoice for ${prefillOrder.orderId}` : phoneIn ? 'New Phone-in Order' : 'Generate Invoice'}</h3>
                <p className="text-slate-500 text-sm font-mono">{state.invoiceNumber}</p>
              </div>
              <button onClick={closeModal} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={22} className="text-slate-400" /></button>
            </div>
            {state.step < 4 && (
              <div className="flex bg-slate-50">
                {[1, 2, 3].map(n => <button key={n} onClick={() => { if (n < state.step || (n === 2 && computed.canProceed1) || (n === 3 && state.items.length > 0)) setters.setStep(n); }} className={`flex-1 py-3 text-sm font-semibold border-b-2 ${state.step === n ? 'border-slate-900 text-slate-900 bg-white' : n < state.step ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400'}`}>{n < state.step ? '✓ ' : `${n}. `}{n === 1 ? 'Party & Header' : n === 2 ? 'Add Items' : 'Review & Confirm'}</button>)}
              </div>
            )}
          </div>

          <div className="px-5 py-4 pb-10 animate-fadeIn">
            {state.step === 1 && (
              <Step1
                clientSearch={state.clientSearch} setClientSearch={setters.setClientSearch} showClientDropdown={state.showClientDropdown} setShowClientDropdown={setters.setShowClientDropdown}
                selectedClient={state.selectedClient} setSelectedClient={setters.setSelectedClient} filteredClients={computed.filteredClients} handleSelectClient={handlers.handleSelectClient}
                billType={state.billType} setBillType={setters.setBillType} invoiceDate={state.invoiceDate} address={state.address} gstin={state.gstin} drugLicense={state.drugLicense} pan={state.pan} aadhaar={state.aadhaar}
                lockClient={computed.effectiveLockClient} canProceed1={computed.canProceed1} onNext={() => setters.setStep(2)} prefBillType={prefillOrder?.billPreference}
              />
            )}
            
            {state.step === 2 && <Step2 hasOrder={!!prefillOrder} productSearch={state.productSearch} setProductSearch={setters.setProductSearch} showProductDrop={state.showProductDrop} setShowProductDrop={setters.setShowProductDrop} filteredProducts={computed.filteredProducts} addProduct={handlers.addProduct} cloneProductForNewBatch={handlers.cloneProductForNewBatch} items={state.items} removeItem={handlers.removeItem} updateItem={handlers.updateItem} handleBatchChange={handlers.handleBatchChange} canProceed2={state.items.length > 0} onBack={() => setters.setStep(1)} onNext={() => setters.setStep(3)} />}

            {state.step === 3 && <Step3 invoiceNumber={state.invoiceNumber} selectedClient={state.selectedClient} billType={state.billType} invoiceDate={state.invoiceDate} gstin={state.gstin} drugLicense={state.drugLicense} items={state.items} totalTaxable={computed.totalTaxable} globalDiscountValue={state.globalDiscountValue} globalDiscountType={state.globalDiscountType} setGlobalDiscountType={setters.setGlobalDiscountType} setGlobalDiscountValue={setters.setGlobalDiscountValue} adminNote={state.adminNote} setAdminNote={setters.setAdminNote} clientNote={state.clientNote} clientNoteEdited={state.clientNoteEdited} finalDiscount={computed.finalDiscount} totalCGST={computed.totalCGST} totalSGST={computed.totalSGST} roundOff={computed.roundOff} netAmount={computed.netAmount} onBack={() => setters.setStep(2)} onConfirm={handlers.handleConfirmClick} />}

            {state.step === 4 && state.generatedInvoice && (
              <Step4 
                generatedInvoice={state.generatedInvoice} 
                isPrefilled={!!prefillOrder || phoneIn} 
                isClientProfile={!!prefillClient} 
                onDownloadPDF={() => downloadInvoicePDF(state.generatedInvoice, state.items.map((l, i) => ({ ...l, companyShortCode: state.generatedInvoice.products[i]?.companyShortCode || l.companyShortCode || l.company })), computed.totalTaxable, computed.totalCGST, computed.totalSGST, computed.netAmount, state.globalDiscountValue, computed.finalDiscount, 'intrastate', state.adminProfile)} 
                onPrintPDF={() => printInvoicePDF(state.generatedInvoice, state.items.map((l, i) => ({ ...l, companyShortCode: state.generatedInvoice.products[i]?.companyShortCode || l.companyShortCode || l.company })), computed.totalTaxable, computed.totalCGST, computed.totalSGST, computed.netAmount, state.globalDiscountValue, computed.finalDiscount, 'intrastate', state.adminProfile)} 
                onNewInvoice={handlers.handleNewInvoice} 
                onEditInvoice={() => { 
                  setters.setEditingInvoiceId(state.generatedInvoice._id); 
                  setters.setStep(2); 
                }} 
                onClose={closeModal} 
                onViewAllInvoices={handleViewAllInvoices} 
                
                // ✨ FIX: Fetches the fully populated order before opening the modal!
                onStartPacking={async () => {
                  closeModal();
                  if (onOpenOrder && state.generatedInvoice.rawOrder) {
                    try {
                      const freshRes = await api.getOrderById(state.generatedInvoice.rawOrder._id);
                      onOpenOrder(freshRes.data);
                    } catch (e) {
                      onOpenOrder(state.generatedInvoice.rawOrder); // Fallback just in case
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      <ExitDialog isOpen={state.showExitDialog} onComplete={() => { setters.setShowExitDialog(false); setters.setStep(3); }} onDiscard={handleDiscardChanges} onCancel={() => setters.setShowExitDialog(false)} />
      <ModReasonPrompt isOpen={state.showModReasonPrompt} modReason={state.modReason} setModReason={setters.setModReason} onBack={() => setters.setShowModReasonPrompt(false)} onContinue={() => { setters.setShowModReasonPrompt(false); handlers.handleConfirm(); }} />
      <ClientEditingPrompt isOpen={state.showEditPrompt} onOk={() => { setters.setShowEditPrompt(false); setters.setShowTimerOverlay(true); }} onGoToOrders={() => { onClose(); navigate('/admin-dashboard/orders'); }} />
      <LiveTimerOverlay isOpen={state.showTimerOverlay} timer={state.editTimer} onBackToOrders={() => { onClose(); navigate('/admin-dashboard/orders'); }} />

      <OrderCancelledPrompt
        isOpen={state.showCancelPrompt}
        reason={state.cancelReason}
        onGoToOrders={() => {
          setters.setShowCancelPrompt(false);
          sessionStorage.removeItem(misc.STORAGE_KEY);
          if (onOrderUpdated) onOrderUpdated({ ...prefillOrder, status: 'Cancelled', _id: prefillOrder._id });
          onClose();
        }}
      />
    </>
  );
};

export default MakeInvoiceModal;