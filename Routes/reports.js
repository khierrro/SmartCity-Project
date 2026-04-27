// routes/reports.js
const express = require('express');
const router = express.Router();
const isAuth = require('../middleware/isAuth');
const isAdmin = require('../middleware/isAdmin');
const reportController = require('../controllers/reportController');

router.get('/search',       isAuth, reportController.searchReports);
router.get('/:id',          isAuth, reportController.getReportById);
router.post('/',            isAuth, reportController.createReport);
router.put('/:id/status',   isAdmin, reportController.updateStatus);
router.delete('/:id',       isAdmin, reportController.deleteReport);

module.exports = router;