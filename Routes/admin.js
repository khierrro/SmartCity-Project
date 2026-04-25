const express = require('express');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin'); // middleware cek role admin
const { Report, Facility, users, sequelize } = require('../models');
// users adalah model User (nama 'users')

// Semua route di bawah ini hanya bisa diakses oleh admin
router.use(isAdmin);

// Dapatkan statistik (Fitur 15)
router.get('/statistics', async (req, res) => {
  try {
    const total = await Report.countDocuments();
    const statusAgg = await Report.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const facilityAgg = await Report.aggregate([
      { $group: { _id: '$facility', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const latest = await Report.find()
      .sort({ date: -1 })
      .limit(5)
      .select('title date');

    const statusCounts = {};
    statusAgg.forEach(s => { statusCounts[s._id] = s.count; });

    res.json({
      total,
      new: statusCounts['new'] || 0,
      in_progress: statusCounts['in_progress'] || 0,
      resolved: statusCounts['resolved'] || 0,
      hidden: statusCounts['hidden'] || 0,
      facilityStats: facilityAgg.map(f => ({ name: f._id, count: f.count })),
      latestReports: latest.map(r => ({ title: r.title, date: r.date }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dapatkan semua laporan (Fitur 11)
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name') // asumsikan field reporter adalah ref User
      .populate('facility', 'name') // jika facility adalah ref Facility
      .sort({ date: -1 });
    // Format sesuai kebutuhan frontend
    const formatted = reports.map(r => ({
      id: r._id,
      title: r.title,
      reporter: r.reporter ? r.reporter.name : 'Anonim',
      facility: r.facility ? r.facility.name : r.facilityName, // bisa string langsung
      status: r.status,
      date: r.createdAt ? r.createdAt.toISOString().split('T')[0] : r.date
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update status laporan (Fitur 12 & 13)
router.put('/reports/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'in_progress', 'resolved', 'hidden'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status tidak valid' });
    }
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hapus permanen (Fitur 14)
router.delete('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;