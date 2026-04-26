'use strict';
const db      = require('../models');
const Comment = db.Comment;
const Report  = db.Report;
const User    = db.users;

// ─── GET /api/reports/:id/comments ──────────────────────────────────────────
const getComments = async (req, res) => {
  try {
    const { id: report_id } = req.params;

    // verify report exists
    const report = await Report.findByPk(report_id, { attributes: ['id', 'status'] });
    if (!report) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });

    // fetch top-level comments with nested replies (1 level deep)
    const comments = await Comment.findAll({
      where:   { report_id, parent_id: null },
      include: [
        { model: User,    as: 'Author', attributes: ['id', 'name'] },
        {
          model:   Comment,
          as:      'Replies',
          include: [{ model: User, as: 'Author', attributes: ['id', 'name'] }],
          order:   [['created_at', 'ASC']],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    res.json({ success: true, data: comments });
  } catch (err) {
    console.error('getComments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/reports/:id/comments  (citizen only) ─────────────────────────
const addComment = async (req, res) => {
  try {
    const { id: report_id } = req.params;
    const { content, parent_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Komentar tidak boleh kosong' });
    }

    // verify report
    const report = await Report.findByPk(report_id, { attributes: ['id', 'status'] });
    if (!report) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
    if (report.status === 'hidden') {
      return res.status(403).json({ success: false, message: 'Tidak dapat komentar pada laporan ini' });
    }

    // validate parent comment if replying
    if (parent_id) {
      const parent = await Comment.findByPk(parent_id);
      if (!parent || parent.report_id !== parseInt(report_id)) {
        return res.status(400).json({ success: false, message: 'Parent komentar tidak valid' });
      }
    }

    const comment = await Comment.create({
      report_id: parseInt(report_id),
      user_id:   req.user.id,
      parent_id: parent_id || null,
      content:   content.trim(),
    });

    // reload with author
    const full = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'Author', attributes: ['id', 'name'] }],
    });

    res.status(201).json({ success: true, data: full });
  } catch (err) {
    console.error('addComment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/comments/:id  (owner or admin) ─────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Komentar tidak ditemukan' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = comment.user_id === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Tidak punya izin' });
    }

    await comment.destroy();
    res.json({ success: true, message: 'Komentar dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/comments/:id  (owner only, edit) ──────────────────────────────
const editComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Komentar tidak boleh kosong' });
    }

    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Komentar tidak ditemukan' });
    if (comment.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Tidak punya izin' });
    }

    await comment.update({ content: content.trim(), is_edited: true });
    res.json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getComments, addComment, deleteComment, editComment };