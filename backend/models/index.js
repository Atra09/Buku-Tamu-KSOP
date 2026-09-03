const { sequelize } = require('../config/database');
const Tamu = require('./Tamu');
const MasterTujuan = require('./MasterTujuan');
const MasterKeperluan = require('./MasterKeperluan');
const User = require('./User');

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

    const keperluanCount = await MasterKeperluan.count();
    if (keperluanCount === 0) {
      await MasterKeperluan.bulkCreate([
        { nama_keperluan: 'Konsultasi Perizinan / Dokumen' },
        { nama_keperluan: 'Pengurusan Surat Clearance' },
        { nama_keperluan: 'Permohonan Sertifikat' },
        { nama_keperluan: 'Kunjungan Kerja / Audien' },
        { nama_keperluan: 'Penyerahan Surat / Berkas' },
        { nama_keperluan: 'Lainnya' }
      ]);
      console.log('Seeded Master Keperluan');
    }

    // Seed dummy tamu if empty
    const tamuCount = await Tamu.count();
    if (tamuCount === 0) {
      const today = new Date().toISOString().split('T')[0];
      await Tamu.create({
        no_reg: 'REG-' + Date.now().toString().slice(-6),
        nama: 'Budi Santoso',
        no_telpon: '081234567890',
        kategori_asal: 'Instansi',
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
  MasterKeperluan,
  User,
  seedInitialData
};
