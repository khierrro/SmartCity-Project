'use strict';

const roleConfig = {
  citizen: {
    pageTitle: "Login Warga - Smart City",
    loginTitle: "LOGIN WARGA",
    userIcon: "fa-solid fa-user fa-3x",
    leftPanelClass: "",
    rightTitle: "BELUM PUNYA AKUN?",
    rightText: "Daftar sekarang dan mulai gunakan layanan kami!",
    showRegister: true,
    buttonClass: "btn-primary",
  },
  admin: {
    pageTitle: "Login Admin - Smart City",
    loginTitle: "LOGIN ADMIN",
    userIcon: "fa-solid fa-user-shield fa-3x",
    leftPanelClass: "border-danger",
    rightTitle: "AKSES KHUSUS",
    rightText: "Hanya admin yang dapat login. Tidak ada pendaftaran untuk admin.",
    showRegister: false,
    buttonClass: "btn-danger",
  },
};

// Baca parameter role dari URL (contoh: ?role=admin atau ?role=citizen)
const params = new URLSearchParams(window.location.search);
const role = params.get("role") || "citizen";
const config = roleConfig[role] || roleConfig.citizen;

// Terapkan konfigurasi ke elemen HTML
document.getElementById("pageTitle").textContent = config.pageTitle;
document.getElementById("loginTitle").textContent = config.loginTitle;
document.getElementById("userIcon").className = config.userIcon;
document.getElementById("loginButton").className = `btn w-100 mb-2 ${config.buttonClass}`;
document.getElementById("rightTitle").textContent = config.rightTitle;
document.getElementById("rightText").textContent = config.rightText;

const registerLink = document.getElementById("registerLink");
if (config.showRegister) {
  registerLink.style.display = "inline-block";
} else {
  registerLink.style.display = "none";
}

// Tautan silang admin/warga
if (role === 'admin') {
  const link = document.createElement('p');
  link.className = 'text-center mt-2';
  link.innerHTML = '<small><a href="/login.html" class="text-muted">Warga? Login di sini</a></small>';
  document.querySelector('#leftPanel form').appendChild(link);
} else {
  const link = document.createElement('p');
  link.className = 'text-center mt-2';
  link.innerHTML = '<small><a href="/login.html?role=admin" class="text-muted">Admin? Login di sini</a></small>';
  document.querySelector('#leftPanel form').appendChild(link);
}

const leftPanel = document.getElementById("leftPanel");
if (config.leftPanelClass) {
  leftPanel.classList.add(config.leftPanelClass);
}

// Form submit – kirim role dari URL langsung ke server
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, role })   // ← role dikirim di sini
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.role === "admin") {
        window.location.href = "/pages/admin.html";
      } else {
        window.location.href = "/pages/menu.html";
      }
    } else {
      alert(data.message || "Login gagal");
    }
  } catch (err) {
    console.error(err);
    alert("Gagal terhubung ke server");
  }
});