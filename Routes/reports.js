const express = require('express');
const router = express.Router();
const multer = require('multer');                     // ← tambahkan
const path = require('path');                         // ← tambahkan
const isAuth = require('../middleware/isAuth');
const isAdmin = require('../middleware/isAdmin');
const reportController = require('../controllers/reportController');
const { Report, Facility } = require('../models');

// Konfigurasi penyimpanan gambar laporan
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/reports/'),  // folder di luar public
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.get('/search', reportController.searchReports);

// Rute milik user yang login
router.get('/my/stats', isAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const total = await Report.count({ where: { user_id: userId } });
    const resolved = await Report.count({ where: { user_id: userId, status: 'resolved' } });
    const inProgress = await Report.count({ where: { user_id: userId, status: 'in_progress' } });
    res.json({ total, resolved, in_progress: inProgress });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/my', isAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const reports = await Report.findAll({
      where: { user_id: userId },
      include: [{ model: Facility, attributes: ['name'] }],
      order: [['created_at', 'DESC']]
    });
    const formatted = reports.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,               // ← add
      location_text: r.location_text,           // ← add
      facility: r.Facility ? r.Facility.name : null,
      facility_id: r.facility_id,               // ← add
      status: r.status,
      vote_count: r.vote_count,
      image_path: r.image_path,                // optional for future
      created_at: r.created_at
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------- RUTE DENGAN PARAMETER ----------
router.get('/:id',          isAuth, reportController.getReportById);
router.post('/', isAuth, upload.single('image'), reportController.createReport);
router.put('/:id/status',   isAdmin, reportController.updateStatus);
// Citizen edit & delete own reports
router.put('/:id',    isAuth, upload.single('image'), reportController.updateOwnReport);
router.delete('/:id', isAuth, reportController.deleteOwnReport);
router.post('/:id/vote',    isAuth, reportController.toggleVote);

module.exports = router;