const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');

// GET /api/facilities → semua fasilitas publik (urut nama ASC)
router.get('/', facilityController.getAllFacilities);

// GET /api/facilities/:id → detail fasilitas + jumlah laporan
router.get('/:id', facilityController.getFacilityById);

module.exports = router;
