import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useProductCatalog } from '../../features/Client/ProductsPage/hooks/useProductCatalog';
import { api } from '../../services/api';
import { useStockAvailability } from '../../features/Client/Cart/hooks/useStockAvailability';
import { useEstimatedRates } from '../../features/Client/Cart/hooks/useEstimatedRates';
import {
  getMrpTotal,
  getEstimatedTotal,
  wouldExceedCreditLimit,
  isNearCreditLimit,
} from '../../features/Client/Cart/utils/cartMath';

import CartTabs from '../../features/Client/Cart/components/CartTabs';
import ProductSearchAdd from '../../features/Client/Cart/components/ProductSearchAdd';
import ReviewList from '../../features/Client/Cart/components/ReviewList';
import AlertsPanel from '../../features/Client/Cart/components/AlertsPanel';
import SummaryPanel from '../../features/Client/Cart/components/SummaryPanel';
import BillPreferenceSelector from '../../features/Client/Cart/components/BillPreferenceSelector';
import SubmitBar from '../../features/Client/Cart/components/SubmitBar';
import EmptyCartState from '../../features/Client/Cart/components/EmptyCartState';
import SubmitSuccessModal from '../../features/Client/Cart/components/SubmitSuccessModal';

const ClientCart = () => {
  // REAL AUTH CHECK & FINANCIAL DATA
  const { user } = useAuth();
  const isApproved = user?.status === 'Active';
  const creditLimit = user?.creditLimit || 0;
  const totalOutstanding = user?.outstanding || 0;
  const initialTab = location.state?.initialTab ?? (isApproved ? 'order' : 'inquiry');
  const [activeTab, setActiveTab] = useState(initialTab);

  const { products } = useProductCatalog();

  const {
    inquiryItems = [],
    orderItems = [],
    addItem,
    updateQty,
    removeItem,
    toggleOffer
  } = useCart();

  const rawItems = activeTab === 'order' ? orderItems : inquiryItems;

  const items = useMemo(() => {
    if (!rawItems || !Array.isArray(rawItems)) return [];

    return rawItems.map(item => {
      const catalogMatch = products.find(p => p.productId === item.productId);
      return {
        ...item,
        companyShortCode: catalogMatch?.companyShortCode || item.companyShortCode || item.company,
      };
    });
  }, [rawItems, products]);

  const tierByProductId = useStockAvailability(items);
  const rateByProductId = useEstimatedRates(items);

  const [billPreference, setBillPreference] = useState('Credit');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const mrpTotal = getMrpTotal(items);
  const estimatedTotal = getEstimatedTotal(items, rateByProductId);

  // We keep this variable for the UI warnings in the SummaryPanel, but it no longer blocks ordering
  const nearLimit = isNearCreditLimit(totalOutstanding, creditLimit || 1, estimatedTotal);

  const hasUnavailable = items.some((i) => tierByProductId[i.productId]?.tier === 'unavailable');

  // FORCE INQUIRY TAB IF NOT APPROVED
  useEffect(() => {
    if (!isApproved && activeTab === 'order') {
      setActiveTab('inquiry');
    }
  }, [isApproved, activeTab]);

  const buildSubmissionItems = () =>
    items.map((i) => {
      const highestMrp = i.batches?.length > 0 ? Math.max(...i.batches.map(b => b.mrp || 0)) : (i.mrp || 0);
      let unitPrice = highestMrp * 0.8;

      if (i.offerApplied && i.offer) unitPrice = i.offer.price;
      else if (rateByProductId[i.productId]) unitPrice = rateByProductId[i.productId];

      const qty = parseInt(i.requestedQty, 10) || 0;

      return {
        productId: i.productId,
        batchId: i.offerApplied ? i.offer?.batchId : undefined,
        requestedQty: qty,
        estimatedPrice: unitPrice,
        estimatedLineTotal: unitPrice * qty
      };
    });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        clientId: localStorage.getItem('clientId'),
        items: buildSubmissionItems(),
        billPreference,
      };

      if (activeTab === 'order') {
        await api.createOrder(payload);
        setSubmitted('order');
      } else {
        await api.createInquiry(payload);
        setSubmitted('inquiry');
      }
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-slate-900 text-2xl sm:text-3xl font-bold">Your Cart</h1>
        <p className="text-slate-500 font-medium mt-1 text-sm sm:text-base">Review your items before placing an order or inquiry</p>
      </div>

      <CartTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        canOrder={isApproved}
        inquiryCount={inquiryItems.length}
        orderCount={orderItems.length}
      />

      <div className="space-y-6">
        <ProductSearchAdd products={products} onAdd={(p) => addItem(activeTab, p)} />

        {items.length > 0 ? (
          <>
            <ReviewList
              items={items}
              tierByProductId={tierByProductId}
              rateByProductId={rateByProductId}
              onQtyChange={(productId, qty) => updateQty(activeTab, productId, qty)}
              onRemove={(productId) => removeItem(activeTab, productId)}
              onToggleOffer={(productId) => toggleOffer(activeTab, productId)}
            />

            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
              <p className="text-slate-900 font-bold text-lg sm:text-xl">
                {activeTab === 'order' ? 'Order Summary' : 'Inquiry Summary'}
              </p>

              <AlertsPanel items={items} tierByProductId={tierByProductId} />

              <SummaryPanel
                activeTab={activeTab}
                itemCount={items.length}
                mrpTotal={mrpTotal}
                estimatedTotal={estimatedTotal}
                totalOutstanding={totalOutstanding}
                creditLimit={creditLimit}
                nearLimit={nearLimit}
              />

              {/* ✨ CHANGED: creditDisabled is now permanently false so they can always pick Credit */}
              <BillPreferenceSelector
                value={billPreference}
                onChange={setBillPreference}
                creditDisabled={false}
              />

              <SubmitBar tab={activeTab} onSubmit={handleSubmit} disabled={submitting || hasUnavailable} />
            </div>
          </>
        ) : (
          <EmptyCartState tab={activeTab} />
        )}
      </div>

      {submitted && <SubmitSuccessModal type={submitted} onClose={() => setSubmitted(null)} />}
    </div>
  );
};

export default ClientCart;