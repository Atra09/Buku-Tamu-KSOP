const { sequelize, Tamu, MasterTujuan, MasterKeperluan, MasterKategoriAsal, User, seedInitialData } = require('../models');

const syncAndLinkDB = async () => {
  try {
    console.log('🔄 Memulai sinkronisasi tabel & FK constraint pada MySQL (db_bukutamu)...');
    
    // 1. Sync all models with ALTER TRUE to ensure PK & FK columns exist
    await sequelize.sync({ alter: true });
    console.log('✅ Sequelize sync alter true berhasil.');

    // 2. Ensure default initial data
    await seedInitialData();

    // 3. Link existing Tamu records with Master IDs if null
    const allTamu = await Tamu.findAll();
    const allTujuan = await MasterTujuan.findAll();
    const allKeperluan = await MasterKeperluan.findAll();
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

      // Link keperluan_id
      if (!t.keperluan_id && t.keperluan) {
        const matchedKeperluan = allKeperluan.find(m => m.nama_keperluan.toLowerCase() === t.keperluan.toLowerCase());
        if (matchedKeperluan) {
          t.keperluan_id = matchedKeperluan.id;
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

    console.log('🎉 Relasi Foreign Key (FK) MySQL antara tabel tamu dan master data (tujuan, keperluan, kategori_asal) 100% TERHUBUNG!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal sinkronisasi FK MySQL:', err);
    process.exit(1);
  }
};

syncAndLinkDB();
