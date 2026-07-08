// src/features/Client/Cart/components/ReviewList.jsx
import ReviewItem from './ReviewItem';

const ReviewList = ({ items, tierByProductId, rateByProductId, onQtyChange, onRemove, onToggleOffer }) => {
  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-slate-700 font-semibold text-base sm:text-lg">Review Items ({items.length})</p>
      {items.map((item) => (
        <ReviewItem
          key={item.productId}
          item={item}
          tier={tierByProductId[item.productId]}
          rateByProductId={rateByProductId}
          onQtyChange={(qty) => onQtyChange(item.productId, qty)}
          onRemove={() => onRemove(item.productId)}
          onToggleOffer={() => onToggleOffer(item.productId)}
        />
      ))}
    </div>
  );
};

export default ReviewList;