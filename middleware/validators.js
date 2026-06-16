const { body, param, query, validationResult } = require("express-validator");

// Helper untuk mengembalikan error validasi
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => e.msg),
    });
  }
  next();
};

// Helper untuk menolak karakter berbahaya (SQL injection / XSS)
function rejectDangerousChars(value) {
  // Hanya tolak karakter / pola yang benar‑benar digunakan dalam injection
  const forbidden = /['"`\\;]|--|\/\*/;
  if (forbidden.test(value)) {
    throw new Error("Input mengandung karakter yang tidak diizinkan");
  }
  return true;
}

// Aturan password standar (sudah termasuk penolakan karakter berbahaya)
const passwordRule = (field = "password") =>
  body(field)
    .isLength({ min: 8 }).withMessage("Password minimal 8 karakter")
    .matches(/[A-Z]/).withMessage("Password harus mengandung huruf besar")
    .matches(/[a-z]/).withMessage("Password harus mengandung huruf kecil")
    .matches(/[0-9]/).withMessage("Password harus mengandung angka")
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password harus mengandung karakter khusus (!@#$%^&*)")
    .custom(rejectDangerousChars);

// ============ AUTH ============
exports.registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Nama wajib diisi")
    .isLength({ max: 100 }).withMessage("Nama maksimal 100 karakter")
    .custom(rejectDangerousChars),

  body("email")
    .isEmail().withMessage("Format email tidak valid")
    .normalizeEmail(),

  passwordRule(),

  body("phone")
    .optional({ values: "falsy" })
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,10}$/)
    .withMessage("Format telepon tidak valid"),

  body("address")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 }).withMessage("Alamat maksimal 500 karakter")
    .custom(rejectDangerousChars),
];

exports.loginRules = [
  body("email")
    .isEmail().withMessage("Format email tidak valid")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password wajib diisi")
    .custom(rejectDangerousChars),   // ← tambahan keamanan
];

// ============ REPORTS ============
exports.reportRules = [
  body("title")
    .trim()
    .notEmpty().withMessage("Judul laporan wajib diisi")
    .isLength({ max: 200 }).withMessage("Judul maksimal 200 karakter")
    .custom(rejectDangerousChars),

  body("description")
    .trim()
    .notEmpty().withMessage("Deskripsi wajib diisi")
    .isLength({ max: 5000 }).withMessage("Deskripsi maksimal 5000 karakter")
    .custom(rejectDangerousChars),

  body("location_text")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 255 }).withMessage("Lokasi maksimal 255 karakter")
    .custom(rejectDangerousChars),

  body("facility_id")
    .optional({ values: "falsy" })
    .isInt({ min: 1 }).withMessage("ID fasilitas tidak valid"),
];

// ============ PROFILE ============
exports.profileRules = [
  body("phone")
    .optional({ values: "falsy" })
    .matches(/^(\+62|62|0)8[1-9][0-9]{6,10}$/)
    .withMessage("Format telepon tidak valid"),

  body("address")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 }).withMessage("Alamat maksimal 500 karakter")
    .custom(rejectDangerousChars),

  body("currentPassword")
    .optional({ values: "falsy" })
    .notEmpty()
    .withMessage("Password saat ini wajib diisi jika ingin mengubah password")
    .custom(rejectDangerousChars),

  body("newPassword")
    .optional({ values: "falsy" })
    .isLength({ min: 8 }).withMessage("Password baru minimal 8 karakter")
    .matches(/[A-Z]/).withMessage("Password baru harus mengandung huruf besar")
    .matches(/[a-z]/).withMessage("Password baru harus mengandung huruf kecil")
    .matches(/[0-9]/).withMessage("Password baru harus mengandung angka")
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage("Password baru harus mengandung karakter khusus"),
];

// ============ COMMENTS ============
exports.commentRules = [
  body("content")
    .trim()
    .notEmpty().withMessage("Komentar tidak boleh kosong")
    .isLength({ max: 1000 }).withMessage("Komentar maksimal 1000 karakter")
    .custom(rejectDangerousChars),

  body("parent_id")
    .optional({ values: "falsy" })
    .isInt({ min: 1 }).withMessage("ID parent tidak valid"),
];

// ============ FLAGS ============
exports.flagRules = [
  body("reason")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 500 }).withMessage("Alasan maksimal 500 karakter")
    .custom(rejectDangerousChars),
];

// ============ REPORT SEARCH QUERY ============
exports.reportQueryRules = [
  query("q").optional({ values: "falsy" }).trim().escape(),
  query("status")
    .optional({ values: "falsy" })
    .isIn(["new", "in_progress", "resolved", "hidden"])
    .withMessage("Status tidak valid"),
  query("facility_id")
    .optional({ values: "falsy" })
    .isInt()
    .withMessage("ID fasilitas tidak valid"),
  query("sort_by")
    .optional({ values: "falsy" })
    .isIn(["created_at", "updated_at", "vote_count"])
    .withMessage("Field sortir tidak valid"),
  query("order")
    .optional({ values: "falsy" })
    .isIn(["ASC", "DESC"])
    .withMessage("Urutan tidak valid"),
  query("page")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("Halaman tidak valid"),
  query("limit")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("Batas tampil tidak valid (1-100)"),
];

exports.handleValidationErrors = handleValidationErrors;