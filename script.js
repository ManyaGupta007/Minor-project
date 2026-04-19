const API = 'http://localhost:3000/api';
let searchTimer  = null;
let isSearchMode = false;
let activeCategory = ''; // track what category sidebar has selected

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

// ── Sidebar category active state ────────────────────────────
function setActiveCatNav(cat) {
  // Remove active from all catalogue nav items
  document.querySelectorAll('.cat-nav').forEach(el => el.classList.remove('active'));
  // Add active to the matching one
  const target = document.querySelector(`.cat-nav[data-cat="${CSS.escape(cat)}"]`);
  if (target) target.classList.add('active');
  activeCategory = cat;
}

// ── Filter by category — called from sidebar buttons ─────────
function filterByCategory(cat) {
  // Set the dropdown to match (for when user also uses the dropdown)
  const sel = document.getElementById('categoryFilter');
  if (sel) sel.value = cat;

  // Clear search text
  const searchBox = document.getElementById('searchBox');
  if (searchBox) searchBox.value = '';

  // Highlight sidebar
  setActiveCatNav(cat);

  // If empty = All Books = go back to featured
  if (!cat) {
    loadFeatured();
    return;
  }

  // Otherwise fetch that category from backend
  fetchCategory(cat);
}

// ── Fetch a specific category directly ──────────────────────
async function fetchCategory(cat) {
  setLoading();
  isSearchMode = true;
  try {
    const res   = await fetch(`${API}/books/search?category=${encodeURIComponent(cat)}`);
    const books = await res.json();
    if (!books.length) {
      setHint('empty', '', cat);
      setError(`No books found in "${cat}"`);
    } else {
      setHint('category', '', cat, books.length);
      renderBooks(books);
    }
  } catch {
    setError('Server error. Try again.');
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

// ── Stats ────────────────────────────────────────────────────
async function loadStats() {
  try {
    const res  = await fetch(`${API}/stats`);
    const data = await res.json();
    document.getElementById('totalBooks').textContent     = data.total;
    document.getElementById('availableCount').textContent = data.available;
    document.getElementById('issuedCount').textContent    = data.issued;
    const badge = document.getElementById('sideIssuedCount');
    if (badge) badge.textContent = data.issued;
  } catch {}
}

// ── Categories dropdown ──────────────────────────────────────
async function loadCategories() {
  try {
    const res  = await fetch(`${API}/books/categories`);
    const cats = await res.json();
    const sel  = document.getElementById('categoryFilter');
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c; opt.textContent = c;
      sel.appendChild(opt);
    });
  } catch {}
}


// ── Category counts in sidebar badges ───────────────────────
async function loadCategoryBadges() {
  try {
    const res   = await fetch(`${API}/books`);
    const books = await res.json();

    // Count per category
    const counts = {};
    books.forEach(b => { counts[b.category] = (counts[b.category] || 0) + 1; });

    // Update each sidebar badge
    document.querySelectorAll('.cat-badge').forEach(el => {
      const cat = el.dataset.cat;
      el.textContent = counts[cat] || 0;
    });
  } catch {}
}
 

// ── Featured (homepage default) ──────────────────────────────
async function loadFeatured() {
  setLoading();
  setActiveCatNav(''); // highlight "All Books"
  try {
    const res   = await fetch(`${API}/books/featured`);
    const books = await res.json();
    isSearchMode = false;
    setHint('featured');
    renderBooks(books);
  } catch {
    setError('Cannot connect to server. Is it running on port 3000?');
  }
}

// ── Search (text + optional category dropdown) ───────────────
async function searchBooks() {
  const q   = document.getElementById('searchBox').value.trim();
  const cat = document.getElementById('categoryFilter').value;

  // Sync sidebar highlight with dropdown
  setActiveCatNav(cat);

  if (!q && !cat) { loadFeatured(); return; }

  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    setLoading();
    try {
      const params = new URLSearchParams();
      if (q)   params.set('q', q);
      if (cat) params.set('category', cat);
      const res   = await fetch(`${API}/books/search?${params}`);
      const books = await res.json();
      isSearchMode = true;
      if (!books.length) {
        setHint('empty', q, cat);
        setError(`No books found for "${q || cat}"`);
      } else {
        setHint('search', q, cat, books.length);
        renderBooks(books);
      }
    } catch { setError('Server error. Try again.'); }
  }, 300);
}

