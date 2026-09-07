import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

/**
 * Flash Notification / Toast Component
 * @param {Object} props
 * @param {Object} props.toast - Objek berisi { message: string, type: 'success' | 'error' }
 * @param {Function} props.onClose - Handler saat notifikasi ditutup
 */
const Flash = ({ toast, onClose }) => {
    if (!toast || !toast.message) return null;

    const isSuccess = toast.type === 'success';

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-bounceIn shadow-2xl transition-all select-none max-w-[90vw]">
            <div
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border bg-white shadow-xl ${isSuccess
                    ? 'text-emerald-700 border-emerald-300 shadow-emerald-900/10'
                    : 'text-rose-700 border-rose-300 shadow-rose-900/10'
                    }`}
            >
                {isSuccess ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
                <span className="text-[13px] font-extrabold text-slate-800 tracking-tight">{toast.message}</span>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="ml-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        aria-label="Tutup Notifikasi"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Flash;
