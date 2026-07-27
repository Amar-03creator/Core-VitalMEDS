// modals/AddProductModal/ImageUploadField.jsx
import { useState, useRef, useCallback } from 'react';
// ✨ IMPORT ChevronLeft and ChevronRight
import { UploadCloud, X, ImageIcon, Check, Edit2, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react'; 
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { getCroppedImg } from './cropImageHelper';

export const ImageUploadField = ({ formData, setFormData, toast }) => {
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null); 
  
  const images = formData.images || [];

  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); 

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Please select an image smaller than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => setImageSrc(reader.result));
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (replaceInputRef.current) replaceInputRef.current.value = '';
  };

  const handleEditClick = (idx) => {
    setEditingIndex(idx);
    const img = images[idx];
    setImageSrc(img.isPending ? img.previewUrl : (img.secure_url || img.url));
    setZoom(1);
    setRotation(0);
  };

  // ✨ NEW: Function to shift images left or right
  const moveImage = (index, direction) => {
    setFormData((prev) => {
      const newImages = [...(prev.images || [])];
      if (direction === 'left' && index > 0) {
        // Swap with the image to the left
        [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      } else if (direction === 'right' && index < newImages.length - 1) {
        // Swap with the image to the right
        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      }
      return { ...prev, images: newImages };
    });
  };

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsProcessing(true);

    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      const compressedFile = await imageCompression(croppedImageBlob, {
        maxSizeMB: 0.2, maxWidthOrHeight: 1200, useWebWorker: true,
      });

      const previewUrl = URL.createObjectURL(compressedFile);

      setFormData((prev) => {
        const newImages = [...(prev.images || [])];

        if (editingIndex !== null) {
          if (newImages[editingIndex].isPending) {
            URL.revokeObjectURL(newImages[editingIndex].previewUrl); 
          }
          newImages[editingIndex] = { isPending: true, file: compressedFile, previewUrl: previewUrl };
        } else {
          newImages.push({ isPending: true, file: compressedFile, previewUrl: previewUrl });
        }

        return { ...prev, images: newImages };
      });

      setImageSrc(null);
      setEditingIndex(null);
      setZoom(1);
      setRotation(0);
    } catch (error) {
      console.error(error);
      toast.error('Failed to crop image');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData((prev) => {
      const imgToRemove = prev.images[indexToRemove];
      if (imgToRemove.isPending) URL.revokeObjectURL(imgToRemove.previewUrl);
      return {
        ...prev,
        images: prev.images.filter((_, idx) => idx !== indexToRemove),
      };
    });
  };

  const closeCropper = () => {
    setImageSrc(null);
    setEditingIndex(null);
  };

  return (
    <div className="space-y-2 mt-4">
      <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
        <ImageIcon size={16} /> Product Images
      </label>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative w-24 h-24 shrink-0 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm group">
            <img 
              src={img.isPending ? img.previewUrl : (img.secure_url || img.url)} 
              alt="Product" 
              className="w-full h-full object-contain bg-white" 
            />
            
            {/* ✨ NEW: Primary Badge for the 1st Image */}
            {idx === 0 && (
              <span className="absolute top-0 left-0 right-0 bg-emerald-500 text-white text-[9px] font-bold text-center py-0.5 tracking-widest uppercase pointer-events-none z-10 shadow-sm">
                Primary
              </span>
            )}

            {/* Pending Badge */}
            {img.isPending && (
               <span className={`absolute left-0 right-0 bg-amber-500/90 text-white text-[9px] font-bold text-center py-0.5 tracking-wider uppercase pointer-events-none z-10 ${idx === 0 ? 'bottom-0' : 'bottom-0'}`}>
                 Pending
               </span>
            )}

            {/* Shift Left Button */}
            {idx > 0 && (
              <button
                type="button"
                onClick={() => moveImage(idx, 'left')}
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/80 z-20"
                title="Move Left"
              >
                <ChevronLeft size={14} />
              </button>
            )}

            {/* Shift Right Button */}
            {idx < images.length - 1 && (
              <button
                type="button"
                onClick={() => moveImage(idx, 'right')}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-black/80 z-20"
                title="Move Right"
              >
                <ChevronRight size={14} />
              </button>
            )}

            {/* Edit Button (Top Left) */}
            <button
              type="button"
              onClick={() => handleEditClick(idx)}
              className="absolute top-1 left-1 bg-blue-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-md hover:bg-blue-600 z-20"
            >
              <Edit2 size={12} />
            </button>

            {/* Remove Button (Top Right) */}
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-20"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => {
            setEditingIndex(null); 
            fileInputRef.current?.click();
          }}
          className="w-24 h-24 shrink-0 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:border-slate-400 transition-all"
        >
          <UploadCloud size={20} />
          <span className="text-sm font-bold">Add Image</span>
        </button>
        
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
        <input type="file" accept="image/*" className="hidden" ref={replaceInputRef} onChange={handleFileChange} />
      </div>

      {/* CROPPER OVERLAY */}
      {imageSrc && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center">
          <div className="relative w-full h-[60vh] max-w-2xl bg-black">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="w-full max-w-2xl bg-white p-5 rounded-t-3xl sm:rounded-b-3xl mt-2 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-500 uppercase">Zoom</label>
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-500 uppercase">Rotation</label>
              <input type="range" value={rotation} min={0} max={360} step={1} onChange={(e) => setRotation(Number(e.target.value))} className="w-full accent-emerald-500" />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                type="button" 
                onClick={closeCropper} 
                className="bg-slate-100 text-slate-700 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              
              <button 
                type="button" 
                onClick={handleCropSave} 
                disabled={isProcessing}
                className="bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : <><Check size={18} /> {editingIndex !== null ? 'Update Image' : 'Save Image'}</>}
              </button>

              {editingIndex !== null && (
                <button 
                  type="button" 
                  onClick={() => replaceInputRef.current?.click()} 
                  className="col-span-2 bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold py-2.5 rounded-xl hover:bg-indigo-100 transition-colors flex justify-center items-center gap-2"
                >
                  <RefreshCcw size={16} /> Select Different Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};