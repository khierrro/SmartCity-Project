const express = require("express");
const path = require("path");
const session = require("express-session");
const sequelize = require("./config/database");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "rahasia123",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Protect admin pages
app.get('/pages/admin.html', (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login.html?role=admin');
  next();
});
app.get('/pages/admin-search.html', (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login.html?role=admin');
  next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, "public")));

// Root redirect
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/pages/menu.html');
  res.redirect('/index.html');
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// Citizen flagging
const citizenFlagRoutes = require('./routes/citizenflag');
app.use('/api/reports', citizenFlagRoutes);

// Admin routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Report routes (search, detail, create, status, delete, vote)
const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);

// Comment routes (nested under reports)
const commentRoutes = require('./routes/comments');
app.use('/api/reports/:id/comments', commentRoutes);

// Direct comment edit/delete
const isAuth = require('./middleware/isAuth');
const { deleteComment, editComment } = require('./controllers/commentController');
app.delete('/api/comments/:id', isAuth, deleteComment);
app.put('/api/comments/:id', isAuth, editComment);

// -------------------- PUBLIC APIs (before 404) --------------------
// Public facilities list
app.get('/api/facilities', async (req, res) => {
  const Facility = require('./models/Facility');
  const facilities = await Facility.findAll({ order: [['name', 'ASC']] });
  res.json(facilities);
});

// Dynamic report detail page (with navbar injection)
app.get('/report-detail', (req, res) => {
  const fs = require('fs');
  const filePath = path.join(__dirname, 'public', 'pages', 'report-detail.html');

  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) {
      console.error('Template error:', err);
      return res.status(500).send('Error loading page');
    }

    let navbar = '';
    const isAdmin = req.session.user && req.session.user.role === 'admin';
    const isLoggedIn = !!req.session.user;

    if (isAdmin) {
      navbar = `
      <nav class="navbar navbar-expand-lg sticky-top bg-white shadow" style="z-index:1000;">
        <div class="container-fluid">
          <a class="navbar-brand" href="/pages/admin.html">SMART<span>CITY</span></a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav mx-auto mb-2 gap-4">
              <li class="nav-item"><a class="nav-link" href="/pages/admin.html">DASHBOARD</a></li>
              <li class="nav-item"><a class="nav-link active" href="/pages/admin-search.html">LAPORAN</a></li>
              <li class="nav-item"><a class="nav-link" href="/pages/admin-facility-search.html">FASILITAS</a></li>
            </ul>
            <div class="d-flex align-items-center gap-2">
              <span class="text-sm">Admin: ${req.session.user.name}</span>
              <form action="/logout" method="POST" style="display:inline;">
                <button type="submit" class="btn btn-outline-danger btn-sm">
                  <i class="fas fa-sign-out-alt"></i> Keluar
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>`;
    } else {
      navbar = `
      <nav class="navbar navbar-expand-lg sticky-top bg-white shadow" style="z-index:1000;">
        <div class="container-fluid">
          <a class="navbar-brand" href="/pages/menu.html">SMART<span>CITY</span></a>
          <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav mx-auto mb-2 gap-4">
              <li class="nav-item"><a class="nav-link" href="/pages/menu.html">HOME</a></li>
              <li class="nav-item"><a class="nav-link active" href="/pages/reports.html">LAPORAN</a></li>
              <li class="nav-item"><a class="nav-link" href="/pages/facilities.html">FASILITAS</a></li>
            </ul>
            <div id="navbarRight">`;
      if (isLoggedIn) {
        navbar += `
              <span class="me-3">Halo, ${req.session.user.name}</span>
              <a class="btn btn-outline-primary btn-sm" href="/pages/profile.html">
                <i class="fa-regular fa-circle-user"></i> Profil
              </a>
              <form action="/logout" method="POST" style="display:inline;">
                <button type="submit" class="btn btn-outline-danger btn-sm ms-2">
                  <i class="fas fa-sign-out-alt"></i> Keluar
                </button>
              </form>`;
      } else {
        navbar += `
              <a class="btn btn-outline-primary btn-sm" href="/login.html?role=citizen">Login</a>`;
      }
      navbar += `
            </div>
          </div>
        </div>
      </nav>`;
    }

    const result = html.replace('<!-- NAVBAR -->', navbar);
    res.send(result);
  });
});

// -------------------- 404 handler (ALWAYS LAST) --------------------
app.use((req, res) => {
  res.status(404).json({ error: "Halaman tidak ditemukan" });
});
// Start server
sequelize.authenticate()
  .then(() => {
    console.log('Database terkoneksi (Sequelize)');
    app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));
  })
  .catch(err => console.error('Gagal koneksi database:', err));