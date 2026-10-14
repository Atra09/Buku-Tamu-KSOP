Listed directory routes
Listed directory controllers
Listed directory services
Listed directory middleware
Listed directory models
Listed directory utils
Listed directory src
Listed directory pages
Listed directory components
Viewed app.js:1-98
Viewed api.js:1-27
Viewed bot.js:1-42
Viewed jwt.js:1-60
Viewed authorization.js:1-100
Viewed rateLimiter.js:1-56
Viewed upload.js:1-70
Viewed storageService.js:1-60
Viewed storageService.js:58-166
Viewed tamuService.js:1-130
Viewed tamuService.js:270-350
Viewed tamuService.js:350-450
Viewed tamuService.js:450-550
Viewed authController.js:1-150
Viewed authController.js:120-180
Viewed auth.js:1-15
Viewed userController.js:1-100
Viewed user.js:1-14
Viewed qrController.js:1-100
Viewed qrController.js:150-276
Viewed qr.js:1-14
Searched for "/qr/revoke"
Viewed index.js:1-100
Viewed activityController.js:1-60
Viewed activityController.js:80-132
Viewed masterController.js:1-100
Viewed Tamu.js:1-60
Viewed App.jsx:1-100
Viewed App.jsx:100-250
Viewed session.js:1-100
Listed directory api
Searched for "axios.defaults"
Viewed main.jsx:1-50
Viewed App.jsx:240-330
Viewed jadwalController.js:1-60
Viewed waTemplateController.js:1-60
Viewed localWaBot.js:1-100
Viewed localWaBot.js:100-193
Viewed waService.js:1-100
Viewed DaftarKunjungan.jsx:1-100
Viewed DaftarKunjungan.jsx:130-200
Viewed UserManagement.jsx:1-80
Viewed userController.js:140-186
Viewed ProfilePage.jsx:1-100
Viewed UserProfileModal.jsx:1-100
Viewed AuthContext.jsx:1-100
Viewed DashboardAdmin.jsx:1-100
Viewed KategoriAsal.jsx:1-60
Viewed search.jsx:1-5
Viewed PublicKsop.jsx:1-150
Viewed .env:1-6

Berikut adalah hasil **analisis mendalam dan menyeluruh** terhadap seluruh basis kode di folder `backend` dan `frontend`. Analisis ini mencakup aspek **kerentanan keamanan (security vulnerabilities)**, **duplikasi kode**, **spaghetti code / architectural smells**, serta **solusi profesional jangka panjangnya**.

---

## I. Temuan Kerentanan Keamanan (Security Vulnerabilities)

### 1. 🔴 Kritis: IDOR & Akun Takeover pada `updateProfile` ([authController.js](file:///d:/Magang/App/Buku-Tamu-KSOP/backend/controllers/authController.js#L144-L165)) - [STATUS: ✅ RESOLVED]
- **Lokasi Kode**:
  ```javascript
  // backend/controllers/authController.js
  const { userId, nama, username, password } = req.body;
  const targetId = userId || req.body.id;

  let user;
  if (targetId) {
    user = await User.findByPk(targetId);
  }
  ...
  if (!user) {
    user = await User.findOne(); // ⚠️ Mengambil user pertama (Admin ID 1) jika targetId tidak dikirim!
  }
  ```
- **Bahaya / Dampak**:
  Rute `PUT /api/auth/profile` dapat diakses oleh user mana pun yang memiliki token login (`userAuth`). Karena controller membaca `targetId` dari `req.body.userId` (bukan dari `req.user.id`), **user dengan hak akses terendah dapat mengirim `userId: 1` beserta password baru untuk mengambil alih akun Super Admin!** Bahkan jika body dikosongkan, fallback `User.findOne()` otomatis mengedit akun pertama di database (Admin).
- **Solusi Jangka Panjang**:
  Terapkan prinsip *Least Privilege*: Non-admin **hanya boleh** mengedit profil miliknya sendiri yang didapat dari `req.user.id`. Jika admin ingin mengedit user lain, harus melalui rute tersendiri (`PUT /api/users/:id`). Selain itu, user dengan role `koordinator` atau `user` (userbiasa) tidak boleh mengubah nama dan username mereka sendiri (hanya admin yang dapat mengedit nama & username).
  ```javascript
  // Solusi: Kunci targetId ke req.user.id & batasi nama/username hanya untuk admin
  const targetId = req.user.id;
  const user = await User.findByPk(targetId);
  if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
  ```

---

