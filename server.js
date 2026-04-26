const express = require("express");
const path = require("path");
const session = require("express-session");
const sequelize = require("./config/database");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 2. Session (MUST be before any route that uses req.session)
app.use(session({
  secret: process.env.SESSION_SECRET || "rahasia123",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// 3. Protect admin pages BEFORE static files
app.get('/pages/admin.html', (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login.html?role=admin');
  }
  next();
});
app.get('/pages/admin-search.html', (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.redirect('/login.html?role=admin');
  }
  next();
});

// 4. Static files (only one, remove duplicate)
app.use(express.static(path.join(__dirname, "public")));

// 5. Root redirect
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/pages/menu.html');
  }
  res.redirect('/index.html');
});

// 6. API: health check
app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected", message: error.message });
  }
});

// 7. Auth routes (login, register, logout, /me)
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// 8. Admin‑only routes (statistics, facilities CRUD, notifications, etc.)
const adminRoutes = require('./routes/admin');  // corrected path (Routes → routes)
app.use('/api/admin', adminRoutes);

// 9. Report routes (search, detail, create, status update, delete) – uses reportController
const reportRoutes = require('./routes/reports'); 
app.use('/api/reports', reportRoutes);

// 10. 404 catch‑all
app.use((req, res) => {
  res.status(404).json({ error: "Halaman tidak ditemukan" });
});

// 11. Database connection & start
sequelize.authenticate()
  .then(() => {
    console.log(' Database terkoneksi (Sequelize)');
    app.listen(PORT, () => console.log(` Server berjalan di http://localhost:${PORT}`));
  })
  .catch(err => console.error('Gagal koneksi database:', err));