/**
 * Helper Terpusat Waktu WIB (UTC+7 Asia/Jakarta) & Format Tanggal Indonesia
 * Menghilangkan duplikasi fungsi parsing tanggal dan nama bulan di seluruh backend.
 */

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Mengambil detail komponen tanggal & jam saat ini dalam zona waktu Asia/Jakarta (WIB)
 * @param {Date} [d=new Date()]
 * @returns {{ tanggal: string, jam: string, year: string, month: string, day: string, dateStr: string, yy: string, hh: string, min: string, ss: string }}
 */
const getWIBNow = (d = new Date()) => {
  const tanggal = d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });
  const jam = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour12: false });
  const [year, month, day] = tanggal.split('-');
  const [hh, min, ss] = jam.split(':');

  return {
    tanggal,
    jam,
    year,
    month,
    day,
    dateStr: `${year}${month}${day}`,
    yy: year.slice(-2),
    hh,
    min,
    ss
  };
};

/**
 * Format tanggal dan jam formal Indonesia (e.g. "14 Oktober 2026 pukul 13:15 WIB")
 * @param {string} tanggal - Format YYYY-MM-DD
 * @param {string} [jam] - Format HH:MM atau HH:MM:SS
 * @returns {string}
 */
const formatWaktuWib = (tanggal, jam) => {
  const jamFormatted = jam ? jam.substring(0, 5) : '-';
  if (!tanggal) return `- pukul ${jamFormatted} WIB`;

  try {
    const parts = tanggal.split('-');
    if (parts.length === 3) {
      const bIndex = parseInt(parts[1], 10) - 1;
      if (bIndex >= 0 && bIndex < 12) {
        return `${parseInt(parts[2], 10)} ${BULAN_NAMES[bIndex]} ${parts[0]} pukul ${jamFormatted} WIB`;
      }
    }
  } catch (e) {}

  return `${tanggal} pukul ${jamFormatted} WIB`;
};

/**
 * Format tanggal Indonesia ringkas (e.g. "14 Oktober 2026")
 * @param {string} tanggal - Format YYYY-MM-DD
 * @returns {string}
 */
const formatTanggalIndo = (tanggal) => {
  if (!tanggal) return '-';
  try {
    const parts = tanggal.split('-');
    if (parts.length === 3) {
      const bIndex = parseInt(parts[1], 10) - 1;
      if (bIndex >= 0 && bIndex < 12) {
        return `${parseInt(parts[2], 10)} ${BULAN_NAMES[bIndex]} ${parts[0]}`;
      }
    }
  } catch (e) {}
  return tanggal;
};

module.exports = {
  BULAN_NAMES,
  getWIBNow,
  formatWaktuWib,
  formatTanggalIndo
};
