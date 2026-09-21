const { sequelize } = require('../config/database');
const Tamu = require('./Tamu');
const MasterTujuan = require('./MasterTujuan');
const MasterKategoriAsal = require('./MasterKategoriAsal');
const User = require('./User');
const ActivityLog = require('./ActivityLog');
const WaTemplate = require('./WaTemplate');

// Foreign Key Associations for Relational MySQL ERD Diagram
MasterTujuan.hasMany(Tamu, { foreignKey: 'tujuan_id' });
Tamu.belongsTo(MasterTujuan, { foreignKey: 'tujuan_id' });

MasterKategoriAsal.hasMany(Tamu, { foreignKey: 'kategori_asal_id' });
Tamu.belongsTo(MasterKategoriAsal, { foreignKey: 'kategori_asal_id' });

User.hasMany(Tamu, { foreignKey: 'user_id' });
Tamu.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ActivityLog, { foreignKey: 'user_id' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

const ensureTableColumnsIntegrity = async () => {
  try {
    // 1. Check and alter master_tujuan table
    const [colsTujuan] = await sequelize.query("SHOW COLUMNS FROM `master_tujuan`");
    const existingColsTujuan = colsTujuan.map(c => c.Field);

    if (!existingColsTujuan.includes('nama_pejabat')) {
      await sequelize.query("ALTER TABLE `master_tujuan` ADD COLUMN `nama_pejabat` VARCHAR(255) NULL AFTER `nama_tujuan`");
      console.log('✅ Column nama_pejabat added to master_tujuan');
    }
    if (!existingColsTujuan.includes('no_hp')) {
      await sequelize.query("ALTER TABLE `master_tujuan` ADD COLUMN `no_hp` VARCHAR(255) NULL AFTER `nama_pejabat`");
      console.log('✅ Column no_hp added to master_tujuan');
    }

    // 2. Check and alter master_kategori_asal table
    const [colsKategori] = await sequelize.query("SHOW COLUMNS FROM `master_kategori_asal`");
    const existingColsKategori = colsKategori.map(c => c.Field);

    if (!existingColsKategori.includes('butuh_instansi')) {
      await sequelize.query("ALTER TABLE `master_kategori_asal` ADD COLUMN `butuh_instansi` TINYINT(1) DEFAULT 1 AFTER `nama_kategori`");
      console.log('✅ Column butuh_instansi added to master_kategori_asal');
    }

    // 3. Check and alter tamu table
    const [colsTamu] = await sequelize.query("SHOW COLUMNS FROM `tamu`");
    const existingColsTamu = colsTamu.map(c => c.Field);

    if (!existingColsTamu.includes('tujuan_id')) {
      await sequelize.query("ALTER TABLE `tamu` ADD COLUMN `tujuan_id` INT NULL AFTER `bertemu`");
      console.log('✅ Column tujuan_id added to tamu');
    }
    if (!existingColsTamu.includes('kategori_asal_id')) {
      await sequelize.query("ALTER TABLE `tamu` ADD COLUMN `kategori_asal_id` INT NULL AFTER `kategori_asal`");
      console.log('✅ Column kategori_asal_id added to tamu');
    }
    if (!existingColsTamu.includes('tanggal_keluar')) {
      await sequelize.query("ALTER TABLE `tamu` ADD COLUMN `tanggal_keluar` VARCHAR(255) NULL");
      console.log('✅ Column tanggal_keluar added to tamu');
    }
    if (!existingColsTamu.includes('jam_keluar')) {
      await sequelize.query("ALTER TABLE `tamu` ADD COLUMN `jam_keluar` VARCHAR(255) NULL");
      console.log('✅ Column jam_keluar added to tamu');
    }

    // 4. Ensure wa_templates table exists
    await WaTemplate.sync();
    console.log('✅ Table wa_templates synced successfully');
  } catch (err) {
    console.error('Error ensuring table columns integrity:', err.message);
  }
};

const seedInitialData = async () => {
  try {
    // Ensure table columns exist before seeding/querying
    await ensureTableColumnsIntegrity();

    // Seed default admin user
    const userCount = await User.count();
    if (userCount === 0) {
      await User.create({
        username: 'admin',
        password: 'admin',
        nama: 'Administrator Super',
        role: 'admin'
      });
      console.log('Seeded Initial Admin User (admin / admin)');
    }

    const tujuanCount = await MasterTujuan.count();
    if (tujuanCount === 0) {
      await MasterTujuan.bulkCreate([
        { nama_tujuan: 'Kepala Kantor' },
        { nama_tujuan: 'Seksi Keselamatan Berlayar' },
        { nama_tujuan: 'Seksi Status Hukum dan Sertifikasi' },
        { nama_tujuan: 'Seksi KBPP' },
        { nama_tujuan: 'Sub Bagian Tata Usaha' },
        { nama_tujuan: 'Petugas Pelayanan / Front Office' }
      ]);
      console.log('Seeded Master Tujuan');
    }

    const kategoriAsalCount = await MasterKategoriAsal.count();
    if (kategoriAsalCount === 0) {
      await MasterKategoriAsal.bulkCreate([
        { nama_kategori: 'Instansi / Dinas', butuh_instansi: true },
        { nama_kategori: 'Masyarakat Umum', butuh_instansi: false },
        { nama_kategori: 'Perusahaan / Swasta', butuh_instansi: true },
        { nama_kategori: 'Lainnya', butuh_instansi: true }
      ]);
      console.log('Seeded Master Kategori Asal');
    }

    // Seed dummy tamu if empty
    const tamuCount = await Tamu.count();
    if (tamuCount === 0) {
      const today = new Date().toISOString().split('T')[0];
      await Tamu.create({
        no_reg: 'REG-' + Date.now().toString().slice(-6),
        nama: 'Budi Santoso',
        no_telpon: '081234567890',
        kategori_asal: 'Instansi / Dinas',
        asal_instansi: 'PT. Maritime Logistics',
        jenis_kelamin: 'Laki-laki',
        alamat: 'Jl. Pelabuhan No. 45, Surabaya',
        bertemu: 'Seksi Keselamatan Berlayar',
        keperluan: 'Pengurusan Surat Clearance',
        foto: null,
        tanggal: today,
        jam: '09:15:00',
        status: 'Berkunjung'
      });

      console.log('Seeded Initial Tamu');
    }
  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

module.exports = {
  sequelize,
  Tamu,
  MasterTujuan,
  MasterKategoriAsal,
  User,
  ActivityLog,
  WaTemplate,
  seedInitialData,
  ensureTableColumnsIntegrity
};
