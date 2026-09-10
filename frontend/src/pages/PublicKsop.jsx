import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UserCheck, Camera, Send, FileText, CheckCircle2, ShieldCheck, User, Building, Phone, MapPin, Tag, AlertCircle, X } from 'lucide-react';
import Header from '../components/Header';
import WebcamCapture from '../components/WebcamCapture';
import VisitorBadgeModal from '../components/VisitorBadgeModal';
import Flash from '../components/flash/flash';

const PublicKsop = () => {
  const [formData, setFormData] = useState({
    nama: '',
    no_telpon: '',
    kategori_asal: '',
    asal_instansi: '',
    jenis_kelamin: 'Laki-laki',
    alamat: '',
    lokasi: '',
    bertemu: '',
    keperluan: ''
  });

  const [fotoBase64, setFotoBase64] = useState(null);
  const [tujuanList, setTujuanList] = useState([]);
  const [tujuanObjects, setTujuanObjects] = useState([]);
  const [keperluanList, setKeperluanList] = useState([]);
  const [kategoriAsalList, setKategoriAsalList] = useState([]);
  const [kategoriAsalObjects, setKategoriAsalObjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registeredGuest, setRegisteredGuest] = useState(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  const latestLocationRef = useRef('');

  // Toast Notification State
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  useEffect(() => {
    fetchDropdowns();
    const loginFlash = sessionStorage.getItem('sitamu_login_flash');
    if (loginFlash) {
      showToast(loginFlash, 'success');
      sessionStorage.removeItem('sitamu_login_flash');
    }
  }, []);

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
      // Fallbacks
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
      // Hapus semua karakter yang bukan angka (0-9) dan tanda '+'
      let cleaned = value.replace(/[^0-9+]/g, '');
      // Pastikan tanda '+' hanya bisa ada di karakter pertama (misal +62)
      if (cleaned.includes('+')) {
        cleaned = '+' + cleaned.replace(/\+/g, '');
      }
      setFormData(prev => ({ ...prev, [name]: cleaned }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const checkIsOnlyAddress = (kategoriName) => {
    const selectedCatObj = kategoriAsalObjects.find(k => k.nama_kategori === kategoriName);
    if (selectedCatObj) {
      const val = selectedCatObj.butuh_instansi;
      if (val === false || val === 0 || val === 'false' || val === '0') return true;
      if (val === true || val === 1 || val === 'true' || val === '1') return false;
    }
    return kategoriName && kategoriName.toLowerCase().includes('masyarakat');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isOnlyAddress = checkIsOnlyAddress(formData.kategori_asal);

    if (!formData.nama.trim()) {
      showToast('Mohon isi Nama Tamu!', 'error');
      return;
    }

    if (isOnlyAddress && !formData.alamat.trim()) {
      showToast('Mohon isi Alamat Lengkap / Domisili Tamu!', 'error');
      return;
    }

    if (!isOnlyAddress && !formData.asal_instansi.trim()) {
      showToast('Mohon isi Nama Asal Instansi / Perusahaan!', 'error');
      return;
    }

    if (!fotoBase64) {
      showToast('Wajib mengambil atau mengunggah foto tamu terlebih dahulu!', 'error');
      return;
    }

    setLoading(true);
    try {
      const isInvalid = (val) => !val || !val.trim() || val === 'Lokasi Tidak Terdeteksi' || val === 'Mendeteksi Lokasi...';

      let validLokasi = formData.lokasi;
      if (isInvalid(validLokasi)) {
        validLokasi = latestLocationRef.current;
      }
      if (isInvalid(validLokasi)) {
        validLokasi = 'Desa Gapura, Kec. Kota Sumenep, Kab. Sumenep';
      }

      const finalAsalInstansi = isOnlyAddress
        ? (formData.kategori_asal || 'Masyarakat Umum')
        : formData.asal_instansi.trim();

      const payload = {
        ...formData,
        asal_instansi: finalAsalInstansi,
        lokasi: validLokasi,
        foto_base64: fotoBase64
      };

      const userStr = localStorage.getItem('sitamu_user');
      const userObj = userStr ? JSON.parse(userStr) : null;
      const headers = {};
      if (userObj && userObj.nama) {
        headers['x-user-nama'] = encodeURIComponent(userObj.nama);
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

        // Secara otomatis membuka WhatsApp Web dengan notifikasi formal jika nomor HP tujuan terdaftar
        if (matchedTujuan && matchedTujuan.no_hp) {
          let cleanNumber = matchedTujuan.no_hp.replace(/[^0-9]/g, '');
          if (cleanNumber.startsWith('0')) {
            cleanNumber = '62' + cleanNumber.substring(1);
          }

          const namaTujuanStr = guestData.bertemu || 'Pejabat / Staf Tujuan';
          const namaPejabatStr = matchedTujuan.nama_pejabat ? `Bpk/Ibu ${matchedTujuan.nama_pejabat}` : `Bpk/Ibu ${namaTujuanStr}`;

          const asalStr = (guestData.asal_instansi && guestData.kategori_asal && guestData.asal_instansi.trim().toLowerCase() !== guestData.kategori_asal.trim().toLowerCase())
            ? `${guestData.asal_instansi} (${guestData.kategori_asal})`
            : (guestData.asal_instansi || guestData.kategori_asal || '-');

          let lokasiFormatted = guestData.lokasi || '-';
          if (lokasiFormatted.includes(' (')) {
            lokasiFormatted = lokasiFormatted.replace(' (', '\n   (');
          }

          const waMessageText = `*PEMBERITAHUAN KEDATANGAN TAMU KSOP*

Yth. *${namaPejabatStr}*
(${namaTujuanStr})

Dengan hormat, kami beritahukan bahwa saat ini telah hadir tamu di Kantor KSOP yang ingin melakukan pertemuan dengan Bapak/Ibu.

📌 *Detail Registrasi Kunjungan Tamu:*
 • *No. Registrasi:* ${guestData.no_reg || '-'}
 • *Nama Tamu:* ${guestData.nama || '-'} (${guestData.jenis_kelamin || '-'})
 • *Asal / Instansi:* ${asalStr}
 • *No. Telepon:* ${guestData.no_telpon || '-'}
 • *Keperluan:* ${guestData.keperluan || '-'}
 • *Waktu:* ${guestData.tanggal || '-'} - ${guestData.jam || '-'} WIB
 • *Lokasi Presensi:* ${lokasiFormatted}

Demikian pemberitahuan ini kami sampaikan. Mohon untuk dapat memberikan konfirmasi atau arahan selanjutnya.

Terima kasih.
> _Pesan ini dikirimkan secara otomatis melalui Sistem Informasi Buku Tamu Digital (Si-Tamu) KSOP._`;

          const waUrl = `https://api.whatsapp.com/send?phone=${cleanNumber}&text=${encodeURIComponent(waMessageText)}`;
          window.open(waUrl, '_blank');
        }

        // Record CETAK_KARTU_TAMU activity log
        axios.post('/api/logs', {
          action: 'CETAK_KARTU_TAMU',
          details: `Mencetak Kartu Kunjungan Tamu: ${guestData.nama} (${guestData.no_reg})`
        }, { headers }).catch(logErr => console.error('Error logging CETAK_KARTU_TAMU:', logErr));

        // Complete Reset Form & Photo
        setFormData(prev => ({
          nama: '',
          no_telpon: '',
          kategori_asal: kategoriAsalList.length > 0 ? kategoriAsalList[0] : prev.kategori_asal,
          asal_instansi: '',
          jenis_kelamin: 'Laki-laki',
          alamat: '',
          lokasi: latestLocationRef.current || '',
          bertemu: tujuanList.length > 0 ? tujuanList[0] : prev.bertemu,
          keperluan: keperluanList.length > 0 ? keperluanList[0] : prev.keperluan
        }));
        setFotoBase64(null);
      }
    } catch (err) {
      console.error('Error registering guest:', err);
      showToast('Gagal menyimpan registrasi tamu: ' + (err.response?.data?.message || err.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans pb-12">
      <Header companyName="KSOP Si-Tamu" />

      <main className="w-full px-4 md:px-8 xl:px-12 mt-4 flex-1">
        {/* Seamless Form directly on main background */}
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

            {/* Inputs Left Column */}
            <div className="md:col-span-7 space-y-3.5 bg-white/95 backdrop-blur-md p-5 md:p-6 rounded-2xl border border-sky-100 shadow-xl shadow-sky-900/5 h-fit">
              <div className="border-b border-sky-100 pb-3 mb-2">
                <h3 className="font-extrabold text-lg text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-sky-500" />
                  Form Registrasi Tamu
                </h3>
              </div>

              {/* Row 1: Nama Tamu & Jenis Kelamin (50-50 Width Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">
                    Nama Tamu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    placeholder="Masukkan nama lengkap"
                    required
                    className="w-full text-[13px] font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 shadow-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="jenis_kelamin"
                    value={formData.jenis_kelamin}
                    onChange={handleChange}
                    className="w-full text-[13px] font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 shadow-xs cursor-pointer focus:bg-white"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Row 2: No Telpon & Kategori Asal (50-50 Width Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">No Telpon / WhatsApp</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    name="no_telpon"
                    value={formData.no_telpon}
                    onChange={handleChange}
                    placeholder="Nomor HP / WhatsApp (cth: 0812... / +628...)"
                    className="w-full text-[13px] font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 shadow-xs focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">
                    Kategori Asal
                  </label>
                  <select
                    name="kategori_asal"
                    value={formData.kategori_asal}
                    onChange={handleChange}
                    className="w-full text-[13px] font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 shadow-xs cursor-pointer focus:bg-white"
                  >
                    {kategoriAsalList.map((kat, idx) => (
                      <option key={idx} value={kat}>{kat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional Fields based on Dynamic Kategori Asal Configuration */}
              {checkIsOnlyAddress(formData.kategori_asal) ? (
                /* Only Show Alamat Lengkap for Masyarakat Umum / Domisili */
                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-1">
                    Alamat Lengkap / Domisili <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="alamat"
                    rows="3"
                    value={formData.alamat}
                    onChange={handleChange}
                    placeholder="Masukkan alamat lengkap / desa / kecamatan domisili Anda"
                    required
                    className="w-full text-[13px] font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 resize-none shadow-xs focus:bg-white"
                  />
                </div>
              ) : (
                /* Show Asal Instansi AND Alamat Detail for Instansi / Perusahaan / Lainnya */
                <>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1">
                      Asal Instansi / Perusahaan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="asal_instansi"
                      value={formData.asal_instansi}
                      onChange={handleChange}
                      placeholder="Nama Instansi, Dinas, atau Perusahaan Asal"
                      required
                      className="w-full text-[13px] font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 shadow-xs focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-1">Alamat Lengkap Instansi</label>
                    <textarea
                      name="alamat"
                      rows="2"
                      value={formData.alamat}
                      onChange={handleChange}
                      placeholder="Alamat detail instansi / kantor (opsional)"
                      className="w-full text-[13px] font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 resize-none shadow-xs focus:bg-white"
                    />
                  </div>
                </>
              )}

              {/* Bertemu Dropdown */}
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  Bertemu (Tujuan) <span className="text-red-500">*</span>
                </label>
                <select
                  name="bertemu"
                  value={formData.bertemu}
                  onChange={handleChange}
                  required
                  className="w-full text-[13px] font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 shadow-xs cursor-pointer focus:bg-white"
                >
                  {tujuanList.map((t, idx) => (
                    <option key={idx} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Keperluan / Catatan Kunjungan Text Area */}
              <div>
                <label className="block text-[13px] font-bold text-slate-700 mb-1">
                  Keperluan / Catatan Kunjungan <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="keperluan"
                  rows="2"
                  value={formData.keperluan}
                  onChange={handleChange}
                  placeholder="Tuliskan keperluan / catatan kunjungan Anda di sini..."
                  required
                  className="w-full text-[13px] font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 resize-none shadow-xs focus:bg-white"
                />
              </div>
            </div>

            {/* Camera Right Column */}
            <div className="md:col-span-5 flex flex-col justify-between bg-white/95 backdrop-blur-md p-5 md:p-6 rounded-2xl border border-sky-100 shadow-xl shadow-sky-900/5 h-fit">
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3 border-b border-sky-100 pb-3">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                    <Camera className="w-4 h-4 text-sky-500" />
                    Foto
                  </span>
                </div>

                <WebcamCapture
                  onCapture={(base64, loc) => {
                    setFotoBase64(base64);
                    const isInvalid = (val) => !val || !val.trim() || val === 'Lokasi Tidak Terdeteksi' || val === 'Mendeteksi Lokasi...';
                    if (!isInvalid(loc)) {
                      latestLocationRef.current = loc;
                      setFormData(prev => ({ ...prev, lokasi: loc }));
                    } else if (isInvalid(formData.lokasi)) {
                      const fallback = 'Desa Gapura, Kec. Kota Sumenep, Kab. Sumenep';
                      latestLocationRef.current = fallback;
                      setFormData(prev => ({ ...prev, lokasi: fallback }));
                    }
                  }}
                  onLocationChange={(loc) => {
                    const isInvalid = (val) => !val || !val.trim() || val === 'Lokasi Tidak Terdeteksi' || val === 'Mendeteksi Lokasi...';
                    if (!isInvalid(loc)) {
                      latestLocationRef.current = loc;
                      setFormData(prev => ({ ...prev, lokasi: loc }));
                    } else if (isInvalid(formData.lokasi)) {
                      const fallback = 'Desa Gapura, Kec. Kota Sumenep, Kab. Sumenep';
                      latestLocationRef.current = fallback;
                      setFormData(prev => ({ ...prev, lokasi: fallback }));
                    }
                  }}
                  currentPhoto={fotoBase64}
                />
              </div>

              <div className="mt-2.5 pt-2 border-t border-sky-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:scale-[0.98] text-white font-black text-base rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer border border-sky-300/30"
                >
                  {loading ? (
                    <span>Memproses Registrasi...</span>
                  ) : (
                    <>
                      <span>Submit Data Tamu</span>
                      <Camera className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </form>
      </main>

      {/* Flash Notification Toast */}
      <Flash toast={toast} onClose={() => setToast(null)} />

      {/* Visitor Badge Modal */}
      {showBadgeModal && (
        <VisitorBadgeModal
          guest={registeredGuest}
          onClose={() => setShowBadgeModal(false)}
        />
      )}
    </div>
  );
};

export default PublicKsop;
