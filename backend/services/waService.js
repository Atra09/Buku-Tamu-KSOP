const localWaBot = require('./localWaBot');
const { WaTemplate } = require('../models');
const { DEFAULT_WA_TEMPLATE, renderWaTemplate } = require('../utils/waTemplateHelper');
const { formatWaktuWib } = require('../utils/timeHelper');

/**
 * Mengambil template pesan aktif dari database (atau fallback ke default sistem)
 */
const getActiveTemplateText = async () => {
  try {
    const active = await WaTemplate.findOne({ where: { is_active: true } });
    if (active?.isi_pesan?.trim()) {
      return active.isi_pesan;
    }
  } catch (err) {
    console.error('[WA Service] Gagal memuat template aktif, fallback ke default:', err.message);
  }
  return DEFAULT_WA_TEMPLATE;
};

/**
 * Service untuk mengirim notifikasi pesan WhatsApp ke Pejabat Tujuan secara otomatis
 * Menggunakan Local WA Bot (Baileys) - 100% Bebas, Tanpa Watermark, Tanpa Limit.
 */
exports.sendWANotification = async ({ targetNoHp, namaPejabat, guest }) => {
  try {
    if (!targetNoHp) {
      console.log('[WA Service] Nomor HP tujuan tidak tersedia, melewati pengiriman WA.');
      return { success: false, message: 'Nomor HP tujuan kosong' };
    }

    // Format nomor telepon menjadi format internasional (e.g. 628123456789)
    let cleanNumber = targetNoHp.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    }

    const namaTujuanStr = guest.bertemu || 'Pejabat / Staf Tujuan';
    const namaPejabatStr = namaPejabat ? `${namaPejabat}` : `Bpk/Ibu ${namaTujuanStr}`;

    const asalStr = (guest.asal_instansi && guest.kategori_asal && guest.asal_instansi.trim().toLowerCase() !== guest.kategori_asal.trim().toLowerCase())
      ? `${guest.asal_instansi} (${guest.kategori_asal})`
      : (guest.asal_instansi || guest.kategori_asal || '-');

    const formattedWaktu = formatWaktuWib(guest.tanggal, guest.jam);
    const cleanKeperluan = guest.keperluan ? guest.keperluan.toString().trim() : '-';
    const cleanNama = guest.nama ? guest.nama.toString().trim() : '-';
    const cleanNoWa = (guest.no_telpon || guest.no_telepon || guest.no_hp || '-').toString().trim();

    // Dapatkan template aktif & render teks pesan dengan Single Source of Truth helper
    const templateToUse = await getActiveTemplateText();
    const waMessageText = renderWaTemplate(templateToUse, {
      nama_pejabat: namaPejabatStr,
      tujuan_tamu: namaTujuanStr,
      nama_tamu: cleanNama,
      WA_tamu: cleanNoWa,
      asal_instansi: asalStr,
      waktu: formattedWaktu,
      keperluan_tamu: cleanKeperluan
    });

    // Kirim via Local Bot Baileys jika terhubung
    if (localWaBot.getBotStatus().isConnected) {
      console.log(`[Local WA Bot] Mengirim pesan otomatis ke: ${cleanNumber}...`);
      const botRes = await localWaBot.sendTextMessage(cleanNumber, waMessageText);
      if (botRes.success) {
        return botRes;
      }
    }

    console.log('\n======================================================');
    console.log('[WA Service Warning]: Local WA Bot belum terhubung!');
    console.log('Silakan sambungkan WA Bot via Dashboard Admin (Menu: WA Bot Notifikasi)');
    console.log(`[Simulasi Pesan] Penerima: ${cleanNumber} (${namaPejabatStr})`);
    console.log('======================================================\n');
    return { success: false, isSimulated: true, message: 'Local WA Bot belum terhubung. Sambungkan via Dashboard Admin.' };
  } catch (error) {
    console.error('[WA Service Error]:', error.message || error);
    return { success: false, error: error.message };
  }
};
