const express = require("express");
const path = require("path");
const session = require("express-session");
const pool = require("./config/database");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "rahasia123",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
  }),
);

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", async (req, res) => {
  try {
    const [result] = await pool.query("SELECT 1 + 1 AS solution");
    res.json({
      status: "ok",
      database: "connected",
      solution: result[0].solution,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      database: "disconnected",
      message: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((req, res) => {
  res.status(404).json({ error: "Halaman tidak ditemukan" });
});

pool
  .getConnection()
  .then((conn) => {
    console.log(" Database terkoneksi");
    conn.release();
  })
  .catch((err) => {
    console.error(" Gagal koneksi database:", err.message);
  });

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
