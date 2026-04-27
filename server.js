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
    res.status(500).json({ error: err.message });
  }
});

// Auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

// Citizen route for flagging (must be before report routes)
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Halaman tidak ditemukan" });
});

// Start server
sequelize.authenticate()
  .then(() => {
    console.log(' Database terkoneksi (Sequelize)');
    app.listen(PORT, () => console.log(` Server berjalan di http://localhost:${PORT}`));
  })
  .catch(err => console.error('Gagal koneksi database:', err));