// public/script/login.js
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

const params = new URLSearchParams(window.location.search);
const role = params.get("role") || "citizen";
const config = roleConfig[role] || roleConfig.citizen;

// Terapkan ke elemen HTML
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

// Jika admin, tambahkan tautan "Warga? Login di sini" di bawah tombol
if (role === 'admin') {
  const link = document.createElement('p');
  link.className = 'text-center mt-2';
  link.innerHTML = '<small><a href="/login.html" class="text-muted">Warga? Login di sini</a></small>';
  document.querySelector('#leftPanel form').appendChild(link);
} else {
  // Jika warga, tambahkan tautan "Admin? Login di sini"
  const link = document.createElement('p');
  link.className = 'text-center mt-2';
  link.innerHTML = '<small><a href="/login.html?role=admin" class="text-muted">Admin? Login di sini</a></small>';
  document.querySelector('#leftPanel form').appendChild(link);
}

const leftPanel = document.getElementById("leftPanel");
if (config.leftPanelClass) {
  leftPanel.classList.add(config.leftPanelClass);
}

// Form submit
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("user", JSON.stringify(data.user));
      // Redirect sesuai role
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