const pool = require('../config/db');

// POST /reports — Create a new report
const createReport = async (req, res) => {
  try {
    const { user_id, title, description, category, image, status } = req.body;

    // Basic validation
    if (!user_id || !title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Fields user_id, title, description, and category are required.',
      });
    }

    const validStatuses = ['pending', 'process', 'done'];
    const reportStatus = status && validStatuses.includes(status) ? status : 'pending';

    const sql = `
      INSERT INTO reports (user_id, title, description, category, image, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [user_id, title, description, category, image || null, reportStatus];

    const [result] = await pool.execute(sql, values);

    return res.status(201).json({
      success: true,
      message: 'Report created successfully.',
      data: { id: result.insertId, ...req.body, status: reportStatus },
    });
  } catch (error) {
    console.error('createReport error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /reports — Get all reports (with optional filtering)
const getAllReports = async (req, res) => {
  try {
    const { status, category } = req.query;

    let sql = 'SELECT * FROM reports WHERE 1=1';
    const values = [];

    if (status) {
      const validStatuses = ['pending', 'process', 'done'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Use: pending, process, or done.',
        });
      }
      sql += ' AND status = ?';
      values.push(status);
    }

    if (category) {
      sql += ' AND category = ?';
      values.push(category);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.execute(sql, values);

    return res.status(200).json({
      success: true,
      total: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error('getAllReports error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// GET /reports/:id — Get a single report
const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute('SELECT * FROM reports WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: `Report with id ${id} not found.` });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('getReportById error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// PUT /reports/:id — Update a report
const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, title, description, category, image, status } = req.body;

    // Check if report exists
    const [existing] = await pool.execute('SELECT * FROM reports WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: `Report with id ${id} not found.` });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['pending', 'process', 'done'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Use: pending, process, or done.',
        });
      }
    }

    // Merge existing data with new data (partial update support)
    const current = existing[0];
    const updatedData = {
      user_id: user_id ?? current.user_id,
      title: title ?? current.title,
      description: description ?? current.description,
      category: category ?? current.category,
      image: image ?? current.image,
      status: status ?? current.status,
    };

    const sql = `
      UPDATE reports
      SET user_id = ?, title = ?, description = ?, category = ?, image = ?, status = ?
      WHERE id = ?
    `;
    const values = [
      updatedData.user_id,
      updatedData.title,
      updatedData.description,
      updatedData.category,
      updatedData.image,
      updatedData.status,
      id,
    ];

    await pool.execute(sql, values);

    return res.status(200).json({
      success: true,
      message: 'Report updated successfully.',
      data: { id: parseInt(id), ...updatedData },
    });
  } catch (error) {
    console.error('updateReport error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// DELETE /reports/:id — Delete a report
const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute('SELECT * FROM reports WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: `Report with id ${id} not found.` });
    }

    await pool.execute('DELETE FROM reports WHERE id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: `Report with id ${id} deleted successfully.`,
    });
  } catch (error) {
    console.error('deleteReport error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

module.exports = {
  createReport,
  getAllReports,
  getReportById,
  updateReport,
  deleteReport,
};
