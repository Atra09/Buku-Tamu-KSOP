import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Flash from '../components/flash/flash';

const ToastContext = createContext(null);

/**
 * Toast Provider Terpusat untuk Seluruh Aplikasi
 * Mengeliminasi duplikasi deklarasi state `toast` dan komponen `<Flash />` di 9 halaman berbeda.
 */
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const closeToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    if (!message) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setToast({ message, type });

    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, closeToast, toast }}>
      {children}
      {/* Flash Toast Global: Melayang di atas seluruh halaman tanpa menggeser layout */}
      <Flash toast={toast} onClose={closeToast} />
    </ToastContext.Provider>
  );
};

/**
 * Custom Hook untuk memanggil notifikasi toast dari mana saja
 * @example
 * const { showToast } = useToast();
 * showToast('Data berhasil disimpan!', 'success');
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Fail-safe jika hook dipanggil di luar ToastProvider
    return {
      showToast: (msg) => console.log('[Toast Notice]:', msg),
      closeToast: () => {},
      toast: null
    };
  }
  return context;
};

export default ToastContext;
