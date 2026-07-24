// src/features/Client/Cart/components/ReviewList.jsx
import ReviewItem from './ReviewItem';

const ReviewList = ({ items, tierByKey, rateByKey,activeTab,  onQtyChange, onRemove, onAddOfferItem }) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-slate-700 font-semibold text-base sm:text-lg">Review Items ({items.length})</p>
      {items.map((item) => {
        const cartKey = `${item.productId}_${item.batchId || 'standard'}`;
        return (
          <ReviewItem
            key={cartKey}
            item={item}
            allItems={items}
            tier={tierByKey?.[cartKey]}
            rateByKey={rateByKey}
            activeTab={activeTab}
            onQtyChange={(qty) => onQtyChange(item.productId, item.batchId, qty)}
            onRemove={() => onRemove(item.productId, item.batchId)}
            onAddOfferItem={(offerBatch) => onAddOfferItem(item, offerBatch)}
          />
        );
      })}
    </div>
  );
};

export default ReviewList;