// src/components/ImageCarousel.jsx
import { useState, useEffect } from 'react';
import { Package, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageCarousel = ({ 
  images = [], 
  alt = '', 
  rounded = 'rounded-2xl',
  onImageClick, 
  showZoomIcon = false,
  isZoomed = false,
  objectFit = 'object-cover',
  autoPlay = true // ✨ NEW: Prop to control auto-play
}) => {
  const [index, setIndex] = useState(0);
  const hasImages = images.length > 0;

  useEffect(() => {
    // ✨ FIX: Only run timer if autoPlay is true and there are multiple images
    if (images.length <= 1 || !autoPlay) return; 
    
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000); 

    return () => clearInterval(timer); 
  }, [images.length, autoPlay]);

  const nextImage = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  };

  const prevImage = (e) => {
    e.preventDefault(); e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  };

  return (
    <div className={`relative w-full h-full bg-slate-100 ${rounded} overflow-hidden select-none group`}>
      {hasImages ? (
        <button
          type="button"
          onClick={(e) => {
            if (onImageClick) {
              e.preventDefault();
              e.stopPropagation();
              onImageClick();
            }
          }}
          className={`w-full h-full block flex items-center justify-center ${onImageClick ? 'cursor-zoom-in' : 'cursor-pointer'}`}
        >
          <img 
            src={images[index]} 
            alt={alt} 
            className={`w-full h-full ${objectFit}`} 
            draggable={false} 
          />
          
          {showZoomIcon && (
            <span className="absolute bottom-6 right-1.5 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors z-20 shadow-sm">
              {isZoomed ? <ZoomOut size={14} /> : <ZoomIn size={14} />}
            </span>
          )}
        </button>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Package size={40} className="text-slate-300" />
        </div>
      )}

      {/* Manual Arrows for Detail View */}
      {images.length > 1 && !autoPlay && (
        <>
          <button 
            onClick={prevImage} 
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 hover:bg-black/70 z-20"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextImage} 
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full p-1 hover:bg-black/70 z-20"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;