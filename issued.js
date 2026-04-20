const API = 'http://localhost:3000/api';
let allIssued = [];

// ── Sidebar ──────────────────────────────────────────────────
function toggleSidebar() {
  const sb    = document.getElementById('sidebar');
  const shell = document.getElementById('appShell');
  const col   = sb.classList.toggle('collapsed');
  shell.classList.toggle('sidebar-collapsed', col);
  localStorage.setItem('sl_sidebar', col ? '1' : '0');
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('mobile-open');
  document.getElementById('overlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('overlay').classList.remove('show');
}
function loadSidebarState() {
  if (window.innerWidth <= 768) {
    document.getElementById('mobileMenuBtn').style.display = 'flex';
    return;
  }
  if (localStorage.getItem('sl_sidebar') === '1') {
    document.getElementById('sidebar').classList.add('collapsed');
    document.getElementById('appShell').classList.add('sidebar-collapsed');
  }
}

// ── Theme ────────────────────────────────────────────────────
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  document.getElementById('icon-sun').style.display  = isDark ? 'none'  : 'block';
  document.getElementById('icon-moon').style.display = isDark ? 'block' : 'none';
  localStorage.setItem('sl_theme', isDark ? 'dark' : 'light');
}
function loadTheme() {
  if (localStorage.getItem('sl_theme') === 'dark') {
    document.body.classList.add('dark');
    document.getElementById('icon-sun').style.display  = 'none';
    document.getElementById('icon-moon').style.display = 'block';
  }
}

// ── Toast ────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = 'default') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast toast--' + type;
  t.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.display = 'none'; }, 3000);
}

// ── Days since issue ─────────────────────────────────────────
function daysOut(issuedAt) {
  return Math.floor((Date.now() - new Date(issuedAt).getTime()) / 86400000);
}

// ── Stats ────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch(`${API}/stats`);
    const data = await res.json();
    document.getElementById('totalBooks').textContent = data.total;
    const badge = document.getElementById('sideIssuedCount');
    if (badge) badge.textContent = data.issued;
  } catch {}
}

function updateSummary(issued) {
  const unique  = new Set(issued.map(r => r.student.toLowerCase())).size;
  const overdue = issued.filter(r => daysOut(r.issuedAt) > 14).length;
  document.getElementById('sc-issued').textContent   = issued.length;
  document.getElementById('sc-students').textContent = unique;
  document.getElementById('sc-overdue').textContent  = overdue;
}

// ── Load all issued ──────────────────────────────────────────
async function loadAll() {
  try {
    const res = await fetch(`${API}/issued`);
    allIssued = await res.json();
    updateSummary(allIssued);
    applyFilters();
  } catch {
    showToast('Cannot connect to server. Is it running?', 'error');
  }
}

// ── Render table ─────────────────────────────────────────────
function renderIssued(list) {
  const tbody = document.getElementById('issuedList');
  const noRec = document.getElementById('noRecords');
  const badge = document.getElementById('recordBadge');

  badge.textContent = `${list.length} record${list.length !== 1 ? 's' : ''}`;

  if (!list.length) {
    tbody.innerHTML = '';
    noRec.style.display = 'block';
    return;
  }

  noRec.style.display = 'none';
  tbody.innerHTML = list.map((rec, i) => {
    const days    = daysOut(rec.issuedAt);
    const overdue = days > 14;
    return `
      <tr>
        <td style="color:var(--text-muted)">${i + 1}</td>
        <td style="font-weight:500">${rec.title}</td>
        <td style="color:var(--text-secondary)">${rec.author}</td>
        <td style="color:var(--text-secondary)">${rec.student}</td>
        <td style="color:var(--text-muted)">${rec.issueDate}</td>
        <td><span class="${overdue ? 'overdue' : 'days-out'}">${days}d${overdue ? ' ⚠' : ''}</span></td>
        <td><button class="btn btn-outline" onclick="returnBook(${rec.issueId})">Return</button></td>
      </tr>
    `;
  }).join('');
}

// ── Filters ──────────────────────────────────────────────────
function applyFilters() {
  const q    = document.getElementById('filterSearch').value.toLowerCase().trim();
  const mode = document.getElementById('filterOverdue').value;
  let filtered = allIssued;
  if (q)              filtered = filtered.filter(r => r.title.toLowerCase().includes(q) || r.student.toLowerCase().includes(q) || r.author.toLowerCase().includes(q));
  if (mode === 'overdue') filtered = filtered.filter(r => daysOut(r.issuedAt) > 14);
  renderIssued(filtered);
}

function clearFilters() {
  document.getElementById('filterSearch').value  = '';
  document.getElementById('filterOverdue').value = 'all';
  renderIssued(allIssued);
}

// ── Quick filter from sidebar ────────────────────────────────
function applyQuickFilter(type) {
  document.getElementById('filterSearch').value  = '';
  document.getElementById('filterOverdue').value = type === 'overdue' ? 'overdue' : 'all';
  applyFilters();

  // Highlight active sidebar filter
  document.getElementById('filter-all').classList.toggle('active', type === 'all');
  document.getElementById('filter-overdue').classList.toggle('active', type === 'overdue');
}

// ── Return ───────────────────────────────────────────────────
async function returnBook(issueId) {
  try {
    const res  = await fetch(`${API}/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueId })
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error, 'error'); return; }
    showToast(data.message, 'success');
    await loadStats();
    await loadAll();
  } catch { showToast('Server error.', 'error'); }
}

// ── Export CSV ───────────────────────────────────────────────
function exportCSV() {
  if (!allIssued.length) { showToast('No records to export.', 'error'); return; }
  const headers = ['#', 'Title', 'Author', 'Student', 'Issue Date', 'Days Out', 'Overdue'];
  const rows = allIssued.map((r, i) => {
    const days = daysOut(r.issuedAt);
    return [i+1, `"${r.title}"`, `"${r.author}"`, `"${r.student}"`, r.issueDate, days, days > 14 ? 'Yes' : 'No'];
  });
  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `issued-books-${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast('CSV exported!', 'success');
}

// ── Init ─────────────────────────────────────────────────────
loadTheme();
loadSidebarState();
loadStats();
loadAll();
