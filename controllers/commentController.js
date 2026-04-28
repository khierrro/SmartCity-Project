'use strict';
const db      = require('../models');
const Comment = db.Comment;
const Report  = db.Report;
const User    = db.users;

const EDIT_LIMIT_MINUTES = 30;

// Helper: true if the user is allowed to edit/delete this comment
function canModify(comment, userId, isAdmin) {
  if (isAdmin) return true;                    // admin always can
  if (comment.user_id !== userId) return false; // not the author
  const diffMinutes = (Date.now() - new Date(comment.created_at).getTime()) / 60000;
  return diffMinutes < EDIT_LIMIT_MINUTES;
}

// Recursively add `can_edit` to a comment and its replies
function addCanEditFlag(comment, userId, isAdmin) {
  const plain = comment.get ? comment.get({ plain: true }) : comment;
  plain.can_edit = userId ? canModify(comment, userId, isAdmin) : false;
  if (plain.Replies) {
    plain.Replies = plain.Replies.map(r => addCanEditFlag(r, userId, isAdmin));
  }
  return plain;
}

// ─── GET /api/reports/:id/comments ──────────────────────────────────────────
const getComments = async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id, { attributes: ['id', 'status'] });
    if (!report) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });

    const comments = await Comment.findAll({
      where:   { report_id: req.params.id, parent_id: null },
      include: [
        { model: User, as: 'Author', attributes: ['id', 'name'] },
        {
          model:   Comment,
          as:      'Replies',
          include: [{ model: User, as: 'Author', attributes: ['id', 'name'] }],
          order:   [['created_at', 'ASC']],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    const userId  = req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    const data = comments.map(c => addCanEditFlag(c, userId, isAdmin));

    res.json({ success: true, data });   // ← only ONE response
  } catch (err) {
    console.error('getComments error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/reports/:id/comments ─────────────────────────────────────────
const addComment = async (req, res) => {
  try {
    const { content, parent_id } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Komentar tidak boleh kosong' });
    }

    const report = await Report.findByPk(req.params.id, { attributes: ['id', 'status'] });
    if (!report) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan' });
    if (report.status === 'hidden') {
      return res.status(403).json({ success: false, message: 'Laporan tidak menerima komentar' });
    }

    if (parent_id) {
      const parent = await Comment.findByPk(parent_id);
      if (!parent || parent.report_id !== parseInt(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Parent komentar tidak valid' });
      }
    }

    const comment = await Comment.create({
      report_id: parseInt(req.params.id),
      user_id:   req.user.id,
      parent_id: parent_id || null,
      content:   content.trim(),
    });

    const full = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'Author', attributes: ['id', 'name'] }],
    });

    res.status(201).json({ success: true, data: full });
  } catch (err) {
    console.error('addComment error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/comments/:id ───────────────────────────────────────────────
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Komentar tidak ditemukan' });

    const isAdmin = req.user.role === 'admin';
    if (!canModify(comment, req.user.id, isAdmin)) {
      return res.status(403).json({ success: false, message: 'Tidak dapat menghapus komentar ini' });
    }

    await comment.destroy();
    res.json({ success: true, message: 'Komentar dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/comments/:id ──────────────────────────────────────────────────
const editComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Komentar tidak boleh kosong' });
    }

    const comment = await Comment.findByPk(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Komentar tidak ditemukan' });

    const isAdmin = req.user.role === 'admin';
    if (!canModify(comment, req.user.id, isAdmin)) {
      return res.status(403).json({ success: false, message: 'Tidak dapat mengedit komentar ini' });
    }

    await comment.update({ content: content.trim(), is_edited: true });
    res.json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getComments, addComment, deleteComment, editComment };