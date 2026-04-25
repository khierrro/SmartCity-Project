const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const multer = require('multer');
const path = require('path');

const db = require('../models');           
const User = db.users;                    
const Report = db.Report;
const Facility = db.Facility;
const sequelize = db.sequelize; 

// ---------- Image upload config ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/Facility/'),   // capital F
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

router.use(isAdmin);

// ---------- STATISTICS ----------
router.get('/statistics', async (req, res) => {
  try {
    const total = await Report.count();
    const resolved = await Report.count({ where: { status: 'resolved' } });
    const inProgress = await Report.count({ where: { status: 'in_progress' } });
    const hidden = await Report.count({ where: { status: 'hidden' } });

    const facilityRows = await Facility.findAll({
      attributes: {
        include: [[sequelize.fn('COUNT', sequelize.col('reports.id')), 'reportCount']]
      },
      include: [{
        model: Report,
        attributes: [],
        where: { status: ['new', 'in_progress', 'resolved', 'hidden'] },
        required: false
      }],
      group: ['Facility.id'],
      raw: true
    });

    const facilityStats = facilityRows.map(f => ({
      name: f.name,
      count: parseInt(f.reportCount) || 0
    }));

    const latest = await Report.findAll({
      order: [['created_at', 'DESC']],
      limit: 5,
      attributes: ['id', 'title', 'created_at']
    });
    const latestReports = latest.map(r => ({
      title: r.title,
      date: r.created_at.toISOString().split('T')[0]
    }));

    res.json({ total, resolved, in_progress: inProgress, hidden, facilityStats, latestReports });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- REPORTS LIST (with optional query params) ----------
router.get('/reports', async (req, res) => {
  try {
    const { sort_by = 'created_at', order = 'DESC', status, facility_id, search, limit } = req.query;
    const where = {};
    if (status) where.status = status;
    if (facility_id) where.facility_id = facility_id;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location_text: { [Op.like]: `%${search}%` } }
      ];
    }

    const orderClause = [[sort_by === 'vote_count' ? 'vote_count' : 'created_at', order.toUpperCase()]];
    const limitVal = limit ? parseInt(limit) : undefined;

    const reports = await Report.findAll({
      where,
      include: [
        { model: User, as: 'User', attributes: ['name'] },
        { model: Facility, attributes: ['name'] }
      ],
      order: orderClause,
      limit: limitVal
    });

    const formatted = reports.map(r => ({
      id: r.id,
      title: r.title,
      reporter: r.User ? r.User.name : 'Akun Dihapus',
      facility: r.Facility ? r.Facility.name : '-',
      status: r.status,
      vote_count: r.vote_count,
      date: r.created_at.toISOString().split('T')[0]
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- SINGLE REPORT ----------
router.get('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      include: [
        { model: User, as: 'User', attributes: ['name'] },
        { model: Facility, attributes: ['name'] }
      ]
    });
    if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    res.json({
      id: report.id,
      title: report.title,
      description: report.description,
      location_text: report.location_text,
      status: report.status,
      vote_count: report.vote_count,
      created_at: report.created_at,
      reporter: report.User ? report.User.name : 'Akun Dihapus',
      facility: report.Facility ? report.Facility.name : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- UPDATE REPORT STATUS ----------
router.put('/reports/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'in_progress', 'resolved', 'hidden'].includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    report.status = status;
    await report.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- DELETE REPORT ----------
router.delete('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    await report.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== FACILITIES ====================
// GET all facilities
router.get('/facilities', async (req, res) => {
  try {
    const facilities = await Facility.findAll({ order: [['name', 'ASC']] });
    res.json(facilities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single facility
router.get('/facilities/:id', async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) return res.status(404).json({ error: 'Fasilitas tidak ditemukan' });
    res.json(facility);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE facility
router.post('/facilities', upload.single('image'), async (req, res) => {
  try {
    const { name, type, address, phone, operating_hours } = req.body;
    const image_path = req.file ? '/facility/' + req.file.filename : null;
    const facility = await Facility.create({ name, type, address, phone, operating_hours, image_path });
    res.status(201).json(facility);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE facility
router.put('/facilities/:id', upload.single('image'), async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) return res.status(404).json({ error: 'Fasilitas tidak ditemukan' });
    const { name, type, address, phone, operating_hours } = req.body;
    const updateData = { name, type, address, phone, operating_hours };
    if (req.file) updateData.image_path = '/facility/' + req.file.filename;
    await facility.update(updateData);
    res.json(facility);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE facility
router.delete('/facilities/:id', async (req, res) => {
  try {
    const facility = await Facility.findByPk(req.params.id);
    if (!facility) return res.status(404).json({ error: 'Fasilitas tidak ditemukan' });
    await facility.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// GET /api/admin/unread-notifications
router.get('/unread-notifications', async (req, res) => {
  try {
    const unreadCount = await Report.count({ where: { is_read: false } });

    const unreadReports = await Report.findAll({
      where: { is_read: false },
      order: [['created_at', 'DESC']],
      limit: 10, // show latest 10 unread
      attributes: ['id', 'title', 'created_at', 'status']
    });

    res.json({
      count: unreadCount,
      reports: unreadReports.map(r => ({
        id: r.id,
        title: r.title,
        date: r.created_at.toISOString().split('T')[0],
        status: r.status
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.put('/mark-all-read', async (req, res) => {
  try {
    await Report.update(
      { status: 'in_progress', is_read: true },
      { where: { status: 'new', is_read: false } }
    );

    await Report.update(
      { is_read: true },
      { where: { is_read: false } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;