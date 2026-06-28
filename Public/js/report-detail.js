"use strict";
const API = "/api";
let reportId = null;
let currentUser = null;
let replyToId = null;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  reportId = params.get("id");
  if (!reportId) return (window.location.href = "/pages/reports.html");

  try {
    const me = await apiFetch("/me");
    if (me && me.loggedIn) currentUser = me;
  } catch (_) {}

  await loadReport();
  await loadComments();

  document
    .getElementById("submitCommentBtn")
    ?.addEventListener("click", submitComment);
  document
    .getElementById("cancelReplyBtn")
    ?.addEventListener("click", cancelReply);
  document
    .getElementById("confirmFlagBtn")
    ?.addEventListener("click", flagReport);
});

async function loadReport() {
  const cont = document.getElementById("reportContainer");
  try {
    const data = await apiFetch(`${API}/reports/${reportId}`);
    if (!data)
      return (cont.innerHTML =
        '<p class="text-danger">Gagal memuat laporan.</p>');
    const r = data.data;
    const isAdmin = currentUser?.role === "admin";

    const statusBadge = {
      new: "bg-primary",
      in_progress: "bg-warning text-dark",
      resolved: "bg-success",
      hidden: "bg-secondary",
    };

    // Prepare flag list HTML for admin
    let flagListHtml = "";
    if (isAdmin && r.flags) {
      if (r.flags.length === 0) {
        flagListHtml = '<p class="text-muted mt-2">Belum ada tanda.</p>';
      } else {
        flagListHtml = `
          <div class="mt-3">
            <h6><i class="fas fa-flag"></i> Daftar Tanda</h6>
            <ul class="list-group list-group-flush">
              ${r.flags
                .map(
                  (f) => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>${esc(f.user_name)}</strong>
                    <p class="mb-0 text-muted small">${esc(f.reason)}</p>
                  </div>
                  <small class="text-muted">${fmtDate(f.created_at)}</small>
                </li>
              `,
                )
                .join("")}
            </ul>
          </div>
        `;
      }
    }

    // Show comment form only if allowed
    if (r.can_comment) {
      document.getElementById("commentForm").style.display = "block";
    }

    cont.innerHTML = `
      <div class="d-flex justify-content-between align-items-start mb-3">
        <h2 class="fw-bold">${esc(r.title)}</h2>
        <span class="badge ${statusBadge[r.status] || "bg-secondary"}">${r.status}</span>
      </div>
      <div class="row mb-3">
        <div class="col-md-6"><strong>Pelapor:</strong> ${esc(r.reporter)}</div>
        <div class="col-md-6"><strong>Fasilitas:</strong> ${esc(r.facility || "-")}</div>
        <div class="col-md-6"><strong>Lokasi:</strong> ${esc(r.location_text || "-")}</div>
        <div class="col-md-6"><strong>Tanggal:</strong> ${fmtDate(r.created_at)}</div>
        <div class="col-md-3"><strong>👍 Vote:</strong> <span id="voteCountDisplay">${r.vote_count}</span></div>
        <div class="col-md-3"><strong>🚩 Flag:</strong> <span id="flagCountDisplay">${r.flag_count || 0}</span></div>
      </div>
      <h5>Deskripsi</h5>
      <p class="text-muted">${esc(r.description)}</p>
      ${r.image_path ? `<img src="${r.image_path}" class="img-fluid rounded mb-3" style="max-height:300px;">` : ""}

      ${flagListHtml}

      <div class="d-flex gap-2 mt-3">
        ${
          isAdmin
            ? `
          <select id="adminStatusSelect" class="form-select w-auto">
            <option value="new" ${r.status === "new" ? "selected" : ""}>Baru</option>
            <option value="in_progress" ${r.status === "in_progress" ? "selected" : ""}>Diproses</option>
            <option value="resolved" ${r.status === "resolved" ? "selected" : ""}>Selesai</option>
            <option value="hidden" ${r.status === "hidden" ? "selected" : ""}>Tersembunyi</option>
          </select>
          <button id="saveStatusBtn" class="btn btn-sm btn-primary">Simpan Status</button>
          <button id="deleteReportBtn" class="btn btn-sm btn-danger">Hapus</button>
        `
            : ""
        }
        ${
          currentUser && !isAdmin
            ? `
          <button id="voteBtn" class="btn btn-sm ${r.hasVoted ? "btn-success" : "btn-outline-primary"}">
            <i class="fas fa-thumbs-up"></i> ${r.hasVoted ? "Anda Mendukung" : "Dukung"}
          </button>
          <button id="flagBtn" class="btn btn-sm btn-outline-warning" data-bs-toggle="modal" data-bs-target="#flagModal">
            <i class="fas fa-flag"></i> ${r.flagged ? "Telah Ditandai" : "Tandai"}
          </button>
        `
            : ""
        }
      </div>
    `;

    // Replace addEventListener with onclick — overwrites instead of stacking
    if (currentUser && !isAdmin) {
      document.getElementById("voteBtn").onclick = toggleVote;
    }
    if (isAdmin) {
      document.getElementById("saveStatusBtn").onclick = saveStatus;
      document.getElementById("deleteReportBtn").onclick = deleteReport;
    }
  } catch (err) {
    cont.innerHTML = '<p class="text-danger">Gagal memuat laporan.</p>';
  }
}
// ---------- admin actions ----------
async function saveStatus() {
  const status = document.getElementById("adminStatusSelect").value;
  await apiFetch(`${API}/reports/${reportId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  loadReport();
}
async function deleteReport() {
  if (!confirm("Hapus laporan ini?")) return;
  const data = await apiFetch(`${API}/reports/${reportId}`, {
    method: "DELETE",
  });
  if (data?.success) {
    showToast("Laporan berhasil dihapus", "success");
    setTimeout(() => {
      window.location.href = "/pages/admin.html"; // admin dashboard
    }, 800);
  } else {
    showToast("Gagal menghapus laporan", "error");
  }
}

// ---------- citizen actions ----------
async function toggleVote() {
  const btn = document.getElementById("voteBtn");
  if (btn.disabled) return; // guard against rapid re-entry
  btn.disabled = true;

  try {
    const data = await apiFetch(`${API}/reports/${reportId}/vote`, {
      method: "POST",
    });
    if (!data) return;
    document.getElementById("voteCountDisplay").textContent = data.vote_count;
    if (data.voted) {
      btn.className = "btn btn-sm btn-success";
      btn.innerHTML = '<i class="fas fa-thumbs-up"></i> Anda Mendukung';
    } else {
      btn.className = "btn btn-sm btn-outline-primary";
      btn.innerHTML = '<i class="fas fa-thumbs-up"></i> Dukung';
    }
  } finally {
    btn.disabled = false; // always re-enable
  }
}

async function flagReport() {
  const reason = document.getElementById("flagReasonModal").value.trim();
  const btn = document.getElementById("confirmFlagBtn");
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menandai...';

  try {
    // apiFetch already returns parsed JSON – no .json() needed
    const data = await apiFetch(`/api/reports/${reportId}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    if (data.success) {
      // Increase flag count on page
      const flagCountEl = document.getElementById("flagCountDisplay");
      flagCountEl.textContent = parseInt(flagCountEl.textContent) + 1;
      // Change flag button appearance
      const flagBtn = document.getElementById("flagBtn");
      flagBtn.innerHTML = '<i class="fas fa-flag"></i> Telah Ditandai';
      flagBtn.classList.remove("btn-outline-warning");
      flagBtn.classList.add("btn-outline-danger");
      // Hide modal
      bootstrap.Modal.getInstance(document.getElementById("flagModal")).hide();
    } else {
      // Show backend message (e.g., "Anda sudah menandai...")
      alert(data.message || "Gagal menandai laporan");
    }
  } catch (err) {
    // This will only trigger for network errors now
    alert("Gagal terhubung ke server");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-flag"></i> Tandai';
  }
}
function renderComment(c) {
  const authorName = c.Author?.name ?? "Anonim";
  const dateStr = fmtDate(c.created_at);
  const repliesHtml =
    c.Replies && c.Replies.length > 0
      ? `<div class="ms-4 mt-2">${c.Replies.map((r) => renderComment(r)).join("")}</div>`
      : "";

  return `
    <div class="d-flex mb-3" id="comment-${c.id}">
      <div class="flex-shrink-0 me-2">
        <i class="fas fa-user-circle fa-2x text-secondary"></i>
      </div>
      <div class="flex-grow-1">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <strong>${esc(authorName)}</strong>
            <small class="text-muted ms-2">${dateStr}</small>
            ${c.is_edited ? '<small class="text-muted ms-1">(diedit)</small>' : ""}
          </div>
          ${
            c.can_edit
              ? `
            <div>
              <button class="btn btn-sm btn-link text-decoration-none edit-comment-btn"
                      data-id="${c.id}" data-content="${esc(c.content)}">
                <i class="fas fa-pen"></i>
              </button>
              <button class="btn btn-sm btn-link text-danger text-decoration-none delete-comment-btn"
                      data-id="${c.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          `
              : ""
          }
        </div>
        <div class="mt-1" id="comment-text-${c.id}">${esc(c.content)}</div>
        <button class="btn btn-sm btn-link text-decoration-none reply-btn mt-1"
                data-id="${c.id}" data-name="${esc(authorName)}">
          <i class="fas fa-reply"></i> Balas
        </button>
        ${repliesHtml}
      </div>
    </div>
  `;
}
// ---------- comments ----------
async function loadComments() {
  const list = document.getElementById("commentsList");
  try {
    const data = await apiFetch(`${API}/reports/${reportId}/comments`);
    const comments = data?.data || [];
    document.getElementById("commentCount").textContent =
      `(${comments.length})`;

    if (comments.length === 0) {
      list.innerHTML = '<p class="text-muted">Belum ada komentar.</p>';
      return;
    }

    list.innerHTML = comments.map((c) => renderComment(c)).join("");

    // ── Reply buttons ──
    list.querySelectorAll(".reply-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        startReply(btn.dataset.id, btn.dataset.name),
      );
    });

    // ── Edit / Delete / Perform / Cancel via delegation ──
    list.addEventListener("click", (e) => {
      const editBtn = e.target.closest(".edit-comment-btn");
      const deleteBtn = e.target.closest(".delete-comment-btn");
      const performBtn = e.target.closest(".perform-edit-btn");
      const cancelBtn = e.target.closest(".cancel-edit-btn");

      if (editBtn) {
        e.preventDefault();
        startEditComment(editBtn.dataset.id, editBtn.dataset.content);
      }
      if (deleteBtn) {
        e.preventDefault();
        deleteComment(deleteBtn.dataset.id);
      }
      if (performBtn) performEdit(performBtn.dataset.id);
      if (cancelBtn) loadComments();
    });
  } catch (err) {
    list.innerHTML = '<p class="text-danger">Gagal memuat komentar.</p>';
  }
}
async function editComment(commentId, currentContent) {
  const newContent = prompt("Edit komentar Anda:", currentContent);
  if (newContent === null || newContent.trim() === "") return; // cancelled or empty

  try {
    const data = await apiFetch(`/api/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify({ content: newContent.trim() }),
    });
    if (data?.success) {
      loadComments(); // refresh list
    } else {
      alert(data?.message || "Gagal mengedit komentar");
    }
  } catch (err) {
    alert("Gagal terhubung ke server");
  }
}
async function deleteComment(commentId) {
  if (!confirm("Hapus komentar ini?")) return;

  try {
    const data = await apiFetch(`/api/comments/${commentId}`, {
      method: "DELETE",
    });
    if (data?.success) {
      loadComments(); // refresh list
    } else {
      alert(data?.message || "Gagal menghapus komentar");
    }
  } catch (err) {
    alert("Gagal terhubung ke server");
  }
}
function startReply(id, name) {
  replyToId = id;
  document.getElementById("commentInput").placeholder = `Balas ${name}...`;
  document.getElementById("cancelReplyBtn").style.display = "inline-block";
  document.getElementById("commentInput").focus();
}

function cancelReply() {
  replyToId = null;
  document.getElementById("commentInput").placeholder = "Tulis komentar...";
  document.getElementById("cancelReplyBtn").style.display = "none";
}

async function submitComment() {
  const content = document.getElementById("commentInput").value.trim();
  if (!content) return;
  const body = { content };
  if (replyToId) body.parent_id = replyToId;
  const data = await apiFetch(`${API}/reports/${reportId}/comments`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (data?.success) {
    document.getElementById("commentInput").value = "";
    cancelReply();
    loadComments();
  } else {
    alert(data?.message || "Gagal");
  }
}
// ---------- inline comment editing ----------
function startEditComment(commentId, currentContent) {
  const textEl = document.getElementById(`comment-text-${commentId}`);
  if (!textEl) return;

  textEl.innerHTML = `
    <textarea id="edit-text-${commentId}" class="form-control form-control-sm mb-1"
      rows="2" style="resize:none;">${currentContent}</textarea>
    <div class="d-flex gap-1">
      <button class="btn btn-sm btn-primary perform-edit-btn" data-id="${commentId}">
        <i class="fas fa-save"></i>
      </button>
      <button class="btn btn-sm btn-secondary cancel-edit-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
}
async function performEdit(commentId) {
  const textarea = document.getElementById(`edit-text-${commentId}`);
  const newContent = textarea.value.trim();
  if (!newContent) return alert("Komentar tidak boleh kosong");

  const data = await apiFetch(`/api/comments/${commentId}`, {
    method: "PUT",
    body: JSON.stringify({ content: newContent }),
  });

  if (data?.success) {
    loadComments(); // refresh the whole list
  } else {
    alert(data?.message || "Gagal mengedit komentar");
  }
}
function showToast(msg, type) {
  const t = document.createElement("div");
  t.className = `fixed bottom-4 right-4 z-50 px-5 py-3 rounded-lg text-white text-sm ${type === "success" ? "bg-green-600" : "bg-red-600"}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
