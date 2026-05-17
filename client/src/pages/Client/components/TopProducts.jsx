// components/TopProducts.jsx
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import {
  ArrowRight,
  Package,
  Star,
  X,
  ShoppingCart,
  ClipboardList,
  Flame,
  Info,
  AlertTriangle,
} from 'lucide-react';

const formatPrice = (price) => {
  const value = Number(price) || 0;
  return `₹${value.toFixed(2)}`;
};

const parseExpiryDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatExpiryLabel = (value) => {
  if (!value) return '—';
  const date = parseExpiryDate(value);
  if (!date) return value;
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const getDiscountPercent = (mrp, price) => {
  const mrpValue = Number(mrp) || 0;
  const priceValue = Number(price) || 0;
  if (mrpValue <= 0 || priceValue < 0 || priceValue > mrpValue) return 0;
  return Math.round(((mrpValue - priceValue) / mrpValue) * 100);
};

const getTotalStock = (product) =>
  (product?.batches || []).reduce((sum, batch) => sum + (Number(batch.stock) || 0), 0);

const getClosestRegularBatchExpiry = (product) => {
  const regularBatches = (product?.batches || [])
    .filter((batch) => !batch.isShortExpiry)
    .map((batch) => ({
      ...batch,
      parsedExpiry: parseExpiryDate(batch.expiryDateValue),
    }))
    .filter((batch) => batch.parsedExpiry);

  if (!regularBatches.length) return null;

  regularBatches.sort((a, b) => a.parsedExpiry - b.parsedExpiry);
  return regularBatches[0];
};

const getProductStatus = (product) => {
  const totalStock = getTotalStock(product);
  const threshold = Number(product?.lowStockThreshold ?? 20);
  const explicitInStock = product?.inStock;

  const inStock = typeof explicitInStock === 'boolean' ? explicitInStock : totalStock > 0;
  const lowStock = inStock && totalStock > 0 && totalStock <= threshold;

  return { totalStock, threshold, inStock, lowStock };
};

// Short expiry batch item with a clear 3-section layout
const ShortExpiryBatchItem = ({
  batch,
  productName,
  regularPrice,
  mrp,
  onAddToCart,
  onAddToInquiry,
}) => {
  const [qty, setQty] = useState(1);
  const maxQty = Math.max(0, Number(batch.stock) || 0);
  const safeQty = Math.min(qty, maxQty || 1);
  const isOverBatchStock = qty > maxQty;

  const handleQtyChange = (value) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setQty(1);
      return;
    }
    setQty(Math.max(1, Math.min(parsed, maxQty > 0 ? maxQty : 1)));
  };

  const handleAddToCart = () => onAddToCart?.(productName, batch, safeQty);
  const handleAddToInquiry = () => onAddToInquiry?.(productName, batch, safeQty);

  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50 p-2.5 shadow-sm space-y-3">

      <div className='grid grid-cols-[1fr_2fr] gap-4'>
        {/* First div: Expiry, stock, discount note */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-2 py-1 text-sm font-bold text-orange-700">
            <Flame size={18} /> Short Expiry
          </div>

          <p className="mt-2 text-sm text-slate-600">
            Expires: {batch.expiryDateLabel || formatExpiryLabel(batch.expiryDateValue)}
          </p>
          <p className="text-sm text-slate-600">Stock: {maxQty} units</p>

          {batch.extraDiscount && (
            <p className="mt-1 text-xs font-medium text-orange-700">
              Extra {batch.extraDiscount} off on this batch!
            </p>
          )}
        </div>

        {/* Second div: Quantity selector + action buttons */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-white px-3 py-2 shadow-sm">
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">Qty</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >−</button>
              <Input
                type="number"
                min={1}
                max={maxQty > 0 ? maxQty : 1}
                value={qty}
                onChange={(e) => handleQtyChange(e.target.value)}
                className="h-8 w-16 text-center"
              />
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >+</button>
            </div>
            {maxQty > 0 && <span className="text-sm text-slate-500">Max {maxQty}</span>}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={maxQty === 0 || isOverBatchStock}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-md font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart size={26} /> Add to Cart
            </button>

            <button
              type="button"
              onClick={handleAddToInquiry}
              disabled={maxQty === 0 || isOverBatchStock}
              className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-md font-bold text-blue-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ClipboardList size={26} /> Add to Inquiry
            </button>
          </div>

          {isOverBatchStock && (
            <p className="text-sm font-medium text-red-600">
              Don&apos;t add more than this - no stock available more than this.
            </p>
          )}
        </div>
      </div>

      {/* Third div: Special price with strikethroughs */}
      <div className="rounded-xl border border-orange-100 bg-white p-3 text-center shadow-sm">
        <p className="text-xs text-slate-400 line-through">
          MRP: {formatPrice(mrp)}
        </p>
        <p className="text-sm text-slate-500 line-through">
          Regular price: {formatPrice(regularPrice)}
        </p>
        <p className="text-xl font-black text-emerald-600">
          Offer price: {formatPrice(batch.price)}
        </p>
      </div>
    </div>
  );
};

