import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  MessageSquare, CheckCircle2, QrCode, LogOut, RefreshCw, 
  AlertTriangle, Server, Eye, Plus, Edit3, Trash2, CheckCircle, 
  FileText, Info
} from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import Flash from '../components/flash/flash';
import Modal from '../components/modal/Modal';

const DEFAULT_SYSTEM_TEMPLATE = `🔔 *NOTIFIKASI KUNJUNGAN TAMU KSOP*

Yth. *{nama_pejabat}* ({tujuan_tamu}),

Diberitahukan bahwa telah hadir tamu *{nama_tamu}* dari *{asal_instansi}* pada tanggal *{waktu}* dengan kepentingan:
*{keperluan_tamu}*

_Terima kasih._
> Pesan Ini Dikirim Otomatis Oleh Web Si Tamu`;

const TAG_ITEMS = [
  { tag: '{nama_pejabat}', desc: 'Nama Pejabat Tujuan' },
  { tag: '{tujuan_tamu}', desc: 'Seksi / Bidang Tujuan' },
  { tag: '{nama_tamu}', desc: 'Nama Tamu' },
  { tag: '{WA_tamu}', desc: 'Nomor WA / Telepon Tamu' },
  { tag: '{asal_instansi}', desc: 'Asal Instansi Tamu' },
  { tag: '{waktu}', desc: 'Waktu / Jam Kedatangan' },
  { tag: '{keperluan_tamu}', desc: 'Keperluan / Tujuan Tamu' }
];

const getStoredUserNama = () => {
  try {
    const rawUser = sessionStorage.getItem('sitamu_user') || localStorage.getItem('sitamu_user');
    if (rawUser && rawUser !== 'undefined') {
      const parsed = JSON.parse(rawUser);
      return parsed.nama || parsed.username || 'Admin';
    }
  } catch (e) {}
  return 'Admin';
};

