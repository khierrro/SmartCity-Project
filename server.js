const express = require("express");
const path = require("path");
const session = require("express-session");
const sequelize = require("./config/database");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "rahasia123",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.get('/', (req, res) => {
  if (req.session.user) {
    res.redirect(JSON.stringify(req.session.user));
  } else {
    res.redirect('index.html');
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

const authRoutes = require('./routes/authRoutes');
app.use('/', authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Halaman tidak ditemukan" });
});

sequelize.authenticate()
  .then(() => console.log(' Database terkoneksi (Sequelize)'))
  .catch(err => console.error(' Gagal koneksi database:', err));

app.listen(PORT, () => console.log(` Server berjalan di http://localhost:${PORT}`));