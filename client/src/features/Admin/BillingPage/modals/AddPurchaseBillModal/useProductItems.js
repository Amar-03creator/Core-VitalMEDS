// AddPurchaseBillModal/useProductItems.js
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '../../../../../services/api';

const genId = () => Date.now() + '-' + Math.random().toString(36).substr(2, 5);

export const expiryToDate = (expiryStr) => {
  const months = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
  const parts = expiryStr.split(' ');
  if (parts.length !== 2) return '';
  const month = months[parts[0]];
  if (!month) return '';
  const lastDay = new Date(parseInt(parts[1]), parseInt(month), 0).getDate();
  return `${parts[1]}-${month}-${String(lastDay).padStart(2, '0')}`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
};

export const useProductItems = ({ products, items, setItems, purchaseType, billDate }) => {
  const emptyItem = () => ({
    slNo: items.length + 1,
    productId: '', batchNumber: '', expiryDate: '',
    hsn: '',
    mrp: '', purchaseRate: '', ptr: '',
    qty: '1', free: '0',
    discountType: 'percent', discountValue: '',
    cgstRate: '', sgstRate: '', igstRate: '',
  });

  const [currentItem, setCurrentItem]     = useState(emptyItem);
  const [editingItemId, setEditingItemId] = useState(null);
  const [draggedIdx, setDraggedIdx]       = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [showProductList, setShowProductList] = useState(false);
  const [ratesLoading, setRatesLoading]   = useState(false);

  useEffect(() => {
    setEditingItemId(null);
    setCurrentItem(prev => ({ ...prev, slNo: items.length + 1 }));
  }, [items.length]);

  const productOptions = useMemo(() => {
    let list = products || [];
    if (productSearch) {
      const s = productSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(s));
    }
    return list.map(p => ({
      id:      p._id || p.id,
      label:   `${p.name} (HSN ${p.hsnCode || p.hsn || ''})`,
      packing: p.packing,
      hsn:     p.hsnCode || p.hsn,
      gstRate: p.gstRate,
      name:    p.name,
    }));
  }, [productSearch, products]);

  useEffect(() => {
    const mrp = parseFloat(currentItem.mrp);
    setCurrentItem(prev => ({ ...prev, ptr: (!isNaN(mrp) && mrp > 0) ? (mrp * 0.8).toFixed(2) : '' }));
  }, [currentItem.mrp]);

  useEffect(() => {
    if (!currentItem.productId) return;
    const product = products?.find(p => (p._id || p.id) === currentItem.productId);
    if (!product) return;
    const gstRate = product.gstRate || 0;
    if (purchaseType === 'intrastate') {
      setCurrentItem(prev => ({ ...prev, cgstRate: (gstRate / 2).toFixed(1), sgstRate: (gstRate / 2).toFixed(1), igstRate: '' }));
    } else {
      setCurrentItem(prev => ({ ...prev, cgstRate: '', sgstRate: '', igstRate: gstRate.toFixed(1) }));
    }
  }, [currentItem.productId, purchaseType, products]);

  useEffect(() => {
    if (!currentItem.productId) {
      setRatesLoading(false);
      return;
    }
    let cancelled = false;
    const fetchRates = async () => {
      setRatesLoading(true);
      try {
        const res = await api.getLastRatesForProduct(currentItem.productId);
        if (!cancelled && res.found) {
          setCurrentItem(prev => ({
            ...prev,
            mrp:          res.mrp          != null ? String(res.mrp)          : prev.mrp,
            purchaseRate: res.purchaseRate != null ? String(res.purchaseRate) : prev.purchaseRate,
            ptr:          res.ptr          != null ? String(res.ptr)          : prev.ptr,
          }));
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setRatesLoading(false);
      }
    };
    fetchRates();
    return () => { cancelled = true; };
  }, [currentItem.productId]);

  const parseNum = v => (isNaN(parseFloat(v)) ? 0 : parseFloat(v));

  const calcItemPreview = () => {
    const rate  = parseNum(currentItem.purchaseRate);
    const qty   = parseInt(currentItem.qty) || 0;
    const gross = rate * qty;
    let discount = 0;
    if (currentItem.discountValue && parseNum(currentItem.discountValue) > 0) {
      discount = currentItem.discountType === 'percent'
        ? (gross * parseNum(currentItem.discountValue)) / 100
        : parseNum(currentItem.discountValue);
    }
    const taxable = gross - discount;
    let cgst = 0, sgst = 0, igst = 0;
    if (purchaseType === 'intrastate') {
      cgst = taxable * parseNum(currentItem.cgstRate) / 100;
      sgst = taxable * parseNum(currentItem.sgstRate) / 100;
    } else {
      igst = taxable * parseNum(currentItem.igstRate) / 100;
    }
    return { gross, discount, taxable, cgst, sgst, igst, lineTotal: taxable + cgst + sgst + igst };
  };

  const handleSelectProduct = (item) => {
    setCurrentItem(prev => ({
      ...prev,
      productId: item.id,
      hsn:       item.hsn || '',
    }));
    setProductSearch(item.label);
    setShowProductList(false);
  };

  const clearProduct = () => {
    setCurrentItem(prev => ({ ...prev, productId: '', hsn: '' }));
    setProductSearch('');
    setShowProductList(false);
  };

  const handleBatchChange = (val) => setCurrentItem(prev => ({ ...prev, batchNumber: val }));

  const handleEditItem = (item) => {
    setEditingItemId(item.id);
    setCurrentItem({
      slNo: item.slNo,
      productId: item.productId,
      batchNumber: item.batchNumber,
      expiryDate: item.expiryDate,
      hsn:          item.hsn || '',
      mrp: item.mrp.toString(),
      purchaseRate: item.purchaseRate.toString(),
      ptr: item.ptr.toString(),
      qty: item.chargeableQty.toString(),
      free: item.freeQty.toString(),
      discountType: item.discountType,
      discountValue: item.discountValue.toString(),
      cgstRate: item.cgstRate.toString(),
      sgstRate: item.sgstRate.toString(),
      igstRate: item.igstRate.toString(),
    });
    setProductSearch(item.productName);
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setCurrentItem(emptyItem());
    setProductSearch('');
  };

  const handleAddOrUpdateItem = () => {
    if (!currentItem.productId || !currentItem.batchNumber || !currentItem.expiryDate || !currentItem.purchaseRate) {
      toast.error('Please fill all required fields');
      return;
    }
    const qtyNum = parseInt(currentItem.qty) || 0;
    if (qtyNum <= 0) { toast.error('Quantity must be greater than 0'); return; }
    if (billDate && currentItem.expiryDate && currentItem.expiryDate <= billDate) {
      toast.error('Expiry date must be after bill date'); return;
    }
    const product = products?.find(p => (p._id || p.id) === currentItem.productId);
    if (!product) { toast.error('Product not found'); return; }

    const itemData = {
      ...currentItem,
      id:           editingItemId || genId(),
      productName:  product.name,
      packing:      product.packing,
      hsn:          currentItem.hsn || product.hsnCode || product.hsn,
      gstRate:      product.gstRate,
      mrp:          parseNum(currentItem.mrp),
      purchaseRate: parseNum(currentItem.purchaseRate),
      ptr:          parseNum(currentItem.ptr),
      chargeableQty: qtyNum,
      freeQty:       parseInt(currentItem.free) || 0,
      discountValue: parseNum(currentItem.discountValue),
      ...calcItemPreview(),
    };

    if (editingItemId) {
      setItems(prev => prev.map(it => it.id === editingItemId ? itemData : it));
      toast.success('Item updated');
    } else {
      setItems(prev => [...prev, itemData]);
      toast.success('Item added');
    }
    cancelEdit();
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.id !== id));
    toast('Item removed', { type: 'info' });
  };

  const reorder = (arr, from, to) => {
    const n = [...arr];
    [n[from], n[to]] = [n[to], n[from]];
    return n.map((it, idx) => ({ ...it, slNo: idx + 1 }));
  };

  const moveItemUp   = (i) => { if (i > 0)                  setItems(reorder(items, i, i - 1)); };
  const moveItemDown = (i) => { if (i < items.length - 1)   setItems(reorder(items, i, i + 1)); };

  const handleDragStart = (e, i) => {
    setDraggedIdx(i);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragOver = (e, i) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === i) return;
    setItems(reorder(items, draggedIdx, i));
    setDraggedIdx(i);
  };

  const handleDragEnd = () => setDraggedIdx(null);

  return {
    currentItem, setCurrentItem,
    editingItemId,
    ratesLoading,
    draggedIdx,
    productSearch, setProductSearch,
    showProductList, setShowProductList,
    productOptions,
    handleSelectProduct, clearProduct,
    handleBatchChange,
    handleEditItem, cancelEdit,
    handleAddOrUpdateItem,
    removeItem,
    moveItemUp, moveItemDown,
    handleDragStart, handleDragOver, handleDragEnd,
    calcItemPreview,
  };
};