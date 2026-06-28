const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const isAuth = require("../middleware/isAuth");
const isAdmin = require("../middleware/isAdmin");
const reportController = require("../controllers/reportController");
const { Report, Facility } = require("../models");
const validateImageBuffer = require("../middleware/validateImageBuffer");
const {
  reportRules,
  reportQueryRules,
  handleValidationErrors,
} = require("../middleware/validators");
// Konfigurasi penyimpanan gambar laporan
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "..", "uploads", "reports");
    require("fs").mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: multer.memoryStorage(), // ← buffer instead of disk
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error("Hanya file gambar yang diizinkan"));
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

router.get("/search", reportController.searchReports);

// Rute milik user yang login
router.get("/my/stats", isAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const total = await Report.count({ where: { user_id: userId } });
    const resolved = await Report.count({
      where: { user_id: userId, status: "resolved" },
    });
    const inProgress = await Report.count({
      where: { user_id: userId, status: "in_progress" },
    });
    res.json({ total, resolved, in_progress: inProgress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/my", isAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await Report.findAll({
      where: { user_id: userId },
      include: [{ model: Facility, attributes: ["name"] }],
      order: [["created_at", "DESC"]],
    });
    const formatted = reports.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      location_text: r.location_text,
      facility: r.Facility ? r.Facility.name : null,
      facility_id: r.facility_id,
      status: r.status,
      vote_count: r.vote_count,
      image_path: r.image_path,
      user_id: r.user_id,
      created_at: r.created_at,
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- RUTE DENGAN PARAMETER ----------
router.get("/:id", reportController.getReportById);
// Create report
router.post(
  "/",
  isAuth,
  upload.single("image"),
  validateImageBuffer,
  reportRules,
  handleValidationErrors,
  reportController.createReport,
);

// Update report
router.put(
  "/:id",
  isAuth,
  upload.single("image"),
  validateImageBuffer,
  reportRules,
  handleValidationErrors,
  reportController.updateOwnReport,
);

// Search reports
router.get(
  "/search",
  reportQueryRules,
  handleValidationErrors,
  reportController.searchReports,
);

router.put("/:id/status", isAdmin, reportController.updateStatus);
router.delete("/:id", isAuth, reportController.deleteOwnReport);
router.post("/:id/vote", isAuth, reportController.toggleVote);

module.exports = router;
