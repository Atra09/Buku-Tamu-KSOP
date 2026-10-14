import React, { memo } from 'react';
import { Info } from 'lucide-react';
import Modal from '../modal/Modal';

/**
 * Helper untuk format teks WhatsApp (bold *teks*, italic _teks_, quote >teks)
 * Ditempatkan di luar komponen agar tidak dibuat ulang pada setiap render.
 */
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
      return (
        <div key={idx} className="border-l-4 border-slate-300 pl-2 my-1 italic text-slate-500 text-[11px]">
          {content}
        </div>
      );
    }
    return <div key={idx} className="min-h-[1.25rem]">{content}</div>;
  });
};

/**
 * Reusable & Lightweight WhatsApp Message Preview Modal
 */
const WaPreviewModal = memo(({
  isOpen = false,
  onClose,
  title = '',
  sampleMessage = ''
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Preview Pop-Up: ${title}`}
      size="lg"
      footer={
        <button
          type="button"
          onClick={onClose}
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

        {/* WhatsApp Mockup Frame */}
        <div className="rounded-2xl border border-slate-300 shadow-md overflow-hidden bg-[#efeae2] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
          {/* Header WhatsApp Bar */}
          <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-800 border border-white/20 flex items-center justify-center font-bold text-xs text-white">
              WA
            </div>
            <div>
              <h4 className="font-bold text-xs leading-tight">Bot Notifikasi KSOP</h4>
              <p className="text-[10px] text-emerald-200">Online • Pengiriman Otomatis</p>
            </div>
          </div>

          {/* Chat Container */}
          <div className="p-4 sm:p-6 space-y-3">
            <div className="flex justify-center">
              <span className="text-[10px] font-semibold bg-white/80 backdrop-blur-xs text-slate-500 px-3 py-1 rounded-md shadow-xs">
                HARI INI
              </span>
            </div>

            {/* Bubble Chat Balon Putih */}
            <div className="bg-white rounded-2xl rounded-tl-none p-4 text-slate-800 text-xs shadow-md border border-slate-100 max-w-[92%] sm:max-w-[85%] space-y-2 relative font-sans leading-relaxed">
              {renderFormattedWhatsAppText(sampleMessage)}
              <div className="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-1">
                <span>14:30</span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 flex items-start gap-2">
          <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <strong>Catatan Tag Dinamis:</strong> Variabel seperti <code>{'{nama_pejabat}'}</code>, <code>{'{nama_tamu}'}</code>, <code>{'{waktu}'}</code> akan otomatis diganti dengan data asli presensi tamu saat pesan dikirim.
          </div>
        </div>
      </div>
    </Modal>
  );
});

WaPreviewModal.displayName = 'WaPreviewModal';

export default WaPreviewModal;
