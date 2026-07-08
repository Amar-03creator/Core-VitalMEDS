// src/components/ImageZoomModal.jsx
import { useState } from 'react';
import { X } from 'lucide-react';

const ImageZoomModal = ({ src, alt, onClose }) => {
  const [zoomed, setZoomed] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 text-white p-2 z-10" aria-label="Close">
        <X size={26} />
      </button>
      <div
        className="w-full h-full overflow-auto flex items-center justify-center p-4"
        onClick={() => setZoomed((z) => !z)}
      >
        <img
          src={src}
          alt={alt}
          className={`transition-transform duration-200 max-w-full ${zoomed ? 'scale-[2] cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}
        />
      </div>
    </div>
  );
};

export default ImageZoomModal;