import { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { api } from '../../services/api'; 
import imageCompression from 'browser-image-compression'; // ✨ NAYA IMPORT

export const ImageUploadField = ({ formData, setFormData, toast }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const images = formData.images || [];

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Allow files up to 10MB to be selected
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Please select an image smaller than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      // ✨ 1. MAGIC STEP: COMPRESS IMAGE IN BROWSER BEFORE UPLOAD
      const options = {
        maxSizeMB: 0.2,          // Target size: 0.2 MB (200 KB)
        maxWidthOrHeight: 1200,  // Standard HD resolution maintain karega
        useWebWorker: true,      // Browser ko hang hone se bachayega
      };
      
      const compressedFile = await imageCompression(file, options);
      console.log(`Original: ${(file.size / 1024 / 1024).toFixed(2)} MB, Compressed: ${(compressedFile.size / 1024).toFixed(2)} KB`);

      // 2. Backend se Secure Signature laao
      const sigData = await api.getUploadSignature();

      // 3. Cloudinary ke liye FormData banao (Original file ki jagah 'compressedFile' use karenge)
      const uploadData = new FormData();
      uploadData.append('file', compressedFile); // ✨ Compressed file jayegi
      uploadData.append('api_key', sigData.apiKey);
      uploadData.append('timestamp', sigData.timestamp);
      uploadData.append('signature', sigData.signature);
      uploadData.append('folder', 'vitalmeds_products'); 

      // 4. Seedha Cloudinary par POST request
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
        { method: 'POST', body: uploadData }
      );

      const cloudinaryData = await uploadRes.json();

      if (!uploadRes.ok) throw new Error(cloudinaryData.error?.message || 'Upload failed');

      // 5. Form state mein URL aur Public ID save karo
      const newImage = {
        url: cloudinaryData.secure_url,
        publicId: cloudinaryData.public_id,
      };

      setFormData((prev) => ({
        ...prev,
        images: [...(prev.images || []), newImage],
      }));

      toast.success('Image optimized and uploaded successfully!');
    } catch (error) {
      console.error('Upload Error:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
        <ImageIcon size={16} /> Product Images
      </label>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {images.map((img, idx) => (
          <div key={idx} className="relative w-24 h-24 shrink-0 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-sm group">
            <img src={img.url} alt="Product" className="w-full h-full object-contain" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-24 h-24 shrink-0 flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 hover:border-slate-400 transition-all disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={20} className="animate-spin text-emerald-500" /> : <UploadCloud size={20} />}
          <span className="text-xs font-bold">{isUploading ? 'Uploading...' : 'Add Image'}</span>
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};