const { sequelize } = require('../config/database');
const Tamu = require('./Tamu');
const MasterTujuan = require('./MasterTujuan');
const MasterKategoriAsal = require('./MasterKategoriAsal');
const User = require('./User');
const ActivityLog = require('./ActivityLog');

// Foreign Key Associations for Relational MySQL ERD Diagram
MasterTujuan.hasMany(Tamu, { foreignKey: 'tujuan_id' });
Tamu.belongsTo(MasterTujuan, { foreignKey: 'tujuan_id' });

MasterKategoriAsal.hasMany(Tamu, { foreignKey: 'kategori_asal_id' });
Tamu.belongsTo(MasterKategoriAsal, { foreignKey: 'kategori_asal_id' });

User.hasMany(Tamu, { foreignKey: 'user_id' });
Tamu.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ActivityLog, { foreignKey: 'user_id' });
ActivityLog.belongsTo(User, { foreignKey: 'user_id' });

const seedInitialData = async () => {
  try {
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
  seedInitialData
};
