import React from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Photo Preview Modal Component
 * Displays full-resolution guest face or ID card photo
 *
 * @param {string} photo - Photo URL or Base64 data string (null if closed)
 * @param {function} onClose - Callback to close modal
 * @param {string} title - Optional title / alt description
 */
const TamuFoto = ({ photo, onClose, title = 'Preview Foto Tamu' }) => {
  if (!photo) return null;

  return (
    <div className="fixed -top-10 -bottom-10 -left-10 -right-10 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="relative max-w-2xl w-full bg-white rounded-2xl p-2 shadow-2xl">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 z-10 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-900 transition-colors cursor-pointer"
          title="Tutup Preview Foto"
          aria-label="Tutup Preview Foto"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={photo}
          alt={title}
          className="w-full h-auto max-h-[80vh] rounded-xl object-contain"
        />
      </div>
    </div>
  );
};

export default TamuFoto;
export { TamuFoto };