const ProductCard = ({ product, onOpen }) => {
  const { totalStock, inStock, lowStock } = getProductStatus(product);

  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left transition-transform active:scale-[0.98]"
      aria-label={`Open details for ${product.name}`}
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
        {product.thumbnail ? (
          <img src={product.thumbnail} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <Package size={20} className="text-slate-400" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-base font-semibold text-slate-900">{product.name}</p>
          {!inStock && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
              Out of Stock
            </span>
          )}
          {lowStock && inStock && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              Low stock
            </span>
          )}
          {product.isNew && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
              New
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">{product.company}</p>
        <p className="mt-0.5 text-xs text-slate-400">{product.packSize}</p>
      </div>

      <div className="shrink-0 text-right">
        {product.mrp != null && (
          <p className="text-xs text-slate-400 line-through">{formatPrice(product.mrp)}</p>
        )}
        <p className="text-base font-bold text-slate-900">{formatPrice(product.price)}</p>
        <p className="text-[11px] text-slate-400">{totalStock} stock</p>
      </div>
    </button>
  );
};

const ProductDrawer = ({
  product,
  isOpen,
  onClose,
  isClientApproved,
  onAddToCart,
  onAddToInquiry,
}) => {
  const [selectedQty, setSelectedQty] = useState(1);

  // Fix: reset only when drawer opens
  useEffect(() => {
    if (isOpen) {
      setSelectedQty(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const shortExpiryBatches = useMemo(
    () => (product?.batches || []).filter((batch) => batch.isShortExpiry),
    [product]
  );

  const closestRegularExpiry = useMemo(
    () => getClosestRegularBatchExpiry(product),
    [product]
  );

  const { totalStock, inStock, lowStock } = useMemo(
    () => getProductStatus(product),
    [product]
  );

  const discountPercent = useMemo(
    () => getDiscountPercent(product?.mrp, product?.price),
    [product]
  );

  const maxProductQty = Math.max(1, totalStock || 1);
  const isOverStock = selectedQty > totalStock && totalStock > 0;
  const canPlaceOrder = isClientApproved && inStock && totalStock > 0 && !isOverStock;

  const handleSelectedQtyChange = (value) => {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setSelectedQty(1);
      return;
    }
    setSelectedQty(Math.max(1, Math.min(parsed, maxProductQty)));
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <button
        type="button"
        aria-label="Close drawer overlay"
        className="absolute inset-0 cursor-default bg-black/50"
        onClick={onClose}
      />

      <div className="relative w-full max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-100 bg-white/95 px-4 pb-3 pt-3 backdrop-blur-sm">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-red-600 p-2 text-white shadow-md hover:bg-red-700"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-4 flex h-40 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package size={56} className="text-slate-300" />
          )}
        </div>

        <div className="space-y-5 px-5 pb-8 pt-4">
          <div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {!inStock && (
                <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
                  Out of Stock
                </span>
              )}
              {lowStock && inStock && (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                  Low stock — only {totalStock} left
                </span>
              )}
              {product.isNew && (
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                  New
                </span>
              )}
              {product.prescriptionRequired && (
                <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">
                  Prescription Required
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-2xl font-bold text-slate-900">{product.name}</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-500">
                {product.category}
              </span>
            </div>

            <p className="mt-1 text-base text-slate-500">
              {product.company} &middot; {product.packSize}
            </p>

            {product.sku && (
              <p className="mt-1 text-xs text-slate-400">SKU: {product.sku}</p>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-baseline gap-3">
              <p className="text-3xl font-black text-emerald-600">
                {formatPrice(product.price)}
              </p>
              {product.mrp != null && (
                <p className="text-base text-slate-400 line-through">
                  {formatPrice(product.mrp)}
                </p>
              )}
              {discountPercent > 0 && (
                <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-sm font-bold text-emerald-600">
                  {discountPercent}% off
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">Maximum Retail Price (MRP)</p>
          </div>

          {/* Quantity selector in shadcn Input */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Order quantity
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Select how many strips you need for this product.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >−</button>
                  <Input
                    type="number"
                    min={1}
                    max={maxProductQty}
                    value={selectedQty}
                    onChange={(e) => handleSelectedQtyChange(e.target.value)}
                    className="h-9 w-20 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedQty((q) => q + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >+</button>
                </div>
              </div>
            </div>

            {totalStock > 0 && isOverStock && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                Don&apos;t add more than this - no stock available more than this.
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() =>
                  onAddToCart?.({
                    product,
                    quantity: selectedQty,
                    source: 'product-drawer',
                  })
                }
                disabled={!canPlaceOrder}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>

              <button
                type="button"
                onClick={() =>
                  onAddToInquiry?.({
                    product,
                    quantity: selectedQty,
                    source: 'product-drawer',
                  })
                }
                disabled={!isClientApproved || !inStock || totalStock === 0 || isOverStock}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ClipboardList size={18} /> Add to Inquiry
              </button>
            </div>
          </div>

          {shortExpiryBatches.length > 0 && (
            <div>
              <h4 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
                <Flame size={18} className="text-orange-500" />
                Short Expiry Batches
              </h4>

              <div className="space-y-3">
                {shortExpiryBatches.map((batch) => (
                  <ShortExpiryBatchItem
                    key={batch.batchNo}
                    batch={batch}
                    productName={product.name}
                    regularPrice={product.price}
                    mrp={product.mrp}
                    onAddToCart={(name, selectedBatch, qty) =>
                      onAddToCart?.({
                        product,
                        batch: selectedBatch,
                        quantity: qty,
                        productName: name,
                        source: 'short-expiry',
                      })
                    }
                    onAddToInquiry={(name, selectedBatch, qty) =>
                      onAddToInquiry?.({
                        product,
                        batch: selectedBatch,
                        quantity: qty,
                        productName: name,
                        source: 'short-expiry',
                      })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase text-slate-400">Composition</p>
              <p className="mt-0.5 whitespace-normal wrap-break-word text-base font-medium text-slate-800">
                {product.composition}
              </p>

              {closestRegularExpiry && (
                <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-600">
                  <span className="font-semibold">Expiry guarantee:</span> The closest expiry date among them is{' '}
                  <span className="font-semibold text-slate-900">
                    {closestRegularExpiry?.expiryDateLabel ||
                      formatExpiryLabel(closestRegularExpiry?.expiryDateValue) ||
                      '—'}
                  </span>
                  {closestRegularExpiry && ' (at least).'}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase text-slate-400">GST Rate</p>
                <p className="mt-0.5 text-base font-medium text-slate-800">
                  {product.gstRate ?? 5}%
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-xs font-semibold uppercase text-slate-400">Delivery</p>
                <p className="mt-0.5 text-base font-medium text-slate-800">
                  {product.deliveryTime || '—'}
                </p>
              </div>
            </div>
          </div>

          {product.usageDosage && (
            <div>
              <p className="mb-1.5 text-sm font-semibold uppercase text-slate-500">
                Usage &amp; Dosage
              </p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <p className="text-base leading-relaxed text-slate-700">{product.usageDosage}</p>
              </div>
            </div>
          )}

          {product.description && (
            <div>
              <p className="mb-1.5 text-sm font-semibold uppercase text-slate-500">About</p>
              <p className="text-base leading-relaxed text-slate-700">{product.description}</p>
            </div>
          )}

          {product.storage && (
            <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2.5">
              <Info size={16} className="mt-0.5 shrink-0 text-blue-500" />
              <p className="text-sm text-blue-700">{product.storage}</p>
            </div>
          )}

          {product.prescriptionRequired && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-sm font-medium text-amber-800">
                ⚕️ Prescription medicine – consume only if prescribed by a qualified doctor.
              </p>
            </div>
          )}

          {!isClientApproved && (
            <div className="rounded-xl bg-slate-100 p-3 text-center text-sm text-slate-600">
              ⏳ Your account is pending approval. You cannot place orders yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TopProducts = ({
  products = [],
  isClientApproved = true,
  onAddToCart,
  onAddToInquiry,
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const openDrawer = (product) => {
    setSelectedProduct(product);
    window.history.pushState({ modalOpen: true }, '');
  };
  const closeDrawer = () => setSelectedProduct(null);
  useEffect(() => {
    const handlePopState = () => {
      if (selectedProduct) {
        closeDrawer();
        // Push a new state to keep the modal closed on subsequent back presses
        window.history.pushState(null, '');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedProduct]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-xl font-bold text-slate-800">
          <Star size={18} className="text-amber-500" /> Top Products
        </h2>

        <Link
          to="/client-dashboard/products"
          className="flex items-center gap-1 text-md font-semibold text-emerald-600"
        >
          Browse all <ArrowRight size={13} />
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
          No products available.
        </div>
      ) : (
        <div className="space-y-2.5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onOpen={openDrawer} />
          ))}
        </div>
      )}

      <ProductDrawer
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={closeDrawer}
        isClientApproved={isClientApproved}
        onAddToCart={onAddToCart}
        onAddToInquiry={onAddToInquiry}
      />
    </div>
  );
};

export default TopProducts;