function clearSearch() {
  document.getElementById('searchBox').value      = '';
  document.getElementById('categoryFilter').value = '';
  setActiveCatNav('');
  loadFeatured();
}

// ── Render books ─────────────────────────────────────────────
function renderBooks(list) {
  const tbody = document.getElementById('bookList');
  tbody.innerHTML = list.map(b => `
    <tr>
      <td style="color:var(--text-muted);font-size:11px">${b.id}</td>
      <td style="font-weight:500">${b.title}</td>
      <td style="color:var(--text-secondary)">${b.author}</td>
      <td><span style="font-size:11px;background:var(--blue-light);color:var(--blue);padding:2px 8px;border-radius:99px">${b.category}</span></td>
      <td><span class="status-pill ${b.available ? 'available' : 'issued'}">${b.available ? 'Available' : 'Issued'}</span></td>
      <td><button class="btn btn-primary" onclick="issueBook(${b.id})" ${!b.available ? 'disabled' : ''}>Issue</button></td>
    </tr>
  `).join('');
}

// ── Hint bar ─────────────────────────────────────────────────
function setHint(mode, q = '', cat = '', count = 0) {
  const el = document.getElementById('tableHint');
  if (mode === 'featured') {
    el.className = 'table-hint hint--featured';
    el.innerHTML = `<span>⭐</span> Showing <strong>10 popular books</strong>. Use sidebar or search to browse all <strong>200 books</strong>.`;
  } else if (mode === 'category') {
    el.className = 'table-hint hint--search';
    el.innerHTML = `<span>📂</span> <strong>${count} books</strong> in <strong>${cat}</strong>. <button class="hint-clear" onclick="clearSearch()">✕ Show all</button>`;
  } else if (mode === 'search') {
    const lbl = [q && `"${q}"`, cat && `in ${cat}`].filter(Boolean).join(' ');
    el.className = 'table-hint hint--search';
    el.innerHTML = `<span>🔍</span> Found <strong>${count} books</strong> ${lbl}. <button class="hint-clear" onclick="clearSearch()">✕ Clear</button>`;
  } else {
    const lbl = [q && `"${q}"`, cat && `in ${cat}`].filter(Boolean).join(' ');
    el.className = 'table-hint hint--empty';
    el.innerHTML = `<span>📭</span> No results ${lbl}. <button class="hint-clear" onclick="clearSearch()">✕ Clear</button>`;
  }
}

function setLoading() {
  document.getElementById('bookList').innerHTML =
    `<tr><td colspan="6" class="table-msg"><span class="spinner"></span>Loading…</td></tr>`;
}
function setError(msg) {
  document.getElementById('bookList').innerHTML =
    `<tr><td colspan="6" class="table-msg">${msg}</td></tr>`;
}

// ── Issue ────────────────────────────────────────────────────
async function issueBook(bookId) {
  const name = document.getElementById('studentName').value.trim();
  if (!name) {
    showToast('Enter student name first.', 'error');
    document.getElementById('studentName').focus();
    return;
  }
  try {
    const res  = await fetch(`${API}/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId, student: name })
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error, 'error'); return; }
    showToast(data.message, 'success');
    await loadStats();
    // Refresh current view
    if (activeCategory)   fetchCategory(activeCategory);
    else if (isSearchMode) searchBooks();
    else                   loadFeatured();
  } catch { showToast('Server error.', 'error'); }
}

// ── Init ─────────────────────────────────────────────────────
loadTheme();
loadSidebarState();
loadStats();
loadCategories();
loadCategoryBadges();
loadFeatured();
