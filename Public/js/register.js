// public/js/register.js

const form = document.getElementById("registerForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const phoneInput = document.getElementById("phone");
const addressInput = document.getElementById("address");

const messageDiv = document.getElementById("message");

// ---------- Feedback helpers ----------
function showFieldFeedback(elementId, valid, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = `<span class="${valid ? 'text-success' : 'text-danger'}">
    <i class="fas fa-${valid ? 'check' : 'times'}-circle"></i> ${message}
  </span>`;
}

function clearFieldFeedback(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.innerHTML = '';
}

// ---------- Name validation ----------
nameInput.addEventListener("input", () => {
  const val = nameInput.value.trim();
  if (val.length === 0) {
    showFieldFeedback("nameFeedback", false, "Nama wajib diisi");
  } else if (val.length > 100) {
    showFieldFeedback("nameFeedback", false, "Nama maksimal 100 karakter");
  } else {
    showFieldFeedback("nameFeedback", true, "Nama valid");
  }
});

// ---------- Email validation ----------
emailInput.addEventListener("input", () => {
  const val = emailInput.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (val.length === 0) {
    showFieldFeedback("emailFeedback", false, "Email wajib diisi");
  } else if (!emailRegex.test(val)) {
    showFieldFeedback("emailFeedback", false, "Format email tidak valid");
  } else {
    showFieldFeedback("emailFeedback", true, "Email valid");
  }
});

// ---------- Phone validation (Indonesia) ----------
phoneInput.addEventListener("input", () => {
  const val = phoneInput.value.trim();
  const phoneRegex = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
  if (val.length === 0) {
    clearFieldFeedback("phoneFeedback");  // optional field
    return;
  }
  if (!phoneRegex.test(val)) {
    showFieldFeedback("phoneFeedback", false, "Format telepon tidak valid (contoh: 081234567890)");
  } else {
    showFieldFeedback("phoneFeedback", true, "Telepon valid");
  }
});

// ---------- Address validation ----------
addressInput.addEventListener("input", () => {
  const val = addressInput.value.trim();
  if (val.length > 500) {
    showFieldFeedback("addressFeedback", false, "Alamat maksimal 500 karakter");
  } else if (val.length === 0) {
    clearFieldFeedback("addressFeedback");  // optional
  } else {
    showFieldFeedback("addressFeedback", true, "Alamat valid");
  }
});

// ---------- Password strength rules (unchanged) ----------
const passwordFeedback = document.getElementById("passwordFeedback");
const rules = [
  { regex: /.{8,}/, msg: "Minimal 8 karakter" },
  { regex: /[A-Z]/, msg: "Mengandung huruf besar (A-Z)" },
  { regex: /[a-z]/, msg: "Mengandung huruf kecil (a-z)" },
  { regex: /[0-9]/, msg: "Mengandung angka (0-9)" },
  { regex: /[!@#$%^&*(),.?":{}|<>]/, msg: "Mengandung karakter khusus (!@#$%^&*)" },
];

passwordInput.addEventListener("input", () => {
  const value = passwordInput.value;
  let html = "";
  rules.forEach(rule => {
    const valid = rule.regex.test(value);
    html += `<div class="${valid ? "text-success" : "text-danger"}">
      <i class="fas fa-${valid ? "check" : "times"}-circle"></i> ${rule.msg}
    </div>`;
  });
  passwordFeedback.innerHTML = html;
});

// ---------- Form Submission ----------
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const phone = phoneInput.value.trim();
  const address = addressInput.value.trim();
  const recaptchaToken = grecaptcha.getResponse();
  
  if (!recaptchaToken) {
    alert("Please complete the reCAPTCHA");
    return;
  }

  const csrfToken = document.querySelector('input[name="_csrf"]').value;

  try {
    const res = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone, address, _csrf: csrfToken, "g-recaptcha-response": recaptchaToken }),
    });

    const data = await res.json();

    if (res.ok) {
      showMessage(data.message, "success");
      setTimeout(() => (window.location.href = "login.html"), 1500);
    } else {
      // ❌ Error from server
      if (data.errors && Array.isArray(data.errors)) {
        showMessage(data.errors.join("<br>"), "danger");
      } else if (data.message) {
        showMessage(data.message, "danger");
      }
      // 🔄 Reset reCAPTCHA on failure
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.reset();
      }
    }
  } catch (err) {
    console.error(err);
    showMessage("Gagal koneksi ke server", "danger");
    if (typeof grecaptcha !== 'undefined') {
      grecaptcha.reset();
    }
  }
});
function showMessage(msg, type) {
  if (messageDiv) {
    messageDiv.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
    setTimeout(() => (messageDiv.innerHTML = ""), 5000);
  }
}