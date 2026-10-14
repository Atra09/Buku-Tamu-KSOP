import React, { useState, useEffect, memo } from 'react';
import axios from 'axios';
import { Plus, RefreshCw, CheckCircle } from 'lucide-react';
import Modal from '../modal/Modal';

const TAG_ITEMS = [
  { tag: '{nama_pejabat}', desc: 'Nama Pejabat Tujuan' },
  { tag: '{tujuan_tamu}', desc: 'Seksi / Bidang Tujuan' },
  { tag: '{nama_tamu}', desc: 'Nama Tamu' },
  { tag: '{WA_tamu}', desc: 'Nomor WA / Telepon Tamu' },
  { tag: '{asal_instansi}', desc: 'Asal Instansi Tamu' },
  { tag: '{waktu}', desc: 'Waktu / Jam Kedatangan' },
  { tag: '{keperluan_tamu}', desc: 'Keperluan / Tujuan Tamu' }
];

const DEFAULT_NEW_MESSAGE = `🔔 *NOTIFIKASI KUNJUNGAN TAMU KSOP*\n\nYth. *{nama_pejabat}*,\n\nTamu *{nama_tamu}* ({WA_tamu}) dari *{asal_instansi}* telah tiba untuk keperluan *{tujuan_tamu}*:\n*{keperluan_tamu}*\n\nWaktu: {waktu}\n\n_Terima kasih._`;

/**
 * Reusable & Lightweight Form Modal untuk Tambah / Edit Template Pesan WA
 * State form terisolasi sehingga ketikan keyboard tidak memicu re-render di halaman utama.
 */
const WaFormModal = memo(({
  isOpen = false,
  onClose,
  editingTemplate = null,
  onSuccess,
  showToast,
  getStoredUserNama
}) => {
  const [formData, setFormData] = useState({ nama_template: '', isi_pesan: '' });
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Sinkronkan data saat modal dibuka atau template yang diedit berganti
  useEffect(() => {
    if (!isOpen) return;

    if (editingTemplate) {
      setFormData({
        nama_template: editingTemplate.nama_template || '',
        isi_pesan: editingTemplate.isi_pesan || ''
      });
    } else {
      setFormData({
        nama_template: '',
        isi_pesan: DEFAULT_NEW_MESSAGE
      });
    }
  }, [isOpen, editingTemplate]);

  if (!isOpen) return null;

  const handleInsertTag = (tag) => {
    setFormData((prev) => ({ ...prev, isi_pesan: prev.isi_pesan + tag }));
  };

  const handleSaveTemplate = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.nama_template.trim() || !formData.isi_pesan.trim()) {
      showToast?.('Nama template dan isi pesan tidak boleh kosong', 'error');
      return;
    }

    setSavingTemplate(true);
    try {
      if (editingTemplate) {
        await axios.put(`/api/wa-templates/${editingTemplate.id}`, formData);
        showToast?.('Template pesan berhasil diperbarui', 'success');
      } else {
        await axios.post('/api/wa-templates', formData);
        showToast?.('Template pesan baru berhasil dibuat', 'success');
      }

      onClose?.();
      onSuccess?.();
    } catch (err) {
      console.error('Error saving template:', err);
      showToast?.('Gagal menyimpan template pesan', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingTemplate ? 'Edit Template Pesan Kustom' : 'Tambah Template Pesan Baru'}
      size="xl"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
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
            {savingTemplate ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
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
            onChange={(e) => setFormData((prev) => ({ ...prev, nama_template: e.target.value }))}
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
            onChange={(e) => setFormData((prev) => ({ ...prev, isi_pesan: e.target.value }))}
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
  );
});

WaFormModal.displayName = 'WaFormModal';

export default WaFormModal;
