'use strict';
const { Op } = require('sequelize');
const db = require('../models');

const Report      = db.Report;
const User        = db.users;
const Facility    = db.Facility;
const ReportFlag  = db.ReportFlag;
const UserReportVote = db.UserReportVote || require('../models/UserReportVote');
const sequelize   = db.sequelize;          // ← biar nggak undefined

const VALID_STATUSES = ['new', 'in_progress', 'resolved', 'hidden'];
const VALID_SORT     = ['created_at', 'updated_at', 'vote_count'];
const fs = require('fs');
const path = require('path');

// Inside deleteReport (admin)

// Also apply the same file‑deletion logic inside deleteOwnReport (citizen)
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

const searchReports = async (req, res) => {
  try {
    const {
      q = '', status = '', facility_id = '', flagged = '',
      date_from = '', date_to = '', sort_by = 'created_at',
      order = 'DESC', page = 1, limit = 10,
    } = req.query;

    const where = {};

    if (q.trim()) {
      where[Op.or] = [
        { title:         { [Op.like]: `%${q}%` } },
        { description:   { [Op.like]: `%${q}%` } },
        { location_text: { [Op.like]: `%${q}%` } },
      ];
    }

    const isAdmin = req.user && req.user.role === 'admin';
    if (status && VALID_STATUSES.includes(status)) {
      where.status = status;
    } else if (!isAdmin) {
      where.status = { [Op.ne]: 'hidden' };
    }

    if (facility_id) where.facility_id = Number(facility_id);
    if (flagged !== '') where.flagged = flagged === '1';

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
    const pageNum   = Math.max(1, parseInt(page) || 1);
    const limitNum  = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const offset    = (pageNum - 1) * limitNum;

    // 1) Fetch reports without flag aggregation
    const { count, rows } = await Report.findAndCountAll({
      where,
      include: [
        { model: User,     as: 'User', attributes: ['name'] },
        { model: Facility,             attributes: ['name'] },
      ],
      order: [[sortField, sortDir]],
      limit: limitNum,
      offset,
    });

    // 2) Collect report IDs and fetch flag counts in one query
    const reportIds = rows.map(r => r.id);
    let flagCounts = {};
    if (reportIds.length > 0) {
      const flagRows = await ReportFlag.findAll({
        attributes: ['report_id', [sequelize.fn('COUNT', 'report_id'), 'count']],
        where: { report_id: { [Op.in]: reportIds } },
        group: ['report_id'],
        raw: true,
      });
      flagRows.forEach(f => { flagCounts[f.report_id] = f.count; });
    }

    // 3) Format data
    // 3) Format data and add flag_count
    const formatted = rows.map(r => {
      const item = formatReport(r);
      item.flag_count = parseInt(flagCounts[r.id]) || 0;
      item.date = r.created_at.toISOString().split('T')[0];
      return item;
    });

    res.json({
      success:    true,
      total:      count,
      page:       pageNum,
      totalPages: Math.ceil(count / limitNum),
      data:       formatted,
    });
  } catch (err) {
    console.error('searchReports error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
const getReportById = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, {
      include: [
        { model: User, as: 'User', attributes: ['name', 'email'] },
        { model: Facility, attributes: ['name', 'type', 'address', 'phone'] },
      ],
    });
    if (!report) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });

    const isAdmin = req.user && req.user.role === 'admin';
    if (report.status === 'hidden' && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Laporan tidak tersedia' });
    }

    const flagCount = await ReportFlag.count({ where: { report_id: report.id } });
    let hasVoted = false;
    if (req.user) {
      const vote = await UserReportVote.findOne({ where: { user_id: req.user.id, report_id: report.id } });
      hasVoted = !!vote;
    }

    const data = formatReport(report);
    data.flag_count = flagCount;
    data.hasVoted = hasVoted;

    if (isAdmin) {
      const flags = await ReportFlag.findAll({
        where: { report_id: report.id },
        include: [{ model: User, as: 'User', attributes: ['name'] }],
        order: [['created_at', 'DESC']],
      });
      data.flags = flags.map(f => ({
        user_name: f.User ? f.User.name : 'Akun Dihapus',
        reason: f.reason || 'Tanpa alasan',
        created_at: f.created_at,
      }));
      data.can_comment = false;
    } else {
      data.can_comment = (req.user != null);
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error('getReportById error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// createReport, updateStatus, deleteReport, toggleVote tetap seperti sebelumnya (pakai fungsi yang sudah ada)
const createReport = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Silakan login' });

    const { title, description, facility_id, location_text } = req.body;
    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Judul dan deskripsi wajib diisi' });
    }

    // Path gambar (jika ada)
    const image_path = req.file ? '/uploads/reports/' + req.file.filename : null;

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
// -------------------- updateStatus (admin only) --------------------
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

// -------------------- deleteReport (admin only) --------------------
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

// -------------------- toggleVote (citizen) --------------------
const toggleVote = async (req, res) => {
  try {
    const reportId = req.params.id;
    const userId = req.user.id;

    const existing = await UserReportVote.findOne({ where: { user_id: userId, report_id: reportId } });
    if (existing) {
      await existing.destroy();
      res.json({ success: true, voted: false, vote_count: await getVoteCount(reportId) });
    } else {
      await UserReportVote.create({ user_id: userId, report_id: reportId });
      res.json({ success: true, voted: true, vote_count: await getVoteCount(reportId) });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

async function getVoteCount(reportId) {
  const report = await Report.findByPk(reportId, { attributes: ['vote_count'] });
  return report?.vote_count || 0;
}
// -------------------- updateOwnReport (citizen) --------------------
const updateOwnReport = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });

    // Only the owner can edit
    if (report.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Tidak punya izin' });
    }

    // only allow editing if status is 'new' or 'in_progress'
     if (!['new', 'in_progress'].includes(report.status)) {
       return res.status(400).json({ success: false, message: 'Laporan sudah diproses, tidak dapat diedit' });
     }

    const { title, description, location_text, facility_id } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location_text !== undefined) updateData.location_text = location_text;
    if (facility_id !== undefined) updateData.facility_id = facility_id || null;

    // If new image uploaded
    if (req.file) {
      updateData.image_path = '/uploads/reports/' + req.file.filename;
    }

    await report.update(updateData);
    res.json({ success: true, data: report });
  } catch (err) {
    console.error('updateOwnReport error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------- deleteOwnReport (citizen) --------------------

// deleteOwnReport – also delete the file
const deleteOwnReport = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });

    if (report.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Tidak punya izin' });
    }

    if (report.image_path) {
      const filePath = path.join(__dirname, '..', report.image_path);
      fs.unlink(filePath, (err) => {
        if (err) console.error('Failed to delete file:', filePath, err);
      });
    }

    await report.destroy();
    res.json({ success: true, message: 'Laporan dihapus' });
  } catch (err) {
    console.error('deleteOwnReport error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
module.exports = {
  searchReports,
  getReportById,
  createReport,
  updateStatus,
  deleteReport,
  toggleVote,
  updateOwnReport,
  deleteOwnReport, 
};