```markdown
# Smart City – Aplikasi Pengaduan Warga

Aplikasi web full‑stack untuk pelaporan dan manajemen masalah perkotaan.  
Warga dapat membuat laporan, memberi vote, mengomentari, dan memantau status penanganan.  
Admin memiliki panel untuk mengelola laporan, fasilitas, notifikasi, dan melihat statistik.

## Teknologi

- **Backend:** Node.js, Express, Sequelize ORM (MySQL), Multer (upload), bcrypt
- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5, Tailwind CSS (halaman fasilitas)
- **Database:** MySQL / MariaDB

## Prasyarat

| Perangkat | Keterangan |
|-----------|------------|
| [Node.js](https://nodejs.org/) | Versi 18 atau lebih baru |
| [MySQL](https://dev.mysql.com/downloads/) | XAMPP, Laragon, atau server MySQL sendiri |
| [Git](https://git-scm.com/) | Untuk clone repository |

## Instalasi

1. **Clone repository**
   ```bash
   git clone <url-repository>
   cd smartcity-project
   ```

2. **Install dependency**
   ```bash
   npm install
   ```

3. **Buat database**
   - Buka MySQL (phpMyAdmin, MySQL Workbench, dll.)
   - Buat database baru bernama `smart_city_db`
   - Import file `smart_city_db.sql` yang ada di root proyek

4. **Atur konfigurasi environment**
   - Salin file `.env.example` menjadi `.env`:
     ```bash
     cp .env.example .env
     ```
   - Edit `.env` sesuai pengaturan MySQL Anda:
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASS=
     DB_NAME=smart_city_db
     DB_PORT=3306
     SESSION_SECRET=rahasia123
     ```

5. **Jalankan server**
   ```bash
   nodemon server.js
   ```
   atau
   ```bash
   node server.js
   ```

6. **Buka di browser**
   ```
   http://localhost:3000
   ```

## Akun Uji (Seeder)

| Peran  | Email                  | Password      |
|--------|------------------------|---------------|
| Admin  | admin@smartcity.local   | admin123      |
| Warga  | andi@warga.com          | password123   |
| Warga  | siti@warga.com          | password123   |
| Warga  | budi@warga.com          | password123   |
| Warga  | dewi@warga.com          | password123   |

## Struktur Proyek (ringkas)

```
.
├── config/          # Konfigurasi database (Sequelize)
├── controllers/     # Logic API (report, comment, dll.)
├── middleware/       # isAuth, isAdmin
├── models/          # Sequelize models
├── public/          # Static files (HTML, CSS, JS, gambar)
│   ├── css/
│   ├── js/
│   ├── pages/       # Halaman citizen & admin
│   ├── script/      # navbar.js universal
│   └── img/
├── routes/          # Route handler
├── uploads/         # Direktori upload gambar (terabaikan Git)
├── .env.example     # Template konfigurasi environment
├── server.js        # Entry point aplikasi
└── smart_city_db.sql # Dump database untuk seeder
```

## Fitur Utama

- Registrasi & login warga/admin
- Dashboard admin (statistik, top‑5 laporan, notifikasi)
- Manajemen fasilitas (CRUD + gambar)
- Pencarian laporan dengan filter & load‑more
- Detail laporan dengan navbar dinamis (admin/warga)
- Voting, flagging (tandai), dan komentar bersarang
- Pembatasan akses berbasis role (server middleware + client guard)
- Upload & penghapusan gambar laporan
- Edit profil, ganti password, hapus akun
- Session logout dan proteksi halaman

## Catatan

- File `.env` **tidak** dikomit ke Git (tercantum di `.gitignore`).
- Folder `uploads/` (gambar laporan) juga diabaikan – akan dibuat otomatis saat upload pertama.


## Lisensi

Proyek ini dibuat untuk keperluan akademik (UTS).

```