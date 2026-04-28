'use strict';
const API = '/api';
let reportId = null;
let currentUser = null;
let replyToId = null;

const apiFetch = async (url, options = {}) => {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const data = await res.json();
  if (!data?.success && res.status === 401) {
    window.location.href = '/login.html?role=citizen';
    return null;
  }
  return data;
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '-';
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  reportId = params.get('id');
  if (!reportId) return window.location.href = '/pages/reports.html';

  try {
    const me = await apiFetch('/me');
    if (me && me.loggedIn) currentUser = me;
  } catch (_) {}

  await loadReport();
  await loadComments();

  document.getElementById('submitCommentBtn')?.addEventListener('click', submitComment);
  document.getElementById('cancelReplyBtn')?.addEventListener('click', cancelReply);
  document.getElementById('confirmFlagBtn')?.addEventListener('click', flagReport);
});

async function loadReport() {
  const cont = document.getElementById('reportContainer');
  try {
    const data = await apiFetch(`${API}/reports/${reportId}`);
    if (!data) return cont.innerHTML = '<p class="text-danger">Gagal memuat laporan.</p>';
    const r = data.data;
    const isAdmin = currentUser?.role === 'admin';

    const statusBadge = {
      new: 'bg-primary', in_progress: 'bg-warning text-dark', resolved: 'bg-success', hidden: 'bg-secondary'
    };

    // Prepare flag list HTML for admin
    let flagListHtml = '';
    if (isAdmin && r.flags) {
      if (r.flags.length === 0) {
        flagListHtml = '<p class="text-muted mt-2">Belum ada tanda.</p>';
      } else {
        flagListHtml = `
          <div class="mt-3">
            <h6><i class="fas fa-flag"></i> Daftar Tanda</h6>
            <ul class="list-group list-group-flush">
              ${r.flags.map(f => `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <strong>${esc(f.user_name)}</strong>
                    <p class="mb-0 text-muted small">${esc(f.reason)}</p>
                  </div>
                  <small class="text-muted">${fmtDate(f.created_at)}</small>
                </li>
              `).join('')}
            </ul>
          </div>
        `;
      }
    }

    // Show comment form only if allowed
    if (r.can_comment) {
      document.getElementById('commentForm').style.display = 'block';
    }

    cont.innerHTML = `
      <div class="d-flex justify-content-between align-items-start mb-3">
        <h2 class="fw-bold">${esc(r.title)}</h2>
        <span class="badge ${statusBadge[r.status] || 'bg-secondary'}">${r.status}</span>
      </div>
      <div class="row mb-3">
        <div class="col-md-6"><strong>Pelapor:</strong> ${esc(r.reporter)}</div>
        <div class="col-md-6"><strong>Fasilitas:</strong> ${esc(r.facility || '-')}</div>
        <div class="col-md-6"><strong>Lokasi:</strong> ${esc(r.location_text || '-')}</div>
        <div class="col-md-6"><strong>Tanggal:</strong> ${fmtDate(r.created_at)}</div>
        <div class="col-md-3"><strong>👍 Vote:</strong> <span id="voteCountDisplay">${r.vote_count}</span></div>
        <div class="col-md-3"><strong>🚩 Flag:</strong> <span id="flagCountDisplay">${r.flag_count || 0}</span></div>
      </div>
      <h5>Deskripsi</h5>
      <p class="text-muted">${esc(r.description)}</p>
      ${r.image_path ? `<img src="${r.image_path}" class="img-fluid rounded mb-3" style="max-height:300px;">` : ''}

      ${flagListHtml}

      <div class="d-flex gap-2 mt-3">
        ${isAdmin ? `
          <select id="adminStatusSelect" class="form-select w-auto">
            <option value="new" ${r.status==='new'?'selected':''}>Baru</option>
            <option value="in_progress" ${r.status==='in_progress'?'selected':''}>Diproses</option>
            <option value="resolved" ${r.status==='resolved'?'selected':''}>Selesai</option>
            <option value="hidden" ${r.status==='hidden'?'selected':''}>Tersembunyi</option>
          </select>
          <button id="saveStatusBtn" class="btn btn-sm btn-primary">Simpan Status</button>
          <button id="deleteReportBtn" class="btn btn-sm btn-danger">Hapus</button>
        ` : ''}
        ${currentUser && !isAdmin ? `
          <button id="voteBtn" class="btn btn-sm ${r.hasVoted ? 'btn-success' : 'btn-outline-primary'}">
            <i class="fas fa-thumbs-up"></i> ${r.hasVoted ? 'Anda Mendukung' : 'Dukung'}
          </button>
          <button id="flagBtn" class="btn btn-sm btn-outline-warning" data-bs-toggle="modal" data-bs-target="#flagModal">
            <i class="fas fa-flag"></i> ${r.flagged ? 'Telah Ditandai' : 'Tandai'}
          </button>
        ` : ''}
      </div>
    `;

    if (isAdmin) {
      document.getElementById('saveStatusBtn').addEventListener('click', saveStatus);
      document.getElementById('deleteReportBtn').addEventListener('click', deleteReport);
    }
    if (currentUser && !isAdmin) {
      document.getElementById('voteBtn').addEventListener('click', toggleVote);
    }
  } catch (err) {
    cont.innerHTML = '<p class="text-danger">Gagal memuat laporan.</p>';
  }
}
// ---------- admin actions ----------
async function saveStatus() {
  const status = document.getElementById('adminStatusSelect').value;
  await apiFetch(`${API}/reports/${reportId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  loadReport();
}
async function deleteReport() {
  if (!confirm('Hapus laporan ini?')) return;
  const data = await apiFetch(`${API}/reports/${reportId}`, { method: 'DELETE' });
  if (data?.success) {
    showToast('Laporan berhasil dihapus', 'success');
    setTimeout(() => {
      window.location.href = '/pages/admin.html';   // admin dashboard
    }, 800);
  } else {
    showToast('Gagal menghapus laporan', 'error');
  }
}

// ---------- citizen actions ----------
async function toggleVote() {
  const data = await apiFetch(`${API}/reports/${reportId}/vote`, { method: 'POST' });
  if (!data) return;
  document.getElementById('voteCountDisplay').textContent = data.vote_count;
  const btn = document.getElementById('voteBtn');
  if (data.voted) {
    btn.className = 'btn btn-sm btn-success';
    btn.innerHTML = '<i class="fas fa-thumbs-up"></i> Anda Mendukung';
  } else {
    btn.className = 'btn btn-sm btn-outline-primary';
    btn.innerHTML = '<i class="fas fa-thumbs-up"></i> Dukung';
  }
}

async function flagReport() {
  const reason = document.getElementById('flagReasonModal').value.trim();
  const btn = document.getElementById('confirmFlagBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menandai...';

  try {
    const res = await fetch(`/api/reports/${reportId}/flag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();

    if (data.success) {
      // Increase flag count on page
      const flagCountEl = document.getElementById('flagCountDisplay');
      flagCountEl.textContent = parseInt(flagCountEl.textContent) + 1;
      // Change flag button appearance
      const flagBtn = document.getElementById('flagBtn');
      flagBtn.innerHTML = '<i class="fas fa-flag"></i> Telah Ditandai';
      flagBtn.classList.remove('btn-outline-warning');
      flagBtn.classList.add('btn-outline-danger');
      // Hide modal
      bootstrap.Modal.getInstance(document.getElementById('flagModal')).hide();
    } else {
      alert(data.message || 'Gagal menandai laporan');
    }
  } catch (err) {
    alert('Gagal terhubung ke server');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-flag"></i> Tandai';
  }
}
// ---------- comments ----------
async function loadComments() {
  const list = document.getElementById('commentsList');
  try {
    const data = await apiFetch(`${API}/reports/${reportId}/comments`);
    const comments = data?.data || [];
    document.getElementById('commentCount').textContent = `(${comments.length})`;
    if (comments.length === 0) {
      list.innerHTML = '<p class="text-muted">Belum ada komentar.</p>';
      return;
    }
    list.innerHTML = comments.map(c => renderComment(c)).join('');
    document.querySelectorAll('.reply-btn').forEach(btn => {
      btn.addEventListener('click', () => startReply(btn.dataset.id, btn.dataset.name));
    });
  } catch (err) {
    list.innerHTML = '<p class="text-danger">Gagal memuat komentar.</p>';
  }
}

