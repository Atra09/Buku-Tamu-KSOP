/**
 * Single Source of Truth Template Notifikasi WhatsApp Bawaan (Default Sistem)
 */
const DEFAULT_WA_TEMPLATE = `🔔 *NOTIFIKASI KUNJUNGAN TAMU KSOP*

Yth. *{nama_pejabat}* ({tujuan_tamu}),

Diberitahukan bahwa telah hadir tamu *{nama_tamu}* dari *{asal_instansi}* pada tanggal *{waktu}* dengan kepentingan:
*{keperluan_tamu}*

_Terima kasih._
> Pesan Ini Dikirim Otomatis Oleh Web Si Tamu`;

/**
 * Merender pesan teks WhatsApp dari template dengan menggantikan placeholder dinamis.
 * Mendukung alias tag dan case-insensitive.
 * 
 * @param {string} template - String template teks
 * @param {object} data - Object berisi variabel data tamu
 * @returns {string} String pesan akhir yang sudah terisi data
 */
const renderWaTemplate = (template, data = {}) => {
  let text = (template && typeof template === 'string' && template.trim())
    ? template
    : DEFAULT_WA_TEMPLATE;

  const {
    nama_pejabat = '',
    tujuan_tamu = '',
    nama_tujuan = '',
    nama_tamu = '',
    WA_tamu = '',
    no_wa = '',
    no_telepon = '',
    no_telpon = '',
    asal_instansi = '',
    waktu = '',
    keperluan_tamu = '',
    keperluan = ''
  } = data;

  const valPejabat = nama_pejabat || '';
  const valTujuan = tujuan_tamu || nama_tujuan || '';
  const valTamu = nama_tamu || '';
  const valWa = WA_tamu || no_wa || no_telepon || no_telpon || '';
  const valInstansi = asal_instansi || '';
  const valWaktu = waktu || '';
  const valKeperluan = keperluan_tamu || keperluan || '';

  return text
    .replace(/{nama_pejabat}/gi, valPejabat)
    .replace(/{tujuan_tamu}/gi, valTujuan)
    .replace(/{nama_tujuan}/gi, valTujuan)
    .replace(/{nama_tamu}/gi, valTamu)
    .replace(/{WA_tamu}/gi, valWa)
    .replace(/{no_wa}/gi, valWa)
    .replace(/{no_telepon}/gi, valWa)
    .replace(/{no_telpon}/gi, valWa)
    .replace(/{asal_instansi}/gi, valInstansi)
    .replace(/{waktu}/gi, valWaktu)
    .replace(/{keperluan_tamu}/gi, valKeperluan)
    .replace(/{keperluan}/gi, valKeperluan);
};

module.exports = {
  DEFAULT_WA_TEMPLATE,
  renderWaTemplate
};
