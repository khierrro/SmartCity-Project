const { fileTypeFromBuffer } = require('file-type');

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

async function validateImageBuffer(req, res, next) {
  if (!req.file) return next(); // no file uploaded, skip

  try {
    const type = await fileTypeFromBuffer(req.file.buffer);

    if (!type || !ALLOWED_MIME_TYPES.has(type.mime)) {
      return res.status(400).json({
        success: false,
        message: 'File tidak valid. Hanya JPEG, PNG, dan WebP yang diizinkan.',
      });
    }

    // Override mimetype with detected real type
    req.file.mimetype = type.mime;
    next();
  } catch (err) {
    console.error('validateImageBuffer error:', err);
    return res.status(400).json({
      success: false,
      message: 'Gagal memvalidasi file.',
    });
  }
}

module.exports = validateImageBuffer;