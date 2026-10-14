import React, { memo } from 'react';
import {
  FileText, Plus, CheckCircle, Eye, Edit3, Trash2, RefreshCw
} from 'lucide-react';

/**
 * Reusable Card Component untuk Item Template (Sistem maupun Kustom)
 * Menghilangkan duplikasi markup JSX, memastikan styling konsisten, dan mudah di-maintain.
 */
const WaTemplateCard = memo(({
  id,
  title,
  type = 'Kustom', // 'Sistem' | 'Kustom'
  isActive = false,
  description = '',
  isMono = false,
  onSelect,
  onPreview,
  onEdit,
  onDelete
}) => {
  const isSystem = type === 'Sistem';

  return (
    <div
      className={`p-5 rounded-2xl border transition-all ${
        isActive
          ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Kolom Kiri: Radio & Konten */}
        <div className="flex items-start gap-3.5">
          <input
            type="radio"
            name="wa_template"
            id={`tpl_${id}`}
            checked={isActive}
            onChange={onSelect}
            className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <label htmlFor={`tpl_${id}`} className="font-bold text-slate-800 text-sm cursor-pointer">
                {title}
              </label>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isSystem
                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}
              >
                {type}
              </span>
              {isActive && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  AKTIF DIGUNAKAN
                </span>
              )}
            </div>

            {isMono ? (
              <p className="text-xs text-slate-600 mt-1 line-clamp-2 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 whitespace-pre-wrap">
                {description}
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Tombol Aksi */}
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            {isSystem ? 'Lihat Preview' : 'Preview'}
          </button>

          {!isSystem && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
              title="Edit Template"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {!isSystem && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
              title="Hapus Template"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

WaTemplateCard.displayName = 'WaTemplateCard';

/**
 * Reusable Component untuk Daftar Template Pesan WhatsApp
 * Menampung Template Bawaan Sistem dan Looping Template Kustom tanpa kode berulang.
 */
const WaTemplateList = memo(({
  templates = [],
  activeTemplateId = 'default',
  loadingTemplates = false,
  systemDefaultTemplate = '',
  onSetActiveTemplate,
  onAddTemplate,
  onPreview,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white rounded-2xl border border-sky-100 shadow-sm p-6 space-y-6">
      {/* Section Header */}
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
          type="button"
          onClick={onAddTemplate}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tambah Template Kustom
        </button>
      </div>

      <div className="space-y-4">
        {/* Template Default Sistem */}
        <WaTemplateCard
          id="default"
          title="Format Formal Bawaan (Default Sistem)"
          type="Sistem"
          isActive={activeTemplateId === 'default'}
          description="Template resmi default dengan header notifikasi, detail tamu lengkap, dan footnote otomatis."
          isMono={false}
          onSelect={() => onSetActiveTemplate?.('default')}
          onPreview={() => onPreview?.('Format Formal Bawaan (Default Sistem)', systemDefaultTemplate)}
        />

        {/* Daftar Template Kustom */}
        {loadingTemplates ? (
          <div className="p-6 text-center text-slate-500 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-500" />
            Memuat daftar template kustom...
          </div>
        ) : (
          templates.map((tpl) => (
            <WaTemplateCard
              key={tpl.id}
              id={tpl.id}
              title={tpl.nama_template}
              type="Kustom"
              isActive={activeTemplateId === tpl.id}
              description={tpl.isi_pesan}
              isMono={true}
              onSelect={() => onSetActiveTemplate?.(tpl.id)}
              onPreview={() => onPreview?.(tpl.nama_template, tpl.isi_pesan)}
              onEdit={() => onEdit?.(tpl)}
              onDelete={() => onDelete?.(tpl)}
            />
          ))
        )}
      </div>
    </div>
  );
});

WaTemplateList.displayName = 'WaTemplateList';

export default WaTemplateList;
