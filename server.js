const express = require("express");
const path = require("path");
const session = require("express-session");
const sequelize = require("./config/database");
require("dotenv").config();


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('Public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "rahasia123",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

// Root redirect based on session
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect('/pages/menu.html');   // sudah login
  } else {
    res.redirect('/index.html');        // landing page
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected", message: error.message });
  }
});

const adminRoutes = require('./Routes/admin');
app.use('/api/admin', adminRoutes);


const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Halaman tidak ditemukan" });
});

sequelize.authenticate()
  .then(() => console.log('Database terkoneksi (Sequelize)'))
  .catch(err => console.error('Gagal koneksi database:', err));

app.listen(PORT, () => console.log(`Server berjalan di http://localhost:${PORT}`));