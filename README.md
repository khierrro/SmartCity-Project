# Smart City – Aplikasi Pengaduan Warga

Aplikasi web full‑stack untuk pelaporan dan manajemen masalah perkotaan.
Warga dapat membuat laporan, memberi vote, mengomentari, menandai (flag)
konten, dan memantau status penanganan laporannya. Admin memiliki panel
terpisah untuk mengelola laporan, fasilitas, notifikasi, dan melihat
statistik.

## Fitur Utama

- Autentikasi JWT (httpOnly cookie) + login Google OAuth
- Manajemen laporan: buat, edit, hapus, vote, komentar berantai, flag
- Panel admin: statistik, moderasi, ubah status, notifikasi real‑time
- Direktori & CRUD fasilitas publik (rumah sakit, polisi, damkar)
- Upload gambar (Multer + Cloudinary)
- Keamanan berlapis: Helmet/CSP, CSRF, rate limiting, reCAPTCHA v2
- Dokumentasi REST API otomatis via Swagger

## Teknologi

**Backend**

- Node.js, Express.js
- Sequelize ORM (MySQL/MariaDB)
- Server-side HTML injection (tanpa template engine seperti EJS/Pug)

**Autentikasi & Keamanan**

- JWT (`jsonwebtoken`) via httpOnly cookie + Passport.js (Google OAuth, stateless)
- bcrypt (hashing password)
- Helmet + Content-Security-Policy (nonce per-request)
- `csrf-csrf` (proteksi CSRF double-submit cookie)
- Rate limiting bertingkat (login, baca, aksi, aksi sensitif)
- Google reCAPTCHA v2

**Layanan Pihak Ketiga**

- Cloudinary (penyimpanan gambar)
- Multer (handling upload file)

**Dokumentasi API**

- Swagger (`swagger-ui-express`) — tersedia di `/docs`

**Frontend**

- HTML, CSS, Vanilla JavaScript (fetch API)
- Bootstrap 5, Tailwind CSS (CDN, halaman fasilitas)

**Database & Hosting**

- MySQL / MariaDB
- Railway (hosting)

## Prasyarat

| Perangkat                                                         | Keterangan                                |
| ----------------------------------------------------------------- | ----------------------------------------- |
| [Node.js](https://nodejs.org/)                                    | Versi 18 atau lebih baru                  |
| [MySQL](https://dev.mysql.com/downloads/)                         | XAMPP, Laragon, atau server MySQL sendiri |
| [Git](https://git-scm.com/)                                       | Untuk clone repository                    |
| Akun [Cloudinary](https://cloudinary.com/)                        | Untuk penyimpanan gambar                  |
| Kredensial [Google OAuth](https://console.cloud.google.com/)      | Client ID & Secret untuk login Google     |
| Kredensial [reCAPTCHA v2](https://www.google.com/recaptcha/admin) | Site key & secret key                     |

## Instalasi

1. **Clone repository**

   ```bash
   git clone <url-repository>
   cd smartcity-project
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Buat file `.env`** di root project dan isi sesuai tabel
   [Environment Variables](#environment-variables) di bawah.

4. **Siapkan database**
   - Buat database baru di MySQL (mis. lewat phpMyAdmin), sesuaikan
     nama dengan `.env`.
   - Jalankan migration/import skema — sesuaikan dengan cara kalian
     bekerja: `npx sequelize-cli db:migrate` jika pakai migration
     Sequelize, atau import file `.sql` lewat phpMyAdmin jika manual.

5. **Jalankan server**

   ```bash
   npm run dev
   ```

   atau

   ```bash
   nodemon server.js
   ```

6. Buka `http://localhost:3000` di browser.

## Environment Variables

CONTOH :
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=smart_city_db
DB_PORT=3306
SESSION_SECRET=xxxx
ADMIN_SECRET=xxxx
GOOGLE_CLIENT_ID=xxxx
GOOGLE_CLIENT_SECRET=xxxx
RECAPTCHA_SITE_KEY=xxxx
RECAPTCHA_SECRET_KEY=xxxx
NODE_ENV=development
JWT_SECRET=xxxx
CSRF_SECRET=xxxx
CLOUDINARY_API_KEY = xxxx
CLOUDINARY_API_SECRET= xxxx
CLOUDINARY_CLOUD_NAME=xxxx
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
DATABASE_URL=mysql://root:@localhost:3306/smart_city_db
RECAPTCHA_ALLOWED_HOSTS=localhost

## Dokumentasi API

Setelah server berjalan, dokumentasi REST API (Swagger UI) dapat
diakses di:

```
http://localhost:3000/docs
```

a.
