const express = require("express");
const path = require("path");
const sequelize = require("./config/database");
require("dotenv").config();
const {
  authLimiter,
  readLimiter,
  actionLimiter,
  strictActionLimiter,
} = require("./middleware/rateLimiter");
const app = express();
const PORT = process.env.PORT || 3000;
const fs = require("fs");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

app.use(cookieParser());

// ─────────────────────────────────────────
// JWT Middleware – decode token from cookie
// ─────────────────────────────────────────
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // 🔒 Safety: never expose password or timestamps
      delete decoded.password;
      delete decoded.created_at;
      delete decoded.updated_at;
      req.user = decoded;
    } catch (err) {
      res.clearCookie("token");
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
});

// ─────────────────────────────────────────
// 1. HELMET & CONTENT SECURITY POLICY
// ─────────────────────────────────────────
const helmet = require("helmet");
app.use((req, res, next) => {
  res.locals.cspNonce = require("crypto").randomBytes(16).toString("base64");
  next();
});
app.use(helmet());

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
  "'self'",
  (req, res) => `'nonce-${res.locals.cspNonce}'`,
  "https://cdn.tailwindcss.com",
  "https://cdnjs.cloudflare.com",
  "https://cdn.jsdelivr.net",
  "https://www.google.com",
  "https://www.gstatic.com",
],
      frameSrc: ["'self'", "https://www.google.com"],
      styleSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "'unsafe-inline'",
      ],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      connectSrc: [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://www.google.com",
        "https://www.gstatic.com",
      ],
    },
  })
);

// ─────────────────────────────────────────
// 2. BODY PARSER
// ─────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ─────────────────────────────────────────
// 3. PASSPORT (Google OAuth)
// ─────────────────────────────────────────
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./models/User");
const bcrypt = require("bcrypt");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        let user = await User.findOne({ where: { email } });
        if (!user) {
         const randomPassword = require("crypto").randomBytes(16).toString("hex");
          const hashed = await bcrypt.hash(randomPassword, 10);
          user = await User.create({
            name,
            email,
            password: hashed,
            role: "citizen",
          });
        }
        // Pass the full user instance (we'll extract needed fields later)
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);
// Only need initialize() for the strategy itself
app.use(passport.initialize());

// ─────────────────────────────────────────
// 4. GOOGLE OAUTH ROUTES
// ─────────────────────────────────────────
app.get(
  "/auth/google",
  passport.authenticate("google", { session: false, scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { session:false,failureRedirect: "/login.html" }),
  (req, res) => {
    // Extract only safe fields from req.user (the full model)
    const safeUser = {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      address: req.user.address,
    };

    // Create JWT and set as cookie
    const token = jwt.sign(safeUser, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,      // true in production
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Redirect to appropriate dashboard
    if (safeUser.role === "admin") {
      res.redirect("/pages/admin.html");
    } else {
      res.redirect("/pages/menu.html");
    }
  }
);

// ─────────────────────────────────────────
// 5. CSRF PROTECTION (cookie-based, unchanged)
// ─────────────────────────────────────────
const { doubleCsrf } = require("csrf-csrf");

const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  getSessionIdentifier: (req) => req.user?.id?.toString() ?? req.ip,
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
  getTokenFromRequest: (req) => {
    return req.body?._csrf        // form submissions
      || req.headers['x-csrf-token']; // AJAX requests
  },
});
app.post("/logout", (req, res) => {
  res.clearCookie("token", { path: "/" });
  res.clearCookie("connect.sid", { path: "/" });
  res.redirect("/index.html");
});

app.use(doubleCsrfProtection);

app.use((req, res, next) => {
  req.csrfToken = () => generateCsrfToken(req, res);
  next();
});


// ─────────────────────────────────────────
// 6. RATE LIMITER + ROUTES
// ─────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
app.use("/api", (req, res, next) => {
  if (req.method === "GET") return readLimiter(req, res, next);
  return actionLimiter(req, res, next);
});
app.use("/", authRoutes);

// ─────────────────────────────────────────
// 7. PAGE GUARDS (now using req.user)
// ─────────────────────────────────────────
app.get("/pages/admin.html", (req, res, next) => {
  if (!req.user || req.user.role !== "admin")
    return res.redirect("/login.html?role=admin");
  next();
});
app.get("/pages/admin-search.html", (req, res, next) => {
  if (!req.user || req.user.role !== "admin")
    return res.redirect("/login.html?role=admin");
  next();
});

// ─────────────────────────────────────────
// 8. SERVER‑SIDE NAVBAR INJECTION (uses req.user)
// ─────────────────────────────────────────
app.use((req, res, next) => {
  if (!req.path.startsWith("/pages/") || !req.path.endsWith(".html"))
    return next();
  if (!req.path.endsWith(".html")) return next();

  const filePath = path.join(__dirname, "public", req.path);
  if (!fs.existsSync(filePath)) return next();

  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) return next();

    const user = req.user || null;               // from JWT
    const isAdmin = user && user.role === "admin";
    const isLoggedIn = !!user;
    const csrfToken = req.csrfToken();
    let navbar = "";

    if (isAdmin) {
      navbar = `
            <nav style="position:sticky;top:0;z-index:1000;background:white;box-shadow:0 2px 4px rgba(0,0,0,0.1);padding:0.5rem 1rem">
              <div style="display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto;flex-wrap:wrap;gap:0.5rem">
                <a href="/pages/admin.html" style="text-decoration:none;font-weight:bold;font-size:1.25rem;color:#333">
                  SMART<span style="color:#2563eb">CITY</span>
                </a>
                <div style="display:flex;align-items:center;gap:1rem">
                  <a href="/pages/admin.html" style="text-decoration:none;color:#555;font-weight:500">DASHBOARD</a>
                  <a href="/pages/admin-search.html" style="text-decoration:none;color:#555;font-weight:500">LAPORAN</a>
                  <a href="/pages/admin-facility-search.html" style="text-decoration:none;color:#555;font-weight:500">FASILITAS</a>
                </div>
                <div style="display:flex;align-items:center;gap:0.75rem">
                  <div style="position:relative;">
                    <button id="notificationBell" style="background:none;border:none;cursor:pointer;font-size:1.25rem;color:#555" onclick="event.stopPropagation()">
                      <i class="fa-regular fa-bell"></i>
                    </button>
                    <span id="notificationCount" style="position:absolute;top:-0.25rem;right:-0.25rem;background:#ef4444;color:white;border-radius:50%;height:1.25rem;width:1.25rem;display:flex;align-items:center;justify-content:center;font-size:0.75rem;display:none">0</span>
                    <div id="notificationDropdown" style="position:absolute;right:0;top:2rem;width:20rem;background:white;border-radius:0.5rem;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:0.5rem;display:none;z-index:50">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                        <span style="font-weight:600">Notifikasi</span>
                        <button id="markAllReadBtn" style="font-size:0.75rem;color:#2563eb;background:none;border:none;cursor:pointer">Tandai semua sudah dibaca</button>
                      </div>
                      <div id="notificationList" style="max-height:15rem;overflow-y:auto;font-size:0.875rem">
                        <p style="text-align:center;color:#888;padding:1rem">Memuat...</p>
                      </div>
                    </div>
                  </div>
                  <span style="font-size:0.875rem;color:#555">Admin: ${user.name}</span>
                  <form action="/logout" method="POST" style="margin:0">
                    <input type="hidden" name="_csrf" value="${csrfToken}">
                    <button type="submit" style="background:none;border:1px solid #ef4444;color:#ef4444;padding:0.25rem 0.75rem;border-radius:0.25rem;font-size:0.875rem;cursor:pointer">
                      <i class="fas fa-sign-out-alt"></i> Keluar
                    </button>
                  </form>
                </div>
              </div>
            </nav>
            <script src="/js/admin-notification.js"></script>`;
    } else {
      navbar = `
            <nav style="position:sticky;top:0;z-index:1000;background:white;box-shadow:0 2px 4px rgba(0,0,0,0.1);padding:0.5rem 1rem">
              <div style="display:flex;align-items:center;justify-content:space-between;max-width:1200px;margin:0 auto">
                <a href="/pages/menu.html" style="text-decoration:none;font-weight:bold;font-size:1.25rem;color:#333">
                  SMART<span style="color:#2563eb">CITY</span>
                </a>
                <div style="display:flex;align-items:center;gap:1rem">
                  <a href="/pages/menu.html" style="text-decoration:none;color:#555;font-weight:500">HOME</a>
                  <a href="/pages/reports.html" style="text-decoration:none;color:#555;font-weight:500">LAPORAN</a>
                  <a href="/pages/facilities.html" style="text-decoration:none;color:#555;font-weight:500">FASILITAS</a>
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem">
                  ${
                    isLoggedIn
                      ? `
                    <span style="font-size:0.875rem;color:#555">Halo, ${user.name}</span>
                    <a href="/pages/profile.html" style="text-decoration:none;color:#2563eb;border:1px solid #2563eb;padding:0.25rem 0.75rem;border-radius:0.25rem;font-size:0.875rem">
                      <i class="fa-regular fa-circle-user"></i> Profil
                    </a>
                    <form action="/logout" method="POST" style="margin:0">
                      <input type="hidden" name="_csrf" value="${csrfToken}">
                      <button type="submit" style="background:none;border:1px solid #ef4444;color:#ef4444;padding:0.25rem 0.75rem;border-radius:0.25rem;font-size:0.875rem;cursor:pointer">
                        <i class="fas fa-sign-out-alt"></i> Keluar
                      </button>
                    </form>
                  `
                      : `
                    <a href="/login.html?role=citizen" style="text-decoration:none;color:#2563eb;border:1px solid #2563eb;padding:0.25rem 0.75rem;border-radius:0.25rem;font-size:0.875rem">Login</a>
                  `
                  }
                </div>
              </div>
            </nav>`;
    }

    let result = html.replace("<!--Navbar-->", navbar);
    if (html.includes("<!--Breadcrumb-->")) {
      const breadcrumb = isAdmin
        ? `
                <div class="bg-white border-b border-gray-100">
                  <div class="max-w-6xl mx-auto px-4 py-2.5 text-xs text-gray-500 flex items-center gap-1.5">
                    <a href="/pages/admin.html" class="hover:text-blue-600 transition-colors">Dashboard</a>
                    <i class="fa-solid fa-chevron-right text-[10px]"></i>
                    <a href="/pages/admin-facility-search.html" class="hover:text-blue-600 transition-colors">Fasilitas</a>
                    <i class="fa-solid fa-chevron-right text-[10px]"></i>
                    <span id="breadcrumbName" class="text-gray-700 font-medium">Detail</span>
                  </div>
                </div>`
        : `
                <div class="bg-white border-b border-gray-100">
                  <div class="max-w-6xl mx-auto px-4 py-2.5 text-xs text-gray-500 flex items-center gap-1.5">
                    <a href="/pages/menu.html" class="hover:text-blue-600 transition-colors">Beranda</a>
                    <i class="fa-solid fa-chevron-right text-[10px]"></i>
                    <a href="/pages/facilities.html" class="hover:text-blue-600 transition-colors">Fasilitas</a>
                    <i class="fa-solid fa-chevron-right text-[10px]"></i>
                    <span id="breadcrumbName" class="text-gray-700 font-medium">Detail</span>
                  </div>
                </div>`;
      result = result.replace("<!--Breadcrumb-->", breadcrumb);
    }

    result = result.replace(
      "</head>",
      `<meta name="csrf-token" content="${csrfToken}">\n</head>`
    );
    result = result.replace(
      "</body>",
      `<script src="/js/api.js"></script>\n</body>`
    );
    res.send(result);
  });
});

// ── Inject reCAPTCHA & CSRF into public auth pages (unchanged) ──
const publicAuthPages = ["/login.html", "/register.html"];
app.use((req, res, next) => {
  if (!publicAuthPages.includes(req.path)) return next();
  const filePath = path.join(__dirname, "public", req.path);
  if (!fs.existsSync(filePath)) return next();

  fs.readFile(filePath, "utf8", (err, html) => {
    if (err) return next();
    const csrfToken = req.csrfToken();
    let result = html.replace(
      /__RECAPTCHA_SITE_KEY__/g,
      process.env.RECAPTCHA_SITE_KEY || ""
    );
    result = result.replace(/__CSRF_TOKEN__/g, csrfToken);
    result = result.replace(
      "</head>",
      `<meta name="csrf-token" content="${csrfToken}">\n</head>`
    );
    result = result.replace(
      "</body>",
      `<script src="/js/api.js"></script>\n</body>`
    );
    res.send(result);
  });
});

// ─────────────────────────────────────────
// Static files
// ─────────────────────────────────────────
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// Root redirect (now uses req.user)
app.get("/", (req, res) => {
  if (req.user) return res.redirect("/pages/menu.html");
  res.redirect("/index.html");
});

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────
// ROUTES (same as before)
// ─────────────────────────────────────────
const citizenFlagRoutes = require("./routes/citizenflag");
app.use("/api/reports", citizenFlagRoutes);

const adminRoutes = require("./routes/admin");
app.use("/api/admin", adminRoutes);

const reportRoutes = require("./routes/reports");
app.use("/api/reports", actionLimiter, reportRoutes);

const commentRoutes = require("./routes/comments");
app.use("/api/reports/:id/comments", actionLimiter, commentRoutes);

const facilityRoutes = require("./Routes/facilityRoutes");
app.use("/api/facilities", actionLimiter, facilityRoutes);

// Public facilities list (unchanged)
app.get("/api/facilities", async (req, res) => {
  const Facility = require("./models/Facility");
  const facilities = await Facility.findAll({ order: [["name", "ASC"]] });
  res.json(facilities);
});

// Dynamic report detail page
app.get("/report-detail", (req, res) => {
  req.url = "/pages/report-detail.html";
  app.handle(req, res);
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: "Halaman tidak ditemukan" });
});

// ─────────────────────────────────────────
// Start server
// ─────────────────────────────────────────
sequelize
  .authenticate()
  .then(() => {
    console.log("Database terkoneksi (Sequelize)");
    app.listen(PORT, () =>
      console.log(`Server berjalan di http://localhost:${PORT}`)
    );
  })
  .catch((err) => console.error("Gagal koneksi database:", err));