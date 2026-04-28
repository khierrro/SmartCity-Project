const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const Report = require('../models/Reports');
const ReportFlag = require('../models/ReportFlag');

router.post('/:id/flag', isAuth, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });

    const reason = req.body.reason?.trim() || null;

    // Try to create – unique constraint prevents duplicates
    try {
      await ReportFlag.create({
        user_id:   req.user.id,
        report_id: report.id,
        reason,
      });
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        return res.json({ success: true, flagged: true, message: 'Anda sudah menandai laporan ini' });
      }
      throw err;
    }

    report.flagged = true;
    await report.save();

    res.json({ success: true, flagged: true, message: 'Laporan ditandai' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;