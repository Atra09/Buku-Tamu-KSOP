import { useState } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

/**
 * Custom Hook: useGuestStatus
 * Menghilangkan duplikasi logika & state modal konfirmasi toggle status tamu
 * antara DashboardAdmin.jsx dan DaftarKunjungan.jsx (DRY Principle).
 */
export const useGuestStatus = (onStatusChanged) => {
  const [statusConfirmTarget, setStatusConfirmTarget] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const { showToast } = useToast();

  const openStatusConfirm = (id, currentStatus, guestName = '') => {
    setStatusConfirmTarget({ id, currentStatus, guestName });
  };

  const closeStatusConfirm = () => {
    setStatusConfirmTarget(null);
  };

  const executeStatusToggle = async () => {
    if (!statusConfirmTarget) return;

    const { id, currentStatus } = statusConfirmTarget;
    const nextStatus = currentStatus === 'Berkunjung' ? 'Selesai' : 'Berkunjung';

    setStatusUpdating(true);
    try {
      await axios.patch(`/api/tamu/${id}/status`, { status: nextStatus });
      showToast(`Status tamu diperbarui menjadi "${nextStatus}"`, 'success');
      setStatusConfirmTarget(null);
      if (typeof onStatusChanged === 'function') {
        onStatusChanged(id, nextStatus);
      }
    } catch (err) {
      console.error('Gagal memperbarui status tamu:', err);
      showToast(err.response?.data?.message || 'Gagal memperbarui status tamu', 'error');
    } finally {
      setStatusUpdating(false);
    }
  };

  return {
    statusConfirmTarget,
    statusUpdating,
    openStatusConfirm,
    closeStatusConfirm,
    executeStatusToggle
  };
};

export default useGuestStatus;