function renderComment(c, depth = 0) {
  const replies = (c.Replies || []).map(r => renderComment(r, depth + 1)).join('');
  const isOwner = currentUser && currentUser.id === c.user_id;
  const showActions = c.can_edit;   // ← now from backend

  return `
    <div class="ms-${depth * 3} border-start border-2 ps-3 mb-3">
      <div class="bg-light rounded p-2">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <strong class="small">${esc(c.Author?.name || 'Anonim')}</strong>
            <small class="text-muted ms-2">${fmtDate(c.created_at)}</small>
            ${c.is_edited ? '<span class="text-muted fst-italic small ms-1">(diedit)</span>' : ''}
          </div>
          ${showActions ? `
            <div class="dropdown">
              <button class="btn btn-link btn-sm text-muted" data-bs-toggle="dropdown">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><a class="dropdown-item" href="#" onclick="startEditComment(${c.id}, '${esc(c.content)}')"><i class="fas fa-pen me-2"></i>Edit</a></li>
                <li><a class="dropdown-item text-danger" href="#" onclick="deleteComment(${c.id})"><i class="fas fa-trash me-2"></i>Hapus</a></li>
              </ul>
            </div>
          ` : ''}
        </div>
        <p class="mb-1 small" id="comment-text-${c.id}">${esc(c.content)}</p>
        ${currentUser ? `<button class="reply-btn btn btn-link btn-sm p-0" data-id="${c.id}" data-name="${esc(c.Author?.name || 'Anonim')}">Balas</button>` : ''}
      </div>
      ${replies}
    </div>
  `;
}
async function editComment(commentId, currentContent) {
  const newContent = prompt('Edit komentar Anda:', currentContent);
  if (newContent === null || newContent.trim() === '') return;  // cancelled or empty

  try {
    const data = await apiFetch(`/api/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content: newContent.trim() })
    });
    if (data?.success) {
      loadComments(); // refresh list
    } else {
      alert(data?.message || 'Gagal mengedit komentar');
    }
  } catch (err) {
    alert('Gagal terhubung ke server');
  }
}
async function deleteComment(commentId) {
  if (!confirm('Hapus komentar ini?')) return;

  try {
    const data = await apiFetch(`/api/comments/${commentId}`, { method: 'DELETE' });
    if (data?.success) {
      loadComments(); // refresh list
    } else {
      alert(data?.message || 'Gagal menghapus komentar');
    }
  } catch (err) {
    alert('Gagal terhubung ke server');
  }
}
function startReply(id, name) {
  replyToId = id;
  document.getElementById('commentInput').placeholder = `Balas ${name}...`;
  document.getElementById('cancelReplyBtn').style.display = 'inline-block';
  document.getElementById('commentInput').focus();
}

function cancelReply() {
  replyToId = null;
  document.getElementById('commentInput').placeholder = 'Tulis komentar...';
  document.getElementById('cancelReplyBtn').style.display = 'none';
}

async function submitComment() {
  const content = document.getElementById('commentInput').value.trim();
  if (!content) return;
  const body = { content };
  if (replyToId) body.parent_id = replyToId;
  const data = await apiFetch(`${API}/reports/${reportId}/comments`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  if (data?.success) {
    document.getElementById('commentInput').value = '';
    cancelReply();
    loadComments();
  } else {
    alert(data?.message || 'Gagal');
  }
}
// ---------- inline comment editing ----------
function startEditComment(commentId, currentContent) {
  const textEl = document.getElementById(`comment-text-${commentId}`);
  if (!textEl) return;

  // Replace the comment text with a textarea and Save/Cancel buttons
  textEl.innerHTML = `
    <textarea id="edit-text-${commentId}" class="form-control form-control-sm mb-1" rows="2" style="resize:none;">${currentContent}</textarea>
    <div class="d-flex gap-1">
      <button class="btn btn-sm btn-primary" onclick="performEdit(${commentId})">
        <i class="fas fa-save"></i>
      </button>
      <button class="btn btn-sm btn-secondary" onclick="loadComments()">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
}

async function performEdit(commentId) {
  const textarea = document.getElementById(`edit-text-${commentId}`);
  const newContent = textarea.value.trim();
  if (!newContent) return alert('Komentar tidak boleh kosong');

  const data = await apiFetch(`/api/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ content: newContent })
  });

  if (data?.success) {
    loadComments(); // refresh the whole list
  } else {
    alert(data?.message || 'Gagal mengedit komentar');
  }
}
function showToast(msg, type) {
  const t = document.createElement('div');
  t.className = `fixed bottom-4 right-4 z-50 px-5 py-3 rounded-lg text-white text-sm ${type==='success'?'bg-green-600':'bg-red-600'}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
window.startEditComment = startEditComment;
window.performEdit = performEdit;
window.deleteComment = deleteComment;