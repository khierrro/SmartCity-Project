const express = require("express");
const path = require("path");
const session = require("express-session");
const sequelize = require("./config/database");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const fs = require('fs');


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "rahasia123",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
// ============================
// SERVER‑SIDE NAVBAR INJECTION (Tailwind‑safe)
// ============================
app.get('/pages/admin.html', (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login.html?role=admin');
  next();
});
app.get('/pages/admin-search.html', (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login.html?role=admin');
  next();
});

app.use((req, res, next) => {
  if (!req.path.startsWith('/pages/') || !req.path.endsWith('.html')) return next();

  const filePath = path.join(__dirname, 'public', req.path);
  if (!fs.existsSync(filePath)) return next();

  fs.readFile(filePath, 'utf8', (err, html) => {
    if (err) return next();
    
    let navbar = '';
    const isAdmin = req.session.user && req.session.user.role === 'admin';
    const isLoggedIn = !!req.session.user;

    if (isAdmin) {
  navbar = `
    <nav style="position:sticky;top:0;z-index:1000;background:white;box-shadow:0 2px 4px rgba(0,0,0,0.1);padding:0.5rem 1rem">
      <div style="display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto;flex-wrap:wrap;gap:0.5rem">
        <a href="/pages/admin.html" style="text-decoration:none;font-weight:bold;font-size:1.25rem;color:#333">
          SMART<span style="color:#2563eb">CITY</span>
        </a>
        <div style="display:flex;align-items:center;gap:1rem">
          <a href="/pages/admin.html" style="text-decoration:none;color:#555;font-weight:500">DASHBOARD</a>
          <a href="/pages/admin-search.html" style="text-decoration:none;color:#555;font-weight:500">LAPORAN</a>
          <a href="/pages/admin-facility-search.html" style="text-decoration:none;color:#555;font-weight:500">FASILITAS</a>
        </div>
        <div style="display:flex;align-items:center;gap:0.75rem">
          <!-- Notification Bell -->
          <div style="position:relative;">
            <button id="notificationBell" style="background:none;border:none;cursor:pointer;font-size:1.25rem;color:#555" onclick="event.stopPropagation()">
              <i class="fa-regular fa-bell"></i>
            </button>
            <span id="notificationCount" style="position:absolute;top:-0.25rem;right:-0.25rem;background:#ef4444;color:white;border-radius:50%;height:1.25rem;width:1.25rem;display:flex;align-items:center;justify-content:center;font-size:0.75rem;display:none">0</span>
            <!-- Notification Dropdown -->
            <div id="notificationDropdown" style="position:absolute;right:0;top:2rem;width:20rem;background:white;border-radius:0.5rem;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:0.5rem;display:none;z-index:50">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                <span style="font-weight:600">Notifikasi</span>
                <button id="markAllReadBtn" style="font-size:0.75rem;color:#2563eb;background:none;border:none;cursor:pointer">Tandai semua sudah dibaca</button>
              </div>
              <div id="notificationList" style="max-height:15rem;overflow-y:auto;font-size:0.875rem">
                <p style="text-align:center;color:#888;padding:1rem">Memuat...</p>
              </div>
            </div>
          </div>
          <span style="font-size:0.875rem;color:#555">Admin: ${req.session.user.name}</span>
          <form action="/logout" method="POST" style="margin:0">
            <button type="submit" style="background:none;border:1px solid #ef4444;color:#ef4444;padding:0.25rem 0.75rem;border-radius:0.25rem;font-size:0.875rem;cursor:pointer">
              <i class="fas fa-sign-out-alt"></i> Keluar
            </button>
          </form>
        </div>
      </div>
    </nav>
    <script src="/js/admin-notification.js"></script>`;
}
     else {
      navbar = `
        <nav style="position:sticky;top:0;z-index:1000;background:white;box-shadow:0 2px 4px rgba(0,0,0,0.1);padding:0.5rem 1rem">
          <div style="display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto">
            <a href="/pages/menu.html" style="text-decoration:none;font-weight:bold;font-size:1.25rem;color:#333">
              SMART<span style="color:#2563eb">CITY</span>
            </a>
            <div style="display:flex;align-items:center;gap:1rem">
              <a href="/pages/menu.html" style="text-decoration:none;color:#555;font-weight:500">HOME</a>
              <a href="/pages/reports.html" style="text-decoration:none;color:#555;font-weight:500">LAPORAN</a>
              <a href="/pages/facilities.html" style="text-decoration:none;color:#555;font-weight:500">FASILITAS</a>
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem">
              ${isLoggedIn ? `
                <span style="font-size:0.875rem;color:#555">Halo, ${req.session.user.name}</span>
                <a href="/pages/profile.html" style="text-decoration:none;color:#2563eb;border:1px solid #2563eb;padding:0.25rem 0.75rem;border-radius:0.25rem;font-size:0.875rem">
                  <i class="fa-regular fa-circle-user"></i> Profil
                </a>
                <form action="/logout" method="POST" style="margin:0">
                  <button type="submit" style="background:none;border:1px solid #ef4444;color:#ef4444;padding:0.25rem 0.75rem;border-radius:0.25rem;font-size:0.875rem;cursor:pointer">
                    <i class="fas fa-sign-out-alt"></i> Keluar
                  </button>
                </form>
              ` : `
                <a href="/login.html?role=citizen" style="text-decoration:none;color:#2563eb;border:1px solid #2563eb;padding:0.25rem 0.75rem;border-radius:0.25rem;font-size:0.875rem">Login</a>
              `}
            </div>
          </div>
        </nav>`;
    }

    const result = html.replace('<!--Navbar-->', navbar);
    res.send(result);
  });
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

//Facility routes
const facilityRoutes = require('./Routes/facilityRoutes');
app.use('/api/facilities', facilityRoutes)

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
  // Set the URL to /pages/report-detail.html internally
  req.url = '/pages/report-detail.html';
  app.handle(req, res);
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