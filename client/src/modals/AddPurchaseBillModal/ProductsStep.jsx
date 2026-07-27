// AddPurchaseBillModal/ProductsStep.jsx
import { useProductItems } from './useProductItems';
import { ItemList } from './components/ItemList';
import { AddItemForm } from './components/AddItemForm';

export const ProductsStep = ({
  products,
  productsLoading,
  supplierId,
  items, setItems,
  purchaseType,
  billDate,
  showAddProduct, setShowAddProduct,
}) => {
  const {
    currentItem, setCurrentItem,
    editingItemId,
    ratesLoading,
    draggedIdx,
    productSearch, setProductSearch,
    showProductList, setShowProductList,
    productOptions,
    availableBatches,
    handleSelectProduct,
    clearProduct,
    handleBatchChange,
    handleEditItem,
    cancelEdit,
    handleAddOrUpdateItem,
    removeItem,
    moveItemUp,
    moveItemDown,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    calcItemPreview,
  } = useProductItems({ products, items, setItems, purchaseType, billDate });

  if (productsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading products for this supplier…</p>
      </div>
    );
  }

  if (!productsLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
        <p className="text-base font-semibold text-slate-500">No products found for this supplier.</p>
        <p className="text-sm text-slate-400">Use the "Add Product" button to link products to this supplier.</p>
        <button
          type="button"
          onClick={() => setShowAddProduct(true)}
          className="mt-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 shadow-sm"
        >
          + Add Product
        </button>
      </div>
    );
  }

  return (
    // ✨ FIX: Just a simple flowing div
    <div className="space-y-6">
      {items.length > 0 && (
        <ItemList
          items={items}
          purchaseType={purchaseType}
          moveItemUp={moveItemUp}
          moveItemDown={moveItemDown}
          handleEditItem={handleEditItem}
          removeItem={removeItem}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDragEnd={handleDragEnd}
          draggedIdx={draggedIdx}
        />
      )}
      <AddItemForm
        currentItem={currentItem}
        editingItemId={editingItemId}
        ratesLoading={ratesLoading}
        setCurrentItem={setCurrentItem}
        handleAddOrUpdateItem={handleAddOrUpdateItem}
        cancelEdit={cancelEdit}
        productSearch={productSearch}
        setProductSearch={setProductSearch}
        showProductList={showProductList}
        setShowProductList={setShowProductList}
        productOptions={productOptions}
        availableBatches={availableBatches}
        handleSelectProduct={handleSelectProduct}
        clearProduct={clearProduct}
        batchNumber={currentItem.batchNumber}
        onBatchChange={handleBatchChange}
        purchaseType={purchaseType}
        billDate={billDate}
        showAddProduct={showAddProduct}
        setShowAddProduct={setShowAddProduct}
        calcItemPreview={calcItemPreview}
      />
    </div>
  );
};