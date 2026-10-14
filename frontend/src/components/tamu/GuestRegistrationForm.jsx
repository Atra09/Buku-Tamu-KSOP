import React from 'react';
import { UserCheck, Camera } from 'lucide-react';
import WebcamCapture from '../WebcamCapture';

/**
 * GuestRegistrationForm Component
 * Komponen visual murni untuk formulir pendaftaran tamu & pengambilan foto webcam.
 */
const GuestRegistrationForm = ({
  formData,
  handleChange,
  kategoriAsalList = [],
  tujuanList = [],
  checkIsOnlyAddress,
  fotoBase64,
  setFotoBase64,
  latestLocationRef,
  setFormData,
  loading,
  qrStatus,
  isGuestContext,
  onSubmit
}) => {
  const isOnlyAddress = checkIsOnlyAddress(formData.kategori_asal);

  const isInvalidLocation = (val) => !val || !val.trim() ||
    val === 'Lokasi Tidak Terdeteksi' ||
    val === 'Mendeteksi Lokasi...' ||
    val.startsWith('Perangkat tidak mendukung') ||
    val.startsWith('Gagal mendeteksi') ||
    val.startsWith('Akses Lokasi Ditolak') ||
    val.startsWith('Waktu Deteksi');

  const handleCapturePhoto = (base64, loc) => {
    setFotoBase64(base64);
    if (!isInvalidLocation(loc)) {
      if (latestLocationRef) latestLocationRef.current = loc;
      setFormData(prev => ({ ...prev, lokasi: loc }));
    }
  };

  const handleLocationUpdate = (loc) => {
    if (!isInvalidLocation(loc)) {
      if (latestLocationRef) latestLocationRef.current = loc;
      setFormData(prev => ({ ...prev, lokasi: loc }));
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

        {/* Inputs Left Column */}
        <div className="md:col-span-7 space-y-3.5 bg-white/95 backdrop-blur-md p-5 md:p-6 rounded-2xl border border-sky-100 shadow-xl shadow-sky-900/5 h-fit">
          <div className="border-b border-sky-100 pb-3 mb-2">
            <h3 className="font-extrabold text-lg text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-sky-500" />
              Form Registrasi Tamu
            </h3>
          </div>

          {/* Row 1: Nama Tamu & Jenis Kelamin */}
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
                maxLength={100}
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

          {/* Row 2: No Telpon & Kategori Asal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1">No Telpon / WhatsApp</label>
              <input
                type="tel"
                inputMode="numeric"
                name="no_telpon"
                value={formData.no_telpon}
                onChange={handleChange}
                maxLength={20}
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

          {/* Conditional Fields based on Kategori Asal */}
          {isOnlyAddress ? (
            <div>
              <label className="block text-[13px] font-bold text-slate-700 mb-1">
                Alamat Lengkap / Domisili <span className="text-red-500">*</span>
              </label>
              <textarea
                name="alamat"
                rows="3"
                value={formData.alamat}
                onChange={handleChange}
                maxLength={255}
                placeholder="Masukkan alamat lengkap / desa / kecamatan domisili Anda"
                required
                className="w-full text-[13px] font-bold px-3.5 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-400 focus:border-sky-400 transition-all bg-slate-50/50 text-slate-800 resize-none shadow-xs focus:bg-white"
              />
            </div>
          ) : (
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
                  maxLength={150}
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
                  maxLength={255}
                  placeholder="Alamat detail instansi / kantor"
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
              maxLength={255}
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
              onCapture={handleCapturePhoto}
              onLocationChange={handleLocationUpdate}
              currentPhoto={fotoBase64}
            />
          </div>

          <div className="mt-2.5 pt-2 border-t border-sky-100">
            <button
              type="submit"
              disabled={loading || qrStatus.submitted || (isGuestContext && !qrStatus.valid)}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 active:scale-[0.98] text-white font-black text-base rounded-xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer border border-sky-300/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Memproses Registrasi...</span>
              ) : qrStatus.submitted ? (
                <span>Pendaftaran Selesai</span>
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
  );
};

export default GuestRegistrationForm;
