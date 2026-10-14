import React from 'react';
import { Tag, Trash2 } from 'lucide-react';

/**
 * Reusable Action Buttons for Data Tables (Edit & Delete)
 *
 * @param {function} onEdit - Callback saat tombol edit diklik
 * @param {function} onDelete - Callback saat tombol hapus diklik
 * @param {string} editTitle - Tooltip tombol edit (default: "Edit Data")
 * @param {string} deleteTitle - Tooltip tombol hapus (default: "Hapus Data")
 */
export const TableActions = ({
  onEdit,
  onDelete,
  editTitle = 'Edit Data',
  deleteTitle = 'Hapus Data',
  editIcon: EditIcon = Tag,
  deleteIcon: DeleteIcon = Trash2
}) => {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
          title={editTitle}
        >
          <EditIcon className="w-3.5 h-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
          title={deleteTitle}
        >
          <DeleteIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

/**
 * Reusable Lightweight Table Frame Component
 *
 * @param {Array<{ label: string, className?: string }|string>} columns - Header kolom tabel
 * @param {Array<any>} data - Array data baris tabel
 * @param {function} renderRow - Fungsi render untuk setiap item baris: (item, index) => <tr>...</tr>
 * @param {string} emptyMessage - Pesan saat data kosong (default: "Belum ada data terdaftar.")
 * @param {boolean} loading - Status sedang memuat data
 * @param {string} loadingMessage - Pesan saat loading (default: "Memuat data...")
 * @param {string} maxHeight - Kelas batas ketinggian vertikal scrollbar (default: "max-h-[380px]")
 * @param {React.ReactNode} children - Opsi jika ingin kustom render tbody secara langsung
 */
const Table = ({
  columns = [],
  data = [],
  renderRow,
  emptyMessage = 'Belum ada data terdaftar.',
  loading = false,
  loadingMessage = 'Memuat data...',
  maxHeight = 'max-h-[380px]',
  className = '',
  children
}) => {
  return (
    <div className={`overflow-x-auto ${maxHeight} overflow-y-auto rounded-xl border border-slate-200 bg-white [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50 ${className}`}>
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 z-10 bg-slate-100 shadow-xs">
          <tr className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-200">
            {columns.map((col, idx) => {
              const label = typeof col === 'string' ? col : col.label;
              const className = typeof col === 'string' ? 'p-3' : (col.className || 'p-3');
              return (
                <th key={idx} className={className}>
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-medium">
          {children ? (
            children
          ) : loading ? (
            <tr>
              <td colSpan={columns.length || 1} className="text-center py-10 text-slate-400 font-semibold text-xs animate-pulse">
                {loadingMessage}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length || 1} className="text-center py-6 text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, idx) => renderRow?.(item, idx))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
export { Table };
