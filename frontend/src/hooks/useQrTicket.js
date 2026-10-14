import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  setQrGuestSession,
  clearQrGuestSession,
  isQrGuestSession,
  getStoredQrToken,
  getStoredQrExpiresAt
} from '../utils/session';

/**
 * Custom Hook useQrTicket
 * Mengisolasi seluruh siklus hidup tiket pendaftaran barcode tamu:
 * - Pembacaan parameter URL token
 * - Pemeriksaan pembatalan akses lokal (blacklist / eviction)
 * - Pemeriksaan status pendaftaran perangkat (1x submit)
 * - Verifikasi ke backend (/api/qr/verify)
 * - Pengawasan masa aktif tiket (10 menit) & penanganan kedaluwarsa
 */
export const useQrTicket = () => {
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('reg') || searchParams.get('token') || searchParams.get('qr_token');
  const [qrToken, setQrToken] = useState(urlToken || getStoredQrToken());

  const isGuestContext = Boolean(urlToken || isQrGuestSession());

  const [qrStatus, setQrStatus] = useState({
    checked: !urlToken && !getStoredQrToken(),
    valid: false,
    submitted: false,
    error: null,
    guestMode: null,
    expiresAt: getStoredQrExpiresAt()
  });

  const [regPopup, setRegPopup] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    subMessage: ''
  });

  const verifyToken = useCallback(async (tokenToVerify) => {
    if (!tokenToVerify) return;

    try {
      // 1. Cek apakah tiket pada perangkat ini telah dibatalkan karena pelanggaran rute administrasi
      const localRevoked = localStorage.getItem('ksop_revoked_' + tokenToVerify);
      if (localRevoked) {
        clearQrGuestSession();
        setQrStatus({
          checked: true,
          valid: false,
          submitted: false,
          error: 'Akses Dibatalkan',
          guestMode: null,
          expiresAt: null
        });
        setRegPopup({
          isOpen: true,
          type: 'error',
          title: 'Sesi Tiket Barcode Dibatalkan',
          message: 'Hak akses pendaftaran pada perangkat ini telah dibatalkan karena terdeteksi mencoba mengakses rute administrasi sistem tanpa izin.',
          subMessage: 'Silakan minta barcode baru kepada petugas jaga di meja pos pelayanan KSOP jika ingin melakukan registrasi resmi.'
        });
        return;
      }

      // 2. Cek apakah perangkat ini sudah pernah menyelesaikan registrasi untuk token ini
      const localSubmitted = localStorage.getItem('ksop_submitted_' + tokenToVerify);
      if (localSubmitted) {
        setQrStatus({
          checked: true,
          valid: false,
          submitted: true,
          error: null,
          guestMode: null,
          expiresAt: null
        });
        setRegPopup({
          isOpen: true,
          type: 'success',
          title: 'Pendaftaran Berhasil Disimpan',
          message: 'Tiket barcode telah digunakan pada perangkat ini. Registrasi Anda telah tercatat.',
          subMessage: 'Perangkat ini sudah menyelesaikan pendaftaran. Terima kasih atas kerja sama Anda.'
        });
        return;
      }

      const res = await axios.get('/api/qr/verify', { params: { token: tokenToVerify } });
      if (!res.data || !res.data.valid) {
        throw new Error(res.data?.message || 'Tiket barcode pendaftaran tidak valid atau telah kedaluwarsa.');
      }

      setQrStatus({
        checked: true,
        valid: true,
        submitted: false,
        error: null,
        guestMode: res.data.guest_mode,
        expiresAt: res.data.expires_at
      });

      setQrGuestSession(tokenToVerify, res.data.guest_mode, res.data.expires_at);

      // Tampilkan pop-up petunjuk waktu 10 menit saat awal pembukaan formulir
      setRegPopup({
        isOpen: true,
        type: 'info',
        title: 'Panduan Waktu Registrasi',
        message: 'Silahkan Lakukan registrasi dengan durasi waktu Maksimal 10 menit',
        subMessage: 'Pastikan seluruh formulir dan foto tamu telah dilengkapi sebelum batas waktu tiket berakhir.'
      });
    } catch (err) {
      clearQrGuestSession();
      const errMessage =
        err.response?.data?.message ||
        err.message ||
        'Tiket barcode pendaftaran telah kedaluwarsa (10 menit) atau sudah pernah digunakan (1x pakai).';

      setQrStatus({
        checked: true,
        valid: false,
        submitted: false,
        error: errMessage,
        guestMode: null,
        expiresAt: null
      });

      setRegPopup({
        isOpen: true,
        type: 'error',
        title: 'Tiket Barcode Tidak Berlaku / Sesi Berakhir',
        message: errMessage,
        subMessage: 'Silakan minta barcode baru kepada petugas!'
      });
    }
  }, []);

  useEffect(() => {
    if (qrToken) {
      verifyToken(qrToken);
    }
  }, [qrToken, verifyToken]);

  const handleTimerExpire = useCallback((isAlreadySubmitted = false) => {
    if (!isAlreadySubmitted && !qrStatus.submitted) {
      setQrStatus(prev => ({
        ...prev,
        valid: false,
        error: 'Masa berlaku tiket barcode telah habis (kedaluwarsa 10 menit).'
      }));
      setRegPopup({
        isOpen: true,
        type: 'error',
        title: 'Tiket Barcode Kedaluwarsa',
        message: 'Batas waktu pendaftaran 10 menit untuk tiket barcode ini telah berakhir.',
        subMessage: 'Silakan minta barcode baru kepada petugas jaga di meja pos pelayanan KSOP jika ingin melakukan registrasi.'
      });
    }
  }, [qrStatus.submitted]);

  const markTokenSubmitted = useCallback((token, noReg) => {
    if (token) {
      try {
        localStorage.setItem(
          'ksop_submitted_' + token,
          JSON.stringify({
            no_reg: noReg || '',
            time: Date.now()
          })
        );
      } catch (e) {
        console.warn('Gagal menyimpan status submit ke localStorage:', e);
      }
    }
    sessionStorage.setItem('sitamu_session_type', 'QR_GUEST');
    sessionStorage.removeItem('sitamu_qr_token');
    setQrStatus(prev => ({
      ...prev,
      checked: true,
      valid: false,
      submitted: true,
      error: null,
      guestMode: null
    }));
  }, []);

  return {
    qrToken,
    isGuestContext,
    qrStatus,
    setQrStatus,
    regPopup,
    setRegPopup,
    verifyToken,
    handleTimerExpire,
    markTokenSubmitted
  };
};

export default useQrTicket;
