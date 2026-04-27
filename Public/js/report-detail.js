'use strict';
const API = '/api';
let reportId = null;
let currentUser = null;
let reportData = null;

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json();
  if (!data?.success && res.status === 401) {
    window.location.href = '/login.html?role=citizen';
    return null;
  }
  return data;
}

document.addEventListener('DOMContentLoaded', async () => {
  // get report id from URL
  const params = new URLSearchParams(window.location.search);
  reportId = params.get('id');
  if (!reportId) {
    window.location.href = '/pages/reports.html';
    return;
  }

  // user info
  try {
    const me = await apiFetch('/me');
    if (me && me.loggedIn) {
      currentUser = me;
      document.getElementById('userName').textContent = me.name;
      document.getElementById('commentForm').classList.remove('hidden');
    }
  } catch (_) {}

  await loadReport();
  await loadComments();

  // event listeners
  document.getElementById('submitCommentBtn').addEventListener('click', submitComment);
  document.getElementById('cancelReplyBtn').addEventListener('click', cancelReply);
});

async function loadReport() {
  const container = document.getElementById('reportContainer');
  try {
    const data = await apiFetch(`${API}/reports/${reportId}`);
    if (!data) return;
    reportData = data.data;

    const r = reportData;
    const isAdmin = currentUser?.role === 'admin';

    container.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <h1 class="text-2xl font-bold">${esc(r.title)}</h1>
        <span class="px-2 py-0.5 rounded-full text-xs ${STATUS_BADGE[r.status]}">${r.status}</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
        <p><strong>Pelapor:</strong> ${esc(r.reporter)}</p>
        <p><strong>Fasilitas:</strong> ${esc(r.facility || '-')}</p>
        <p><strong>Lokasi:</strong> ${esc(r.location_text || '-')}</p>
        <p><strong>Tanggal:</strong> ${fmtDate(r.created_at)}</p>
        <p><strong>Vote:</strong> <span id="voteCountDisplay">${r.vote_count}</span></p>
      </div>
      <div class="mb-4">
        <h2 class="text-lg font-semibold mb-2">Deskripsi</h2>
        <p class="text-gray-700 whitespace-pre-line">${esc(r.description)}</p>
      </div>
      ${r.image_path ? `<img src="${r.image_path}" class="rounded-lg max-h-72 object-cover w-full mb-4">` : ''}

      <!-- Role-based actions -->
      <div class="flex gap-2 mt-4">
        ${isAdmin ? `
          <select id="adminStatusSelect" class="border rounded px-2 py-1 text-sm">
            <option value="new" ${r.status==='new'?'selected':''}>Baru</option>
            <option value="in_progress" ${r.status==='in_progress'?'selected':''}>Diproses</option>
            <option value="resolved" ${r.status==='resolved'?'selected':''}>Selesai</option>
            <option value="hidden" ${r.status==='hidden'?'selected':''}>Tersembunyi</option>
          </select>
          <button id="saveStatusBtn" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Simpan Status</button>
          <button id="deleteReportBtn" class="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Hapus</button>
        ` : ''}
        ${currentUser && !isAdmin ? `
          <button id="voteBtn" class="px-4 py-2 rounded text-sm ${r.hasVoted ? 'bg-green-600 text-white' : 'bg-blue-100 text-blue-700'}">
            <i class="fas fa-thumbs-up"></i> ${r.hasVoted ? 'Anda Mendukung' : 'Dukung'}
          </button>
          <button id="flagBtn" class="px-4 py-2 rounded text-sm bg-yellow-100 text-yellow-700">
            <i class="fas fa-flag"></i> ${r.flagged ? 'Telah Ditandai' : 'Tandai Laporan'}
          </button>
          <input type="text" id="flagReasonInput" placeholder="Alasan tandai (opsional)" class="border rounded px-2 py-1 text-sm" />
        ` : ''}
      </div>
    `;

    // Admin actions
    if (isAdmin) {
      document.getElementById('saveStatusBtn').addEventListener('click', saveStatus);
      document.getElementById('deleteReportBtn').addEventListener('click', deleteReport);
    }

    // Citizen actions
    if (currentUser && !isAdmin) {
      document.getElementById('voteBtn').addEventListener('click', toggleVote);
      document.getElementById('flagBtn').addEventListener('click', flagReport);
    }
  } catch (err) {
    container.innerHTML = '<p class="text-red-500">Gagal memuat laporan</p>';
  }
}

async function loadComments() {
  const list = document.getElementById('commentsList');
  try {
    const data = await apiFetch(`${API}/reports/${reportId}/comments`);
    const comments = data?.data || [];
    document.getElementById('commentCount').textContent = `(${comments.length})`;
    if (comments.length === 0) {
      list.innerHTML = '<p class="text-gray-500 text-sm">Belum ada komentar.</p>';
      return;
    }
    list.innerHTML = comments.map(c => renderComment(c)).join('');
    // bind reply buttons
    document.querySelectorAll('.reply-btn').forEach(btn => {
      btn.addEventListener('click', () => startReply(btn.dataset.id, btn.dataset.name));
    });
  } catch (err) {
    list.innerHTML = '<p class="text-red-500">Gagal memuat komentar</p>';
  }
}

function renderComment(c, depth = 0) {
  const replies = (c.Replies || []).map(r => renderComment(r, depth + 1)).join('');
  return `
    <div class="ml-${depth * 4} border-l-2 border-gray-100 pl-3 mb-3">
      <div class="bg-gray-50 rounded p-3">
        <p class="text-sm font-semibold">${esc(c.Author?.name || 'Anonim')}</p>
        <p class="text-sm text-gray-700">${esc(c.content)}</p>
        <p class="text-xs text-gray-400 mt-1">${fmtDate(c.created_at)}</p>
        <div class="flex gap-3 mt-2 text-xs">
          <button class="reply-btn text-blue-500 hover:underline" data-id="${c.id}" data-name="${esc(c.Author?.name || 'Anonim')}">Balas</button>
          ${c.is_edited ? '<span class="text-gray-400 italic">(diedit)</span>' : ''}
        </div>
      </div>
      ${replies}
    </div>
  `;
}

let replyToId = null;
function startReply(commentId, authorName) {
  replyToId = commentId;
  document.getElementById('commentInput').placeholder = `Membalas ${authorName}`;
  document.getElementById('cancelReplyBtn').classList.remove('hidden');
  document.getElementById('commentInput').focus();
}

function cancelReply() {
  replyToId = null;
  document.getElementById('commentInput').placeholder = 'Tulis komentar...';
  document.getElementById('cancelReplyBtn').classList.add('hidden');
}

async function submitComment() {
  const content = document.getElementById('commentInput').value.trim();
  if (!content) return;

  const body = { content };
  if (replyToId) body.parent_id = replyToId;

  try {
    const data = await apiFetch(`${API}/reports/${reportId}/comments`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    if (data?.success) {
      document.getElementById('commentInput').value = '';
      if (replyToId) cancelReply();
      loadComments();
    }
  } catch (err) {
    alert('Gagal mengirim komentar');
  }
}

// Admin actions
async function saveStatus() {
  const status = document.getElementById('adminStatusSelect').value;
  const data = await apiFetch(`${API}/reports/${reportId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  if (data?.success) {
    // update badge
    reportData.status = status;
    const badge = document.querySelector(`#reportContainer span`);
    if (badge) badge.className = `px-2 py-0.5 rounded-full text-xs ${STATUS_BADGE[status]}`;
    badge.textContent = status;
  }
}

async function deleteReport() {
  if (!confirm('Hapus permanen?')) return;
  const data = await apiFetch(`${API}/reports/${reportId}`, { method: 'DELETE' });
  if (data?.success) {
    alert('Laporan dihapus');
    window.location.href = '/pages/admin.html';
  }
}

// Citizen actions
async function toggleVote() {
  const data = await apiFetch(`${API}/reports/${reportId}/vote`, { method: 'POST' });
  if (!data) return;
  reportData.hasVoted = data.voted;
  reportData.vote_count = data.vote_count;
  document.getElementById('voteCountDisplay').textContent = data.vote_count;
  const btn = document.getElementById('voteBtn');
  if (data.voted) {
    btn.className = 'px-4 py-2 rounded text-sm bg-green-600 text-white';
    btn.innerHTML = '<i class="fas fa-thumbs-up"></i> Anda Mendukung';
  } else {
    btn.className = 'px-4 py-2 rounded text-sm bg-blue-100 text-blue-700';
    btn.innerHTML = '<i class="fas fa-thumbs-up"></i> Dukung';
  }
}

async function flagReport() {
  const reason = document.getElementById('flagReasonInput')?.value?.trim() || '';
  const data = await apiFetch(`${API}/reports/${reportId}/flag`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  if (data?.success) {
    alert('Laporan telah ditandai');
    document.getElementById('flagBtn').innerHTML = '<i class="fas fa-flag"></i> Telah Ditandai';
    document.getElementById('flagBtn').classList.add('bg-red-100', 'text-red-700');
  }
}

const STATUS_BADGE = {
  new:         'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  resolved:    'bg-green-100 text-green-700',
  hidden:      'bg-gray-200 text-gray-600',
};
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '-'; }
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }