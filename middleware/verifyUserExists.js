// middleware/verifyUserExists.js
const User = require("../models/User");

module.exports = async (req, res, next) => {
  if (!req.user) return next(); // not logged in, skip

  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "role", "provider"],
    });

    if (!user) {
      // User no longer exists in DB — clear token and reject
      res.clearCookie("token", { path: "/" });

      if (req.originalUrl.startsWith("/api")) {
        return res.status(401).json({
          success: false,
          message: "Akun tidak ditemukan",
        });
      }
      return res.redirect("/index.html");
    }

    next();
  } catch (err) {
    console.error("verifyUserExists error:", err);
    next(); // on DB error, fail open (don't block all traffic)
  }
};
