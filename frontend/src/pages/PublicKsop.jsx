import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Header from '../components/Header';
import VisitorBadgeModal from '../components/VisitorBadgeModal';
import NotifPopup from '../components/flash/NotifPopup';
import RegFlash from '../components/regflash';
import GuestRegistrationForm from '../components/tamu/GuestRegistrationForm';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useQrTicket } from '../hooks/useQrTicket';

const INITIAL_FORM_STATE = {
  nama: '',
  no_telpon: '',
  kategori_asal: '',
  asal_instansi: '',
  jenis_kelamin: 'Laki-laki',
  alamat: '',
  lokasi: '',
  bertemu: '',
  keperluan: ''
};

/**
 * PublicKsop (Halaman Pendaftaran Buku Tamu Digital KSOP)
 * Mengorkestrasi manajemen sesi tiket QR, pengambilan dropdown master,
 * validasi form, pengiriman data tamu, dan modal notifikasi.
 */
const PublicKsop = () => {
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [fotoBase64, setFotoBase64] = useState(null);

  // Master dropdown data
  const [tujuanList, setTujuanList] = useState([]);
  const [tujuanObjects, setTujuanObjects] = useState([]);
  const [keperluanList, setKeperluanList] = useState([]);
  const [kategoriAsalList, setKategoriAsalList] = useState([]);
  const [kategoriAsalObjects, setKategoriAsalObjects] = useState([]);

  const [loading, setLoading] = useState(false);
  const [registeredGuest, setRegisteredGuest] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  // Dedicated WA Bot Disconnected Error Pop-up State
  const [botPopup, setBotPopup] = useState({ isOpen: false, message: '' });

  const latestLocationRef = useRef('');

  const { user } = useAuth();
  const { showToast } = useToast();

  // QR Ticket Lifecycle Hook
  const {
    qrToken,
    isGuestContext,
    qrStatus,
    regPopup,
    setRegPopup,
    handleTimerExpire,
    markTokenSubmitted
  } = useQrTicket();

  useEffect(() => {
    fetchDropdowns();
    const loginFlash = sessionStorage.getItem('sitamu_login_flash');
    if (loginFlash) {
      showToast(loginFlash, 'success');
      sessionStorage.removeItem('sitamu_login_flash');
    }
  }, [showToast]);

  const fetchDropdowns = async () => {
    try {
      const res = await axios.get('/api/master/dropdowns');
      if (res.data && res.data.data) {
        const fetchedTujuan = res.data.data.tujuan || [];
        const fetchedTujuanObjects = res.data.data.tujuanList || [];
        const fetchedKeperluan = res.data.data.keperluan || [];
        const fetchedKategori = res.data.data.kategoriAsal || [];
        const fetchedKategoriObjects = res.data.data.kategoriAsalList || [];

        setTujuanList(fetchedTujuan);
        setTujuanObjects(fetchedTujuanObjects);
        setKeperluanList(fetchedKeperluan);
        setKategoriAsalList(fetchedKategori);
        setKategoriAsalObjects(fetchedKategoriObjects);

        setFormData(prev => ({
          ...prev,
          bertemu: fetchedTujuan.length > 0 ? fetchedTujuan[0] : prev.bertemu,
          kategori_asal: fetchedKategori.length > 0 ? fetchedKategori[0] : prev.kategori_asal
        }));
      }
    } catch (err) {
      console.error('Error fetching dropdowns:', err);
      // Fallback data
      setTujuanList([
        'Kepala Kantor',
        'Seksi Keselamatan Berlayar',
        'Seksi Status Hukum dan Sertifikasi',
        'Sub Bagian Tata Usaha'
      ]);
      setKeperluanList([
        'Konsultasi Perizinan / Dokumen',
        'Pengurusan Surat Clearance',
        'Permohonan Sertifikat',
        'Penyerahan Surat / Berkas'
      ]);
      setFormData(prev => ({
        ...prev,
        bertemu: 'Kepala Kantor',
        keperluan: 'Konsultasi Perizinan / Dokumen'
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'no_telpon') {
      let cleaned = value.replace(/[^0-9+]/g, '');
      if (cleaned.includes('+')) {
        cleaned = '+' + cleaned.replace(/\+/g, '');
      }
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const checkIsOnlyAddress = useCallback((kategoriName) => {
    const selectedCatObj = kategoriAsalObjects.find(k => k.nama_kategori === kategoriName);
    if (selectedCatObj) {
      const val = selectedCatObj.butuh_instansi;
      if (val === false || val === 0 || val === 'false' || val === '0') return true;
      if (val === true || val === 1 || val === 'true' || val === '1') return false;
    }
    return Boolean(kategoriName && kategoriName.toLowerCase().includes('masyarakat'));
  }, [kategoriAsalObjects]);

  const sanitizeText = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/\0/g, '').replace(/[<>]/g, '').trim();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isOnlyAddress = checkIsOnlyAddress(formData.kategori_asal);

    const cleanNama = sanitizeText(formData.nama);
    const cleanAlamat = sanitizeText(formData.alamat);
    const cleanAsalInstansi = sanitizeText(formData.asal_instansi);
    const cleanKeperluan = sanitizeText(formData.keperluan);
    const cleanNoTelpon = formData.no_telpon.trim();

    if (!cleanNama) {
      showToast('Mohon isi Nama Tamu!', 'error');
      return;
    }

    if (isOnlyAddress && !cleanAlamat) {
      showToast('Mohon isi Alamat Lengkap / Domisili Tamu!', 'error');
      return;
    }

    if (!isOnlyAddress && !cleanAsalInstansi) {
      showToast('Mohon isi Nama Asal Instansi / Perusahaan!', 'error');
      return;
    }

    if (!cleanKeperluan) {
      showToast('Mohon isi Keperluan / Catatan Kunjungan!', 'error');
      return;
    }

    if (!fotoBase64) {
      showToast('Wajib mengambil atau mengunggah foto tamu terlebih dahulu!', 'error');
      return;
    }

    setLoading(true);
    try {
      const isInvalid = (val) => !val || !val.trim() ||
        val === 'Lokasi Tidak Terdeteksi' ||
        val === 'Mendeteksi Lokasi...' ||
        val.startsWith('Perangkat tidak mendukung') ||
        val.startsWith('Gagal mendeteksi') ||
        val.startsWith('Akses Lokasi Ditolak') ||
        val.startsWith('Waktu Deteksi');

      let validLokasi = formData.lokasi;
      if (isInvalid(validLokasi)) {
        validLokasi = latestLocationRef.current;
      }

      // Validasi Area Lokasi Kantor KSOP Kalianget (Wajib Terdeteksi GPS Asli untuk Semua: Tamu maupun Petugas)
      if (isInvalid(validLokasi)) {
        showToast('Lokasi belum terdeteksi. Pastikan GPS aktif dan berikan izin lokasi pada browser Anda.', 'error');
        setLoading(false);
        return;
      }

      // Ambil hanya teks nama lokasi (di dalam tanda kurung / abaikan angka koordinat) untuk validasi wilayah
      const addressMatch = validLokasi.match(/\((.*?)\)/);
      const addressOnly = (addressMatch && addressMatch[1])
        ? addressMatch[1].trim()
        : validLokasi.replace(/^[-+]?\d*\.?\d+\s*,\s*[-+]?\d*\.?\d+\s*/, '').trim();

      if (!addressOnly || !addressOnly.toLowerCase().includes('kalianget')) {
        showToast('Pendaftaran ditolak: Anda terdeteksi berada di luar area kantor KSOP (Jalan Raya Kalianget, Desa Kalianget Timur, Kab. Sumenep).', 'error');
        setLoading(false);
        return;
      }

      const finalAsalInstansi = isOnlyAddress
        ? (formData.kategori_asal || 'Masyarakat Umum')
        : cleanAsalInstansi;

      const payload = {
        ...formData,
        nama: cleanNama,
        no_telpon: cleanNoTelpon,
        alamat: cleanAlamat,
        asal_instansi: finalAsalInstansi,
        keperluan: cleanKeperluan,
        lokasi: validLokasi,
        foto_base64: fotoBase64,
        qr_token: qrStatus.valid ? qrToken : undefined
      };

      const headers = {};
      if (qrStatus.valid && qrToken) {
        headers['x-qr-token'] = qrToken;
      }

      const res = await axios.post('/api/tamu', payload, { headers });
      if (res.data && res.data.success) {
        const guestData = res.data.data;

        // Cari data master tujuan terpilih untuk mengambil nama pejabat dan no_hp WA
        const matchedTujuan = tujuanObjects.find(t => t.nama_tujuan === guestData.bertemu);
        const guestWithTargetInfo = {
          ...guestData,
          nama_pejabat: matchedTujuan?.nama_pejabat || null,
          no_hp: matchedTujuan?.no_hp || null
        };

        setRegisteredGuest(guestWithTargetInfo);
        setShowBadgeModal(true);

        const targetPejabatLabel = guestData.bertemu || 'Tujuan Kunjungan';
        showToast(`Kunjungan Anda telah disampaikan kepada ${targetPejabatLabel}`, 'success');

        // Catat log cetak kartu tamu
        axios.post('/api/logs', {
          action: 'CETAK_KARTU_TAMU',
          details: `Mencetak Kartu Kunjungan Tamu: ${guestData.nama} (${guestData.no_reg})`
        }, { headers }).catch(logErr => console.error('Error logging CETAK_KARTU_TAMU:', logErr));

        // Reset Formulir & Foto
        setFormData({
          ...INITIAL_FORM_STATE,
          kategori_asal: kategoriAsalList.length > 0 ? kategoriAsalList[0] : '',
          lokasi: latestLocationRef.current || '',
          bertemu: tujuanList.length > 0 ? tujuanList[0] : '',
          keperluan: keperluanList.length > 0 ? keperluanList[0] : ''
        });
        setFotoBase64(null);

        // Jika pendaftaran via QR, tandai tiket selesai digunakan pada perangkat ini
        if (isGuestContext || qrToken) {
          markTokenSubmitted(qrToken, guestData.no_reg);
        }
      }
    } catch (err) {
      console.error('Error registering guest:', err);
      const errData = err.response?.data;
      if (errData?.botNotConnected || (errData?.message && errData.message.toLowerCase().includes('bot belum terhubung'))) {
        setBotPopup({
          isOpen: true,
          message: errData.message || 'bot belum terhubung, silahkan hubungi admin !!'
        });
      } else if (errData?.code === 'LOCATION_OUTSIDE_KSOP') {
        showToast(errData.message || 'Pendaftaran ditolak: Anda terdeteksi berada di luar area kantor KSOP.', 'error');
      } else if (errData?.code === 'QR_TOKEN_EXPIRED' || errData?.code === 'QR_TOKEN_NOT_ACTIVE' || errData?.code === 'INVALID_QR_TOKEN') {
        setRegPopup({
          isOpen: true,
          type: 'error',
          title: 'Sesi Tiket Barcode Telah Berakhir',
          message: errData.message || 'Masa berlaku tiket barcode telah habis.',
          subMessage: 'Silakan minta barcode terbaru kepada petugas!'
        });
      } else {
        showToast('Gagal menyimpan registrasi tamu: ' + (errData?.message || err.message), 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-12">
      <Header
        companyName="KSOP Si-Tamu"
        guestMode={isGuestContext}
        expiresAt={qrStatus.expiresAt}
        onTimerExpire={() => handleTimerExpire(Boolean(registeredGuest))}
      />

      <main className="w-full px-4 md:px-8 xl:px-12 mt-4 flex-1">
        <GuestRegistrationForm
          formData={formData}
          handleChange={handleChange}
          kategoriAsalList={kategoriAsalList}
          tujuanList={tujuanList}
          checkIsOnlyAddress={checkIsOnlyAddress}
          fotoBase64={fotoBase64}
          setFotoBase64={setFotoBase64}
          latestLocationRef={latestLocationRef}
          setFormData={setFormData}
          loading={loading}
          qrStatus={qrStatus}
          isGuestContext={isGuestContext}
          onSubmit={handleSubmit}
        />
      </main>

      {/* Dedicated WA Bot Disconnected Pop-up Modal */}
      <NotifPopup
        isOpen={botPopup.isOpen}
        message={botPopup.message}
        onClose={() => setBotPopup({ isOpen: false, message: '' })}
      />

      {/* RegFlash Modal Pop-up (Panduan Durasi 10 Menit & Status Tiket) */}
      <RegFlash
        isOpen={regPopup.isOpen}
        onClose={() => setRegPopup(prev => ({ ...prev, isOpen: false }))}
        type={regPopup.type}
        title={regPopup.title}
        message={regPopup.message}
        subMessage={regPopup.subMessage}
        isClosable={regPopup.type === 'info'}
      />

      {/* Visitor Badge Modal */}
      {showBadgeModal && (
        <VisitorBadgeModal
          guest={registeredGuest}
          onClose={() => {
            setShowBadgeModal(false);
            if (isGuestContext || qrStatus.submitted) {
              setRegPopup({
                isOpen: true,
                type: 'success',
                title: 'Pendaftaran Berhasil Disimpan',
                message: 'Tiket barcode telah digunakan pada perangkat ini. Registrasi Anda telah tercatat!',
                subMessage: 'Perangkat ini sudah menyelesaikan pendaftaran. Terima kasih atas kerja sama Anda.'
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default PublicKsop;