const NotifBot = () => {
  const [botStatus, setBotStatus] = useState({ isConnected: false, isInitializing: false, qr: null, connectedUser: { phone: null, name: null } });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Template State
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState('default');
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Modals State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState({ title: '', sampleMessage: '' });

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({ nama_template: '', isi_pesan: '' });
  const [savingTemplate, setSavingTemplate] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBotStatus = async () => {
    try {
      const res = await axios.get('/api/wa-bot/status');
      if (res.data?.success) {
        setBotStatus({
          isConnected: res.data.isConnected,
          isInitializing: res.data.isInitializing,
          qr: res.data.qr,
          connectedUser: res.data.connectedUser || { phone: null, name: null }
        });
      }
    } catch (err) {
      console.error('Error fetching WA Bot status:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await axios.get('/api/wa-templates');
      if (res.data?.success) {
        setTemplates(res.data.data || []);
        const active = res.data.data.find(t => t.is_active);
        setActiveTemplateId(active ? active.id : 'default');
      }
    } catch (err) {
      console.error('Error fetching WA templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    fetchBotStatus();
    fetchTemplates();
    const interval = setInterval(fetchBotStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await axios.post('/api/wa-bot/disconnect', {}, {
        headers: { 'x-user-nama': encodeURIComponent(getStoredUserNama()) }
      });
      if (res.data?.success) {
        showToast('Koneksi WhatsApp Bot berhasil diputuskan.', 'success');
        setShowConfirmModal(false);
        fetchBotStatus();
      } else {
        showToast('Gagal memutuskan koneksi bot', 'error');
      }
    } catch (err) {
      console.error('Error disconnecting WA Bot:', err);
      showToast('Terjadi kesalahan saat memutuskan koneksi bot', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSetActiveTemplate = async (id) => {
    try {
      const res = await axios.patch(`/api/wa-templates/activate/${id}`, {}, {
        headers: { 'x-user-nama': encodeURIComponent(getStoredUserNama()) }
      });
      if (res.data?.success) {
        setActiveTemplateId(id);
        showToast(res.data.message || 'Template pesan aktif berhasil diubah', 'success');
        fetchTemplates();
      }
    } catch (err) {
      console.error('Error setting active template:', err);
      showToast('Gagal mengubah template aktif', 'error');
    }
  };

  const handleOpenPreview = (title, rawTemplate) => {
    const sampleMessage = rawTemplate
      .replace(/{nama_pejabat}/g, 'Bpk. Hendra Gunawan, M.Mar')
      .replace(/{tujuan_tamu}/g, 'Seksi Keselamatan Berlayar')
      .replace(/{nama_tujuan}/g, 'Seksi Keselamatan Berlayar')
      .replace(/{nama_tamu}/g, 'Budi Santoso')
      .replace(/{WA_tamu}/g, '081234567890')
      .replace(/{no_wa}/g, '081234567890')
      .replace(/{no_telepon}/g, '081234567890')
      .replace(/{no_telpon}/g, '081234567890')
      .replace(/{asal_instansi}/g, 'PT. Logistics Maritime (Instansi / Dinas)')
      .replace(/{waktu}/g, '18 September 2026 pukul 14:30 WIB')
      .replace(/{keperluan_tamu}/g, 'Pengurusan Surat Clearance & Koordinasi Keagenan Kapal')
      .replace(/{keperluan}/g, 'Pengurusan Surat Clearance & Koordinasi Keagenan Kapal');

    setPreviewData({ title, sampleMessage });
    setShowPreviewModal(true);
  };

  const handleOpenForm = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({ nama_template: template.nama_template, isi_pesan: template.isi_pesan });
    } else {
      setEditingTemplate(null);
      setFormData({
        nama_template: '',
        isi_pesan: `🔔 *NOTIFIKASI KUNJUNGAN TAMU KSOP*\n\nYth. *{nama_pejabat}*,\n\nTamu *{nama_tamu}* ({WA_tamu}) dari *{asal_instansi}* telah tiba untuk keperluan *{tujuan_tamu}*:\n*{keperluan_tamu}*\n\nWaktu: {waktu}\n\n_Terima kasih._`
      });
    }
    setShowFormModal(true);
  };

  const handleInsertTag = (tag) => {
    setFormData(prev => ({ ...prev, isi_pesan: prev.isi_pesan + tag }));
  };

  const handleSaveTemplate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.nama_template.trim() || !formData.isi_pesan.trim()) {
      showToast('Nama template dan isi pesan tidak boleh kosong', 'error');
      return;
    }

    setSavingTemplate(true);
    try {
      const headers = { 'x-user-nama': encodeURIComponent(getStoredUserNama()) };
      if (editingTemplate) {
        await axios.put(`/api/wa-templates/${editingTemplate.id}`, formData, { headers });
        showToast('Template pesan berhasil diperbarui', 'success');
      } else {
        await axios.post('/api/wa-templates', formData, { headers });
        showToast('Template pesan baru berhasil dibuat', 'success');
      }
      setShowFormModal(false);
      fetchTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      showToast('Gagal menyimpan template pesan', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus template "${template.nama_template}"?`)) return;

    try {
      const headers = { 'x-user-nama': encodeURIComponent(getStoredUserNama()) };
      await axios.delete(`/api/wa-templates/${template.id}`, { headers });
      showToast('Template pesan berhasil dihapus', 'success');
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      showToast('Gagal menghapus template pesan', 'error');
    }
  };

  const renderFormattedWhatsAppText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      const isQuote = line.trim().startsWith('>');
      const rawLine = isQuote ? line.replace(/^>\s*/, '') : line;

      const parts = [];
      const boldRegex = /\*([^*]+)\*/g;
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(rawLine)) !== null) {
        if (match.index > lastIndex) parts.push(rawLine.substring(lastIndex, match.index));
        parts.push(<strong key={`b-${match.index}`} className="font-bold">{match[1]}</strong>);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < rawLine.length) parts.push(rawLine.substring(lastIndex));

      const content = parts.length > 0 ? parts : rawLine;
      if (isQuote) {
        return <div key={idx} className="border-l-4 border-slate-300 pl-2 my-1 italic text-slate-500 text-[11px]">{content}</div>;
      }
      return <div key={idx} className="min-h-[1.25rem]">{content}</div>;
    });
  };

  return (
    <AdminLayout
      title="Kelola Akun WhatsApp"
      subtitle="Integrasi pengiriman pesan otomatis presensi tamu via Local WA Bot (Baileys)"
    >
      <div className="space-y-6 pb-12">
        {toast && <Flash toast={toast} onClose={() => setToast(null)} />}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-sky-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Manajemen WA Bot Notifikasi</h1>
              <p className="text-xs text-slate-500">Integrasi pengiriman pesan otomatis presensi tamu via Local WA Bot (Baileys)</p>
            </div>
          </div>

          <button
            onClick={fetchBotStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {/* Main Content Area - Status Bot */}
        {loading && !botStatus.isConnected && !botStatus.qr ? (
          <div className="bg-white p-12 rounded-2xl border border-sky-100 shadow-sm text-center">
            <RefreshCw className="w-8 h-8 text-sky-500 animate-spin mx-auto mb-3" />
            <p className="text-slate-600 text-sm font-medium">Memuat status koneksi WhatsApp Bot...</p>
          </div>
        ) : botStatus.isConnected ? (
          /* State 1: Connected */
          <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/30 text-white border border-white/20">
                    🟢 Status: TERHUBUNG
                  </span>
                  <h2 className="text-xl font-bold mt-1">Bot Notifikasi WhatsApp Aktif</h2>
                </div>
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 bg-white hover:bg-rose-50 rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Putuskan Koneksi
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                  <span className="text-xs font-medium text-emerald-700">Nomor WA Bot</span>
                  <p className="text-lg font-bold text-slate-800">
                    {botStatus.connectedUser.phone ? `+${botStatus.connectedUser.phone}` : '-'}
                  </p>
                </div>

                <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-xl">
                  <span className="text-xs font-medium text-sky-700">Nama Akun WhatsApp</span>
                  <p className="text-lg font-bold text-slate-800">
                    {botStatus.connectedUser.name || 'KSOP Local WA Bot'}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-xs font-medium text-slate-500">Tipe Service Backend</span>
                  <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5 mt-1">
                    <Server className="w-4 h-4 text-emerald-600" />
                    Local Baileys
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* State 2: QR Code Scan */
          <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-6 md:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-3 text-slate-700 font-semibold text-xs">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  Scan QR Code Di Bawah Ini
                </div>

                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                  {botStatus.qr ? (
                    <img src={botStatus.qr} alt="WhatsApp Bot QR Code" className="w-56 h-56 object-contain rounded-lg" />
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center text-center p-4 bg-slate-50 rounded-lg">
                      <RefreshCw className="w-7 h-7 text-sky-500 animate-spin mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Menyiapkan QR Code...</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Auto-refresh status setiap 3 detik
                </div>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 inline-block mb-2">
                    🔴 Status: Belum Terhubung
                  </span>
                  <h2 className="text-xl font-bold text-slate-800">Sambungkan WhatsApp Bot Pengirim</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Pindai QR Code untuk mengaktifkan notifikasi kedatangan tamu otomatis.</p>
                </div>

                <div className="space-y-3 bg-sky-50/50 p-4 rounded-2xl border border-sky-100 text-xs text-slate-700">
                  <h3 className="font-bold text-slate-800">Langkah-Langkah Penyambungan:</h3>
                  <ol className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] shrink-0 mt-0.5">1</span>
                      <span>Buka aplikasi <strong>WhatsApp</strong> di HP pengirim.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] shrink-0 mt-0.5">2</span>
                      <span>Ketuk <strong>Titik Tiga (⋮)</strong> / <strong>Pengaturan</strong> -&gt; <strong>Perangkat Tertaut</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-sky-600 text-white font-bold text-[10px] shrink-0 mt-0.5">3</span>
                      <span>Tekan <strong>Tautkan Perangkat</strong> dan arahkan kamera HP ke <strong>QR Code</strong> di samping.</span>
                    </li>
                  </ol>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">
                    Setelah QR Code berhasil di-scan, halaman ini akan otomatis berubah menjadi status <strong>Terhubung</strong>.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SECTION: Template Pesan Notifikasi WhatsApp */}
        <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Template Pesan Notifikasi WhatsApp</h2>
                <p className="text-xs text-slate-500">Pilih template aktif atau buat pesan kustom yang akan dikirim ke pejabat tujuan.</p>
              </div>
            </div>

            <button
              onClick={() => handleOpenForm(null)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Template Kustom
            </button>
          </div>

          <div className="space-y-4">
            
            {/* Card 1: Default System Template */}
            <div className={`p-5 rounded-2xl border transition-all ${activeTemplateId === 'default' ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <input
                    type="radio"
                    name="wa_template"
                    id="tpl_default"
                    checked={activeTemplateId === 'default'}
                    onChange={() => handleSetActiveTemplate('default')}
                    className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <label htmlFor="tpl_default" className="font-bold text-slate-800 text-sm cursor-pointer">
                        Format Formal Bawaan (Default Sistem)
                      </label>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        Sistem
                      </span>
                      {activeTemplateId === 'default' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          AKTIF DIGUNAKAN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      Template resmi default dengan header notifikasi, detail tamu lengkap, dan footnote otomatis.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleOpenPreview('Format Formal Bawaan (Default Sistem)', DEFAULT_SYSTEM_TEMPLATE)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Lihat Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2..N: Custom Templates */}
            {loadingTemplates ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
                Memuat daftar template kustom...
              </div>
            ) : templates.length > 0 ? (
              templates.map((tpl) => (
                <div 
                  key={tpl.id}
                  className={`p-5 rounded-2xl border transition-all ${activeTemplateId === tpl.id ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <input
                        type="radio"
                        name="wa_template"
                        id={`tpl_${tpl.id}`}
                        checked={activeTemplateId === tpl.id}
                        onChange={() => handleSetActiveTemplate(tpl.id)}
                        className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <label htmlFor={`tpl_${tpl.id}`} className="font-bold text-slate-800 text-sm cursor-pointer">
                            {tpl.nama_template}
                          </label>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Kustom
                          </span>
                          {activeTemplateId === tpl.id && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              AKTIF DIGUNAKAN
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">
                          {tpl.isi_pesan}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                      <button
                        onClick={() => handleOpenPreview(tpl.nama_template, tpl.isi_pesan)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>

                      <button
                        onClick={() => handleOpenForm(tpl)}
                        className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteTemplate(tpl)}
                        className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Hapus Template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : null}

          </div>
        </div>

        {/* MODAL 1: Confirm Disconnect */}
        <Modal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          size="sm"
        >
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-800">Putuskan Koneksi WA Bot?</h3>
              <p className="text-xs text-slate-500 mt-1">Sesi WhatsApp Bot akan dikeluarkan. Anda perlu scan QR Code baru jika ingin menghubungkannya lagi.</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={disconnecting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {disconnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                {disconnecting ? 'Memproses...' : 'Ya, Putuskan'}
              </button>
            </div>
          </div>
        </Modal>

        {/* MODAL 2: WhatsApp Message Preview Pop-up */}
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={`Preview Pop-Up: ${previewData.title}`}
          size="lg"
          footer={
            <button
              onClick={() => setShowPreviewModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Tutup Preview
            </button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Simulasi tampilan pesan yang akan diterima oleh Pejabat Tujuan:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                WhatsApp Chat Bubble
              </span>
            </div>

            <div className="rounded-2xl border border-slate-300 shadow-md overflow-hidden bg-[#efeae2] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
              <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-800 border border-white/20 flex items-center justify-center font-bold text-xs text-white">
                  WA
                </div>
                <div>
                  <h4 className="font-bold text-xs leading-tight">Bot Notifikasi KSOP</h4>
                  <p className="text-[10px] text-emerald-200">Online • Pengiriman Otomatis</p>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-3">
                <div className="flex justify-center">
                  <span className="text-[10px] font-semibold bg-white/80 backdrop-blur-xs text-slate-500 px-3 py-1 rounded-md shadow-xs">
                    HARI INI
                  </span>
                </div>

                <div className="bg-white rounded-2xl rounded-tl-none p-4 text-slate-800 text-xs shadow-md border border-slate-100 max-w-[92%] sm:max-w-[85%] space-y-2 relative font-sans leading-relaxed">
                  {renderFormattedWhatsAppText(previewData.sampleMessage)}
                  <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                    <span>14:30</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong>Catatan Tag Dinamis:</strong> Variabel seperti <code>{'{nama_pejabat}'}</code>, <code>{'{nama_tamu}'}</code>, <code>{'{waktu}'}</code> akan otomatis diganti dengan data asli presensi tamu saat pesan dikirim.
              </div>
            </div>
          </div>
        </Modal>

        {/* MODAL 3: Add / Edit Custom Template */}
        <Modal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          title={editingTemplate ? 'Edit Template Pesan Kustom' : 'Tambah Template Pesan Baru'}
          size="xl"
          footer={
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                disabled={savingTemplate}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingTemplate ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                {savingTemplate ? 'Menyimpan...' : 'Simpan Template'}
              </button>
            </div>
          }
        >
          <form onSubmit={handleSaveTemplate} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama / Judul Template <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nama_template}
                onChange={(e) => setFormData({ ...formData, nama_template: e.target.value })}
                placeholder="Contoh: Template Notifikasi Ringkas"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  Isi Pesan WhatsApp <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">Gunakan "*teks*" untuk bold, "_teks_" untuk miring</span>
              </div>

              <textarea
                rows={7}
                value={formData.isi_pesan}
                onChange={(e) => setFormData({ ...formData, isi_pesan: e.target.value })}
                placeholder="Tuliskan format pesan di sini..."
                className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all leading-relaxed"
                required
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Klik Tag Di Bawah Untuk Menyisipkan Variabel Dinamis:
              </span>

              <div className="flex flex-wrap gap-2 pt-1">
                {TAG_ITEMS.map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertTag(item.tag)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold text-sky-700 bg-white hover:bg-sky-50 border border-sky-200 rounded-lg transition-all shadow-xs cursor-pointer"
                    title={`Sisipkan ${item.desc}`}
                  >
                    <Plus className="w-3 h-3 text-sky-500" />
                    {item.tag}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </Modal>

      </div>
    </AdminLayout>
  );
};

export default NotifBot;
