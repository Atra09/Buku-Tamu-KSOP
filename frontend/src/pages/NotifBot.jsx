import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { MessageSquare, RefreshCw } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import WaConnectionCard from '../components/bot/WaConnectionCard';
import WaTemplateList from '../components/bot/WaTemplateList';
import WaDisconnectModal from '../components/bot/WaDisconnectModal';
import WaPreviewModal from '../components/bot/WaPreviewModal';
import WaFormModal from '../components/bot/WaFormModal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const DEFAULT_SYSTEM_TEMPLATE = `🔔 *NOTIFIKASI KUNJUNGAN TAMU KSOP*

Yth. *{nama_pejabat}* ({tujuan_tamu}),

Diberitahukan bahwa telah hadir tamu *{nama_tamu}* dari *{asal_instansi}* pada tanggal *{waktu}* dengan kepentingan:
*{keperluan_tamu}*

_Terima kasih._
> Pesan Ini Dikirim Otomatis Oleh Web Si Tamu`;

const NotifBot = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [botStatus, setBotStatus] = useState({
    isConnected: false,
    isInitializing: false,
    qr: null,
    connectedUser: { phone: null, name: null }
  });
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Template State
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState('default');
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [systemDefaultTemplate, setSystemDefaultTemplate] = useState(DEFAULT_SYSTEM_TEMPLATE);

  // Modals State
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState({ title: '', sampleMessage: '' });
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const fetchBotStatus = useCallback(async () => {
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
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await axios.get('/api/wa-templates');
      if (res.data?.success) {
        if (res.data.defaultTemplate) {
          setSystemDefaultTemplate(res.data.defaultTemplate);
        }
        setTemplates(res.data.data || []);
        const active = res.data.data.find((t) => t.is_active);
        setActiveTemplateId(active ? active.id : 'default');
      }
    } catch (err) {
      console.error('Error fetching WA templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    fetchBotStatus();
    fetchTemplates();
    const interval = setInterval(fetchBotStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchBotStatus, fetchTemplates]);

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const res = await axios.post('/api/wa-bot/disconnect');
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
      const res = await axios.patch(`/api/wa-templates/activate/${id}`);
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
    setEditingTemplate(template);
    setShowFormModal(true);
  };

  const handleDeleteTemplate = async (template) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus template "${template.nama_template}"?`)) return;

    try {
      await axios.delete(`/api/wa-templates/${template.id}`);
      showToast('Template pesan berhasil dihapus', 'success');
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      showToast('Gagal menghapus template pesan', 'error');
    }
  };

  return (
    <AdminLayout
      title="Kelola Akun WhatsApp"
      subtitle="Integrasi pengiriman pesan otomatis presensi tamu via Local WA Bot (Baileys)"
    >
      <div className="space-y-6 pb-12">
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
            type="button"
            onClick={fetchBotStatus}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>

        {/* SECTION 1: Status Koneksi / QR Scanner Baileys */}
        <WaConnectionCard
          loading={loading}
          botStatus={botStatus}
          onRequestDisconnect={() => setShowConfirmModal(true)}
        />

        {/* SECTION 2: Daftar Template Pesan Notifikasi */}
        <WaTemplateList
          templates={templates}
          activeTemplateId={activeTemplateId}
          loadingTemplates={loadingTemplates}
          systemDefaultTemplate={systemDefaultTemplate}
          onSetActiveTemplate={handleSetActiveTemplate}
          onAddTemplate={() => handleOpenForm(null)}
          onPreview={handleOpenPreview}
          onEdit={handleOpenForm}
          onDelete={handleDeleteTemplate}
        />

        {/* MODAL 1: Confirm Disconnect */}
        <WaDisconnectModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleDisconnect}
          disconnecting={disconnecting}
        />

        {/* MODAL 2: WhatsApp Message Preview Pop-up */}
        <WaPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title={previewData.title}
          sampleMessage={previewData.sampleMessage}
        />

        {/* MODAL 3: Add / Edit Custom Template */}
        <WaFormModal
          isOpen={showFormModal}
          onClose={() => setShowFormModal(false)}
          editingTemplate={editingTemplate}
          onSuccess={fetchTemplates}
          showToast={showToast}
          getStoredUserNama={() => user?.nama || user?.username || 'Admin'}
        />
      </div>
    </AdminLayout>
  );
};

export default NotifBot;