### 2. 🟠 Tinggi: Race Condition & Overwrite File Foto pada Upload Konkuren ([storageService.js](file:///d:/Magang/App/Buku-Tamu-KSOP/backend/services/storageService.js#L44-L46) & [upload.js](file:///d:/Magang/App/Buku-Tamu-KSOP/backend/middleware/upload.js#L24)) - [STATUS: ✅ RESOLVED]
- **Lokasi Kode**:
  ```javascript
  // Penamaan file hanya berbasis format detik:
  const fileName = `${wibNow.yy}-${wibNow.month}-${wibNow.day}_${wibNow.hh}.${wibNow.min}.${wibNow.ss}${fileExt}`;
  ```
- **Bahaya / Dampak**:
  Jika ada dua tamu yang menekan tombol submit pada detik yang sama (misal di jam sibuk pos jaga `11.45.20`), kedua file foto akan memiliki nama yang persis sama: `26-10-14_11.45.20.jpg`. File kedua akan menimpa (*overwrite*) file foto tamu pertama di *disk*, sehingga foto tamu pertama hilang dan kedua tamu memiliki foto yang sama di riwayat kunjungan.
- **Solusi Jangka Panjang**:
  Tambahkan entropi acak kriptografis (misal 4 byte hex dari `crypto.randomBytes(4).toString('hex')` atau `nanoid`):
  ```javascript
  const randomSuffix = crypto.randomBytes(3).toString('hex');
  const fileName = `${wibNow.yy}-${wibNow.month}-${wibNow.day}_${wibNow.hh}.${wibNow.min}.${wibNow.ss}_${randomSuffix}${fileExt}`;
  ```

---

### 3. 🟠 Tinggi: Ketiadaan Guard Self-Deletion & Last-Admin Protection ([userController.js](file:///d:/Magang/App/Buku-Tamu-KSOP/backend/controllers/userController.js#L160-L171)) - [STATUS: ✅ RESOLVED]
- **Lokasi Kode**:
  Pada fungsi `deleteUser`, server langsung menjalankan `user.destroy()` tanpa memeriksa:
  1. Apakah admin yang sedang login menghapus akunnya sendiri? (`req.user.id === user.id`)
  2. Apakah user yang dihapus merupakan satu-satunya admin tersisa di sistem?
- **Bahaya / Dampak**:
  Admin dapat secara tidak sengaja menghapus dirinya sendiri atau menghapus admin terakhir, mengakibatkan **Permanent Administrative Lockout** (sistem kehilangan admin dan tidak ada yang bisa mengelola user lagi).
- **Solusi Jangka Panjang**:
  Tambahkan guard validasi di `userController.js`:
  ```javascript
  if (req.user.id === user.id) {
    return res.status(400).json({ success: false, message: 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif.' });
  }
  if (user.role === 'admin') {
    const adminCount = await User.count({ where: { role: 'admin' } });
    if (adminCount <= 1) {
      return res.status(400).json({ success: false, message: 'Tidak dapat menghapus Admin terakhir di sistem.' });
    }
  }
  ```

---

### 4. 🟡 Sedang: Permissive CORS Default ([app.js](file:///d:/Magang/App/Buku-Tamu-KSOP/backend/app.js#L20-L27))
- **Lokasi Kode**:
  ```javascript
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : true; // ⚠️ Mengizinkan semua origin eksternal dengan credentials: true
  ```
- **Bahaya / Dampak**:
  Jika variabel `CORS_ORIGIN` lupa didefinisikan di file `.env` produksi, konfigurasi ini membuat server menerima request dari domain website manapun.
- **Solusi Jangka Panjang**:
  Berikan whitelist origin eksplisit (default ke localhost port frontend atau domain kantor KSOP), jangan biarkan `true` saat mode produksi.

---

## II. Temuan Spaghetti Code & Architectural Smells

