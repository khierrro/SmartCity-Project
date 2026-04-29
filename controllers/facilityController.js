const { Facility, Report } = require('../models');
const { Op } = require('sequelize');

// GET /api/facilities
// Mengembalikan semua fasilitas diurutkan berdasarkan nama ASC
exports.getAllFacilities = async (req, res) => {
  try {
    const facilities = await Facility.findAll({
      order: [['name', 'ASC']],
      attributes: [
        'id',
        'name',
        'type',
        'address',
        'phone',
        'operating_hours',
        'image_path',
        'latitude',
        'longitude',
        'created_at',
        'updated_at',
      ],
    });

    return res.json({
      success: true,
      data: facilities,
    });
  } catch (error) {
    console.error('getAllFacilities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data fasilitas',
    });
  }
};

// GET /api/facilities/:id
// Mengembalikan detail satu fasilitas + jumlah laporan terkait (status != 'hidden')
exports.getFacilityById = async (req, res) => {
  try {
    const { id } = req.params;

    const facility = await Facility.findByPk(id, {
      attributes: [
        'id',
        'name',
        'type',
        'address',
        'phone',
        'operating_hours',
        'image_path',
        'latitude',
        'longitude',
        'created_at',
        'updated_at',
      ],
    });

    if (!facility) {
      return res.status(404).json({
        success: false,
        message: 'Fasilitas tidak ditemukan',
      });
    }

    // Hitung laporan terkait yang statusnya bukan 'hidden'
    const reportCount = await Report.count({
      where: {
        facility_id: id,
        status: { [Op.ne]: 'hidden' },
      },
    });

    return res.json({
      success: true,
      data: {
        ...facility.toJSON(),
        report_count: reportCount,
      },
    });
  } catch (error) {
    console.error('getFacilityById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail fasilitas',
    });
  }
};
