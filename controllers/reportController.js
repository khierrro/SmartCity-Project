'use strict';
const { Op }   = require('sequelize');   // ← INI yang kurang, penyebab error
const db       = require('../models');
const Report   = db.Report;
const User     = db.users;
const Facility = db.Facility;

// ─── helpers ─────────────────────────────────────────────────────────────────
const VALID_STATUSES = ['new', 'in_progress', 'resolved', 'hidden'];
const VALID_SORT     = ['created_at', 'updated_at', 'vote_count'];

function formatReport(r) {
  return {
    id:            r.id,
    title:         r.title,
    description:   r.description,
    location_text: r.location_text,
    image_path:    r.image_path,
    status:        r.status,
    vote_count:    r.vote_count,
    flagged:       r.flagged,
    is_read:       r.is_read,
    reporter:      r.User     ? r.User.name     : 'Akun Dihapus',
    facility:      r.Facility ? r.Facility.name : null,
    facility_id:   r.facility_id,
    created_at:    r.created_at,
    updated_at:    r.updated_at,
  };
}

// ─── GET /api/reports/search ──────────────────────────────────────────────────
const searchReports = async (req, res) => {
  try {
    const {
      q           = '',
      status      = '',
      facility_id = '',
      date_from   = '',
      date_to     = '',
      sort_by     = 'created_at',
      order       = 'DESC',
      page        = 1,
      limit       = 10,
    } = req.query;

    const where = {};

    // keyword search
    if (q.trim()) {
      where[Op.or] = [
        { title:         { [Op.like]: `%${q}%` } },
        { description:   { [Op.like]: `%${q}%` } },
        { location_text: { [Op.like]: `%${q}%` } },
      ];
    }

    // status filter — admin sees all statuses including 'hidden'
    const isAdmin = req.user && req.user.role === 'admin';
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    } else if (!isAdmin) {
      // citizen cannot see hidden reports
      where.status = { [Op.ne]: 'hidden' };
    }

    if (facility_id) where.facility_id = Number(facility_id);

    // date range
    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) where.created_at[Op.gte] = new Date(date_from);
      if (date_to) {
        const end = new Date(date_to);
        end.setHours(23, 59, 59, 999);
        where.created_at[Op.lte] = end;
      }
    }

    const sortField = VALID_SORT.includes(sort_by) ? sort_by : 'created_at';
    const sortDir   = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const pageNum   = Math.max(1, parseInt(page)  || 1);
    const limitNum  = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset    = (pageNum - 1) * limitNum;

    const { count, rows } = await Report.findAndCountAll({
      where,
      include: [
        { model: User,     as: 'User', attributes: ['name'] },
        { model: Facility,             attributes: ['name'] },
      ],
      order:  [[sortField, sortDir]],
      limit:  limitNum,
      offset,
    });

    res.json({
      success:    true,
      total:      count,
      page:       pageNum,
      totalPages: Math.ceil(count / limitNum),
      data:       rows.map(formatReport),
    });
  } catch (err) {
    console.error('searchReports error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/reports/:id ─────────────────────────────────────────────────────
const getReportById = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      include: [
        { model: User,     as: 'User', attributes: ['name', 'email'] },
        { model: Facility,             attributes: ['name', 'type', 'address', 'phone'] },
      ],
    });
    if (!report) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });

    const isAdmin = req.user && req.user.role === 'admin';
    if (report.status === 'hidden' && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Laporan tidak tersedia' });
    }

    res.json({ success: true, data: formatReport(report) });
  } catch (err) {
    console.error('getReportById error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/reports ────────────────────────────────────────────────────────
const createReport = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Silakan login' });

    const { title, description, facility_id, location_text } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'title dan description wajib diisi' });
    }

    const image_path = req.file ? '/reports/' + req.file.filename : null;
    const report = await Report.create({
      user_id:       req.user.id,
      facility_id:   facility_id || null,
      title,
      description,
      location_text: location_text || null,
      image_path,
      status:        'new',
      is_read:       false,
    });
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    console.error('createReport error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/reports/:id/status  (admin only) ───────────────────────────────
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });

    await report.update({ status, is_read: true });
    res.json({ success: true, data: { id: report.id, status: report.status } });
  } catch (err) {
    console.error('updateStatus error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/reports/:id  (admin only) ───────────────────────────────────
const deleteReport = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
    await report.destroy();
    res.json({ success: true, message: 'Laporan dihapus' });
  } catch (err) {
    console.error('deleteReport error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { searchReports, getReportById, createReport, updateStatus, deleteReport };