### 1. ⚠️ Paginasi Semu (Fake Client-Side Pagination) di [DaftarKunjungan.jsx](file:///d:/Magang/App/Buku-Tamu-KSOP/frontend/src/pages/DaftarKunjungan.jsx#L57-L77)
- **Masalah**:
  Backend [tamuService.js](file:///d:/Magang/App/Buku-Tamu-KSOP/backend/services/tamuService.js#L72) membatasi data tamu dengan `limit: 50`.
  Namun di `DaftarKunjungan.jsx`, pemanggilan API `axios.get('/api/tamu')` tidak mengirim parameter `page` atau `offset`. Frontend kemudian membagi data tersebut 5 data per halaman (`tamuList.slice(...)`).
- **Dampak Buruk**:
  Jika dalam 1 bulan terdapat 200 kunjungan tamu, admin **hanya bisa melihat 50 tamu pertama** (halaman 1–10). Tamu ke-51 sampai ke-200 tidak akan pernah bisa diakses karena terpotong oleh batasan query backend (*Data Truncation*).
- **Solusi Jangka Panjang**:
  Terapkan **Server-Side Pagination murni**:
  Kirim `limit` dan `offset` dari state `currentPage` di frontend ke endpoint `/api/tamu?limit=10&offset=0`, dan gunakan `total` dari respons server untuk menghitung `totalPages`.

---

### 2. ⚠️ Inefisiensi Query N+1 pada Log Aktivitas ([activityController.js](file:///d:/Magang/App/Buku-Tamu-KSOP/backend/controllers/activityController.js#L31-L41)) - [STATUS: ✅ RESOLVED]
- **Masalah**:
  Pada `GET /api/logs`, controller sudah melakukan `findAndCountAll` dengan relasi `include: [{ model: User }]`. Namun setelah itu, controller memanggil `User.findAll()` untuk mengambil seluruh user di database lalu memetakannya secara manual di JavaScript.
- **Dampak Buruk**:
  Pada log yang banyak, ini membebani memori server Node.js dan I/O database secara sia-sia.
- **Solusi Jangka Panjang**:
  Cukup andalkan relasi Sequelize `ActivityLog.belongsTo(User, { foreignKey: 'user_id' })` yang sudah di-join langsung di query SQL. (Sudah diimplementasikan: `User.findAll()` dihapus total, hanya mengandalkan relasi join SQL tunggal).

---

### 3. ⚠️ Ad-Hoc Axios Calls & Folder API Kosong ([frontend/src/api](file:///d:/Magang/App/Buku-Tamu-KSOP/frontend/src/api))
- **Masalah**:
  Folder `frontend/src/api` dibiarkan kosong, sementara pemanggilan `axios.get()`, `axios.post()`, dan `axios.put()` tersebar secara mentah di dalam 11 komponen halaman yang berbeda.
- **Solusi Jangka Panjang**:
  Buat service layer di frontend (misal `tamuApi.js`, `authApi.js`, `masterApi.js`) sehingga bila ada perubahan URL rute atau penambahan header, perubahan hanya dilakukan di satu tempat (DRY - *Don't Repeat Yourself*).

---

## III. Temuan Duplikasi Kode (Code Duplication) - [STATUS: ✅ ALL RESOLVED]

| Area Duplikasi | Lokasi File | Deskripsi & Solusi | Status |
| :--- | :--- | :--- | :--- |
| **Header `x-user-nama` Manual** | Seluruh Komponen Frontend | Tiap komponen membuat fungsi lokal `getAuthHeaders()` secara berulang untuk menyematkan `x-user-nama`. Padahal backend sudah mengekstrak aktor dari JWT `req.user.nama`. | **✅ RESOLVED** (Header manual `x-user-nama` dihapus dari seluruh file frontend) |
| **Modal Konfirmasi Status Tamu** | `DashboardAdmin.jsx` & `DaftarKunjungan.jsx` | Fungsi `executeStatusToggle` dan state `statusConfirmTarget` diduplikasi persis di dua halaman dashboard dan daftar tamu. | **✅ RESOLVED** (Diekstrak ke custom hook terpusat `useGuestStatus`) |
| **Helper Format Tanggal/Waktu** | `waService.js`, `tamuService.js`, `upload.js` | Logika memecah string tanggal dan mencocokkan nama bulan Indonesia diimplementasikan ulang di banyak tempat. | **✅ RESOLVED** (Disatukan di [backend/utils/timeHelper.js](file:///d:/Magang/App/Buku-Tamu-KSOP/backend/utils/timeHelper.js)) |

---

## IV. Rekomendasi Roadmap Solusi Profesional Jangka Panjang

Jika Anda setuju, kita dapat mengeksekusi perbaikan ini secara terukur dan bertahap:
1. **Fase 1 (Keamanan & Integritas Data - Prioritas Utama)**:
   - Memperbaiki celah IDOR di `authController.updateProfile` (kunci ke `req.user.id`).
   - Menambahkan pengaman `deleteUser` (cegah self-delete dan cegah hapus admin terakhir).
   - Menambahkan suffix acak unik (`crypto.randomBytes`) pada nama file foto untuk mencegah *overwrite* saat pendaftaran simultan.
2. **Fase 2 (Skalabilitas & Performa)**:
   - Mengubah paginasi di `DaftarKunjungan.jsx` menjadi *Server-Side Pagination* penuh agar data tamu berapapun jumlahnya tetap bisa diakses tanpa terpotong.
   - Membersihkan redundansi pemanggilan `User.findAll()` pada `activityController.js`.
3. **Fase 3 (Clean Architecture & Modularisasi)**:
   - Menyatukan API calls frontend ke dalam folder `frontend/src/api`.
   - Mengeliminasi duplikasi header `x-user-nama` dan duplikasi modal konfirmasi status.