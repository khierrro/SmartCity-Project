// =====================================================
// TAMBAHKAN baris-baris ini di server.js
// Letakkan di bagian require routes (bersama route lainnya)

// Letakkan di bagian app.use routes (sebelum wildcard / 404 handler)


// =====================================================
// Contoh posisi di server.js (jika belum ada strukturnya):
// =====================================================
/*
const adminFacilityRoutes = require('./routes/adminFacilityRoutes'); // sudah ada
const facilityRoutes       = require('./routes/facilityRoutes');      // BARU

app.use('/api/admin/facilities', isAdmin, adminFacilityRoutes);
app.use('/api/facilities', facilityRoutes);   // publik, tidak perlu middleware
*/
