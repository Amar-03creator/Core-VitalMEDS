// src/components/ImageCarousel.jsx
import { useState, useRef } from 'react';
import { Package, ZoomIn } from 'lucide-react';
import ImageZoomModal from './ImageZoomModal';

const SWIPE_THRESHOLD = 40;

/**
 * Deliberately has NO autoplay timer — the spec calls this out explicitly.
 * `images` is an array so it's ready for real multi-image products; today
 * it'll almost always be a single-image array or empty, since Product.js
 * only has one `photoUrl` field and getProductsWithBatches doesn't even
 * return that yet (see useProductCatalog.js) — falls back to a placeholder
 * icon gracefully either way.
 */
const ImageCarousel = ({ images = [], alt = '', rounded = 'rounded-2xl' }) => {
  const [index, setIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const touchStartX = useRef(null);

  const hasImages = images.length > 0;

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta > SWIPE_THRESHOLD) setIndex((i) => Math.max(0, i - 1));
    else if (delta < -SWIPE_THRESHOLD) setIndex((i) => Math.min(images.length - 1, i + 1));
    touchStartX.current = null;
  };

  return (
    <>
      <div
        className={`relative w-full aspect-square bg-slate-100 ${rounded} overflow-hidden select-none`}
        onTouchStart={hasImages ? onTouchStart : undefined}
        onTouchEnd={hasImages ? onTouchEnd : undefined}
      >
        {hasImages ? (
          <button type="button" onClick={() => setZoomOpen(true)} className="w-full h-full block">
            <img src={images[index]} alt={alt} className="w-full h-full object-cover" draggable={false} />
            <span className="absolute bottom-2 right-2 bg-black/40 text-white rounded-full p-1.5 sm:p-2">
              <ZoomIn size={14} />
            </span>
          </button>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-slate-300" />
          </div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Image ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'bg-white w-4' : 'bg-white/60 w-1.5'}`}
              />
            ))}
          </div>
        )}
      </div>

      {zoomOpen && hasImages && (
        <ImageZoomModal src={images[index]} alt={alt} onClose={() => setZoomOpen(false)} />
      )}
    </>
  );
};

export default ImageCarousel;