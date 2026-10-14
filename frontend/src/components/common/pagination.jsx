import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Lightweight Pagination Component
 * 
 * @param {number} currentPage - Halaman aktif saat ini (1-indexed)
 * @param {number} totalPages - Total keseluruhan halaman
 * @param {number} totalItems - Total keseluruhan data dari backend/database
 * @param {number|string} itemsPerPage - Jumlah data per halaman (default 5, opsi hingga 100 atau 'all')
 * @param {function} onPageChange - Callback saat halaman berganti: (newPage) => void
 * @param {function} [onItemsPerPageChange] - Callback saat jumlah per halaman diubah: (newLimit) => void
 * @param {(number|string)[]} [pageSizeOptions=[5, 10, 25, 50, 100, 'Semua']] - Pilihan jumlah baris per halaman
 * @param {string} [itemLabel="Total Data"] - Label nama data (e.g. "Total Tamu")
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 5,
  onPageChange,
  onItemsPerPageChange,
  pageSizeOptions = [5, 10, 25, 50, 100, 'Semua'],
  prefixLabel = 'dari',
  itemLabel = 'Total Tamu',
  className = ''
}) => {
  const isAll = itemsPerPage === 'all' || itemsPerPage === 'semua' || itemsPerPage === 'Semua' || itemsPerPage >= 9999;
  const numericLimit = isAll ? (totalItems || 1000) : Number(itemsPerPage);

  const startIndex = totalItems === 0 ? 0 : isAll ? 1 : (currentPage - 1) * numericLimit + 1;
  const endIndex = isAll ? totalItems : Math.min(currentPage * numericLimit, totalItems);

  // Generate dynamic pagination items with ellipsis (...)
  const generatePaginationItems = (current, total) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const items = [];
    items.push(1);
    if (current <= 3) {
      items.push(2, 3);
      items.push('...');
      items.push(total);
    } else if (current >= total - 2) {
      items.push('...');
      items.push(total - 2, total - 1, total);
    } else {
      items.push('...');
      items.push(current - 1, current, current + 1);
      items.push('...');
      items.push(total);
    }
    return items;
  };

  const handleSelectChange = (e) => {
    if (!onItemsPerPageChange) return;
    const val = e.target.value;
    if (val === 'all' || val === 'semua' || val === 'Semua') {
      onItemsPerPageChange('Semua');
    } else {
      onItemsPerPageChange(Number(val));
    }
  };

  return (
    <div className={`bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs select-none ${className}`}>
      {/* Left: Cukup Menampilkan (pagination) dari (data) total Tamu */}
      <div className="flex items-center gap-1.5 text-slate-600 font-bold text-xs">
        <span>Menampilkan</span>
        {onItemsPerPageChange ? (
          <select
            value={isAll ? 'Semua' : itemsPerPage}
            onChange={handleSelectChange}
            className="bg-white border border-slate-200 text-slate-900 rounded-lg px-2.5 py-1 text-xs font-black focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all cursor-pointer shadow-2xs hover:border-slate-300"
            title="Pilih jumlah baris data per halaman (5 - 100, Semua)"
          >
            {pageSizeOptions.map((opt) => {
              const isOptAll = opt === 'all' || opt === 'semua' || opt === 'Semua';
              return (
                <option key={opt} value={isOptAll ? 'Semua' : opt}>
                  {isOptAll ? 'Semua' : opt}
                </option>
              );
            })}
          </select>
        ) : (
          <span className="text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs font-mono font-bold">
            {isAll ? 'Semua' : `${startIndex} - ${endIndex}`}
          </span>
        )}
        <span>{prefixLabel} <strong className="text-sky-700 font-black">{totalItems}</strong> {itemLabel}</span>
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage <= 1 || isAll}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </button>

        <div className="flex items-center gap-1">
          {generatePaginationItems(currentPage, totalPages).map((item, idx) => {
            if (item === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold text-slate-400"
                >
                  ...
                </span>
              );
            }
            const isCurrent = currentPage === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(Number(item))}
                disabled={isAll}
                className={`w-7 h-7 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-sky-600 text-white shadow-xs shadow-sky-600/30'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages || totalPages === 0 || isAll}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-extrabold text-slate-700 transition-colors shadow-2xs cursor-pointer"
        >
          <span className="hidden sm:inline">Selanjutnya</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
