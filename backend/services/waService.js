const localWaBot = require('./localWaBot');

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

    // Format nomor telepon menjadi format internasional (misal 628123456789)
    let cleanNumber = targetNoHp.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    }

    const namaTujuanStr = guest.bertemu || 'Pejabat / Staf Tujuan';
    const namaPejabatStr = namaPejabat ? `${namaPejabat}` : `Bpk/Ibu ${namaTujuanStr}`;
    
    const asalStr = (guest.asal_instansi && guest.kategori_asal && guest.asal_instansi.trim().toLowerCase() !== guest.kategori_asal.trim().toLowerCase())
      ? `${guest.asal_instansi} (${guest.kategori_asal})`
      : (guest.asal_instansi || guest.kategori_asal || '-');

    // Format tanggal dan jam formal (contoh: 10 September 2026 pukul 13.15 WIB)
    let formattedWaktu = `${guest.tanggal || '-'} pukul ${guest.jam ? guest.jam.substring(0, 5) : '-'} WIB`;
    if (guest.tanggal) {
      try {
        const parts = guest.tanggal.split('-');
        if (parts.length === 3) {
          const bulanNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
          const bIndex = parseInt(parts[1], 10) - 1;
          if (bIndex >= 0 && bIndex < 12) {
            const jamStr = guest.jam ? guest.jam.substring(0, 5) : '-';
            formattedWaktu = `${parseInt(parts[2], 10)} ${bulanNames[bIndex]} ${parts[0]} pukul ${jamStr} WIB`;
          }
        }
      } catch (e) {}
    }

    // Trim spasi di awal & akhir agar format bold (*) WhatsApp tidak gagal akibat spasi tersembunyi
    const cleanKeperluan = guest.keperluan ? guest.keperluan.toString().trim() : '-';
    const cleanNama = guest.nama ? guest.nama.toString().trim() : '-';

    const waMessageText = `🔔 *NOTIFIKASI KUNJUNGAN TAMU KSOP*

Yth. *${namaPejabatStr}* (${namaTujuanStr}),

Diberitahukan bahwa telah hadir tamu *${cleanNama}* dari *${asalStr}* pada tanggal *${formattedWaktu}* dengan kepentingan:
*${cleanKeperluan}*

_Terima kasih._
> Pesan Ini Dikirim Otomatis Oleh Web Si Tamu`;

    // pengiriman via Local baileys
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
