const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcodeTerminal = require('qrcode-terminal');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

let sock = null;
let isConnected = false;
let isInitializing = false;
let latestQrBase64 = null;
let connectedUser = {
  phone: null,
  name: null,
  jid: null
};

const authFolder = path.resolve(__dirname, '../auth_info_baileys');

/**
 * Inisialisasi koneksi WhatsApp Bot via Baileys
 */
async function connectToWhatsApp() {
  if (isInitializing || isConnected) return;
  isInitializing = true;

  try {
    if (!fs.existsSync(authFolder)) {
      fs.mkdirSync(authFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authFolder);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['KSOP Si-Tamu Local Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n======================================================');
        console.log('📱 SCAN QR CODE BERIKUT DENGAN WHATSAPP HP ANDA:');
        console.log('   (Perangkat Tertaut / Linked Devices)');
        console.log('======================================================\n');
        qrcodeTerminal.generate(qr, { small: true });

        try {
          latestQrBase64 = await QRCode.toDataURL(qr);
        } catch (e) {
          console.error('[Local WA Bot] Error generating QR Data URL:', e);
        }
      }

      if (connection === 'close') {
        isConnected = false;
        isInitializing = false;
        latestQrBase64 = null;
        connectedUser = { phone: null, name: null, jid: null };

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[Local WA Bot] Koneksi terputus. Status: ${statusCode}. Reconnecting: ${shouldReconnect}`);

        if (shouldReconnect) {
          setTimeout(() => {
            connectToWhatsApp();
          }, 3000);
        } else {
          console.log('[Local WA Bot] Session logged out. Menghapus folder auth_info_baileys...');
          try {
            fs.rmSync(authFolder, { recursive: true, force: true });
          } catch (e) {}
          setTimeout(() => {
            connectToWhatsApp();
          }, 5000);
        }
      } else if (connection === 'open') {
        isConnected = true;
        isInitializing = false;
        latestQrBase64 = null;

        if (sock.user) {
          const userJid = sock.user.id || '';
          const cleanPhone = userJid.split(':')[0].replace(/[^0-9]/g, '');
          connectedUser = {
            phone: cleanPhone,
            name: sock.user.name || sock.user.notify || 'WA Bot KSOP',
            jid: userJid
          };
        }

        console.log('\n======================================================');
        console.log('✅ Local WA Bot (Baileys) TERHUBUNG & SIAP DIGUNAKAN!');
        console.log(`   Nomor Terhubung: +${connectedUser.phone} (${connectedUser.name})`);
        console.log('   Notifikasi presensi tamu akan dikirim dari nomor ini.');
        console.log('======================================================\n');
      }
    });
  } catch (err) {
    console.error('[Local WA Bot Error]:', err);
    isInitializing = false;
  }
}

/**
 * Mengirim pesan teks via Local WA Bot
 */
async function sendTextMessage(targetNoHp, textMessage) {
  if (!sock || !isConnected) {
    console.log('[Local WA Bot] Belum terhubung ke WhatsApp. Mencoba inisialisasi ulang...');
    connectToWhatsApp();
    return { success: false, message: 'Bot belum terhubung. Silakan scan QR code di dashboard.' };
  }

  try {
    let cleanNumber = targetNoHp.replace(/[^0-9]/g, '');
    if (cleanNumber.startsWith('0')) {
      cleanNumber = '62' + cleanNumber.substring(1);
    }

    const jid = `${cleanNumber}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: textMessage });
    console.log(`[Local WA Bot Success] Pesan terkirim ke: ${cleanNumber}`);
    return { success: true };
  } catch (error) {
    console.error('[Local WA Bot Send Error]:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Memutuskan koneksi bot & menghapus sesi
 */
async function disconnectWhatsApp() {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch (e) {
    console.error('[Local WA Bot] Error logging out sock:', e);
  }
  
  isConnected = false;
  latestQrBase64 = null;
  connectedUser = { phone: null, name: null, jid: null };

  try {
    if (fs.existsSync(authFolder)) {
      fs.rmSync(authFolder, { recursive: true, force: true });
    }
  } catch (e) {}

  setTimeout(() => {
    connectToWhatsApp();
  }, 2000);

  return { success: true, message: 'Bot berhasil diputuskan' };
}

function getBotStatus() {
  return {
    isConnected,
    isInitializing,
    qr: latestQrBase64,
    connectedUser
  };
}

module.exports = {
  connectToWhatsApp,
  sendTextMessage,
  disconnectWhatsApp,
  getBotStatus
};
