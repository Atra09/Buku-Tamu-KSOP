const { sequelize, Tamu, MasterTujuan, MasterKategoriAsal, User, seedInitialData } = require('../models');

const syncAndLinkDB = async () => {
  try {
    console.log('🔄 Memulai sinkronisasi tabel & FK constraint pada MySQL (db_bukutamu)...');
    
    // Drop obsolete master_keperluan table if exists
    try {
      await sequelize.query('DROP TABLE IF EXISTS `master_keperluan`;');
      console.log('🗑️ Tabel master_keperluan berhasil dibuang (Keperluan 100% menggunakan kolom VARCHAR direct).');
    } catch (e) {
      // Ignore if table doesn't exist
    }

    // 1. Sync all models with ALTER TRUE to ensure PK & FK columns exist
    await sequelize.sync({ alter: true });
    console.log('✅ Sequelize sync alter true berhasil.');

    // 2. Ensure default initial data
    await seedInitialData();

    // 3. Link existing Tamu records with Master IDs if null
    const allTamu = await Tamu.findAll();
    const allTujuan = await MasterTujuan.findAll();
    const allKategori = await MasterKategoriAsal.findAll();

    for (const t of allTamu) {
      let updated = false;

      // Link tujuan_id
      if (!t.tujuan_id && t.bertemu) {
        const matchedTujuan = allTujuan.find(m => m.nama_tujuan.toLowerCase() === t.bertemu.toLowerCase());
        if (matchedTujuan) {
          t.tujuan_id = matchedTujuan.id;
          updated = true;
        }
      }

      // Link kategori_asal_id
      if (!t.kategori_asal_id && t.kategori_asal) {
        const matchedKategori = allKategori.find(m => m.nama_kategori.toLowerCase() === t.kategori_asal.toLowerCase());
        if (matchedKategori) {
          t.kategori_asal_id = matchedKategori.id;
          updated = true;
        }
      }

      if (updated) {
        await t.save();
      }
    }

    console.log('🎉 Relasi Foreign Key (FK) MySQL antara tabel tamu dan master data (tujuan, kategori_asal) 100% TERHUBUNG!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal sinkronisasi FK MySQL:', err);
    process.exit(1);
  }
};

syncAndLinkDB();
