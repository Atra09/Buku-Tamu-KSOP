import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UserCheck, Camera, Send, FileText, CheckCircle2, ShieldCheck, User, Building, Phone, MapPin, Tag, AlertCircle, X } from 'lucide-react';
import Header from '../components/Header';
import WebcamCapture from '../components/WebcamCapture';
import VisitorBadgeModal from '../components/VisitorBadgeModal';

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
  }, []);

  const fetchDropdowns = async () => {
    try {
      const res = await axios.get('/api/master/dropdowns');
      if (res.data && res.data.data) {
        const fetchedTujuan = res.data.data.tujuan || [];
        const fetchedKeperluan = res.data.data.keperluan || [];
        const fetchedKategori = res.data.data.kategoriAsal || [];
        const fetchedKategoriObjects = res.data.data.kategoriAsalList || [];

        setTujuanList(fetchedTujuan);
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

      const res = await axios.post('/api/tamu', payload);
      if (res.data && res.data.success) {
        const guestData = res.data.data;
        setRegisteredGuest(guestData);
        setShowBadgeModal(true);

        // Reset Form
        setFormData(prev => ({
          ...prev,
          nama: '',
          no_telpon: '',
          asal_instansi: '',
          alamat: ''
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
        <form onSubmit={handleSubmit} className="w-full flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Inputs Left Column */}
            <div className="md:col-span-7 space-y-4 bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-sky-100 shadow-xl shadow-sky-900/5">
              <div className="border-b border-sky-100 pb-3 mb-2">
                <h3 className="font-extrabold text-lg text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-sky-500" />
                  Form Registrasi Tamu
                </h3>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Tamu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  required
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 shadow-xs focus:bg-white"
                />
              </div>

              {/* No Telpon */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">No Telpon / WhatsApp</label>
                <input
                  type="text"
                  name="no_telpon"
                  value={formData.no_telpon}
                  onChange={handleChange}
                  placeholder="Nomor HP / WhatsApp"
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 shadow-xs focus:bg-white"
                />
              </div>

              {/* Asal Instansi & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Asal
                  </label>
                  <select
                    name="kategori_asal"
                    value={formData.kategori_asal}
                    onChange={handleChange}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 shadow-xs cursor-pointer focus:bg-white"
                  >
                    {kategoriAsalList.map((kat, idx) => (
                      <option key={idx} value={kat}>{kat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Kelamin <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="jenis_kelamin"
                    value={formData.jenis_kelamin}
                    onChange={handleChange}
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 shadow-xs cursor-pointer focus:bg-white"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>

              {/* Conditional Fields based on Dynamic Kategori Asal Configuration */}
              {checkIsOnlyAddress(formData.kategori_asal) ? (
                /* Only Show Alamat Lengkap for Masyarakat Umum / Domisili */
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alamat Lengkap / Domisili <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="alamat"
                    rows="3"
                    value={formData.alamat}
                    onChange={handleChange}
                    placeholder="Masukkan alamat lengkap / desa / kecamatan domisili Anda"
                    required
                    className="w-full text-xs font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 resize-none shadow-xs focus:bg-white"
                  />
                </div>
              ) : (
                /* Show Asal Instansi AND Alamat Detail for Instansi / Perusahaan / Lainnya */
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Asal Instansi / Perusahaan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="asal_instansi"
                      value={formData.asal_instansi}
                      onChange={handleChange}
                      placeholder="Nama Instansi, Dinas, atau Perusahaan Asal"
                      required
                      className="w-full text-xs font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 shadow-xs focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Instansi</label>
                    <textarea
                      name="alamat"
                      rows="2"
                      value={formData.alamat}
                      onChange={handleChange}
                      placeholder="Alamat detail instansi / kantor (opsional)"
                      className="w-full text-xs font-semibold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 resize-none shadow-xs focus:bg-white"
                    />
                  </div>
                </>
              )}

              {/* Lokasi Registrasi (Terdeteksi Otomatis) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                  <span>Lokasi Registrasi</span>
                  <span className="text-[10px] text-sky-600 font-semibold bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">Terdeteksi Kamera</span>
                </label>
                <input
                  type="text"
                  name="lokasi"
                  value={formData.lokasi}
                  onChange={handleChange}
                  placeholder="Lokasi otomatis terdeteksi kamera..."
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-sky-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-sky-50/50 text-slate-800 shadow-xs focus:bg-white"
                />
              </div>

              {/* Bertemu Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bertemu (Tujuan) <span className="text-red-500">*</span>
                </label>
                <select
                  name="bertemu"
                  value={formData.bertemu}
                  onChange={handleChange}
                  required
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 shadow-xs cursor-pointer focus:bg-white"
                >
                  {tujuanList.map((t, idx) => (
                    <option key={idx} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Keperluan / Catatan Kunjungan Text Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Keperluan / Catatan Kunjungan <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="keperluan"
                  rows="2"
                  value={formData.keperluan}
                  onChange={handleChange}
                  placeholder="Tuliskan keperluan / catatan kunjungan Anda di sini..."
                  required
                  className="w-full text-xs font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 resize-none shadow-xs focus:bg-white"
                />
              </div>
            </div>

            {/* Camera Right Column - Full height stretch */}
            <div className="md:col-span-5 flex flex-col justify-between bg-white/95 backdrop-blur-md p-6 rounded-2xl border border-sky-100 shadow-xl shadow-sky-900/5">
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

              <div className="mt-4 pt-3 border-t border-sky-100">
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

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-bounceIn shadow-2xl transition-all">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${
              toast.type === 'success'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500/40 shadow-emerald-900/20'
                : 'bg-slate-900 text-rose-400 border-rose-500/40 shadow-rose-900/20'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span className="text-xs font-bold text-slate-100">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
