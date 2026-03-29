// ===== BOOK DATA =====
const books = [
  { id: 1, title: "Data Structures",        author: "Mark Allen Weiss", available: true },
  { id: 2, title: "Operating Systems",      author: "Abraham Silberschatz (Galvin)", available: true },
  { id: 3, title: "Database Management",    author: "Henry F. Korth",   available: true },
  { id: 4, title: "Computer Networks",      author: "Andrew S. Tanenbaum", available: true },
  { id: 5, title: "Artificial Intelligence",author: "Stuart Russell",   available: true }
];

let issuedBooks = [];

// ===== PERSISTENCE =====
function loadData() {
  try {
    const saved = localStorage.getItem("sl_issued");
    if (saved) {
      issuedBooks = JSON.parse(saved);
      issuedBooks.forEach(rec => {
        const book = books.find(b => b.id === rec.id);
        if (book) book.available = false;
      });
    }
  } catch (e) {
    issuedBooks = [];
  }
}

function saveData() {
  try { localStorage.setItem("sl_issued", JSON.stringify(issuedBooks)); } catch (e) {}
}

// ===== TOAST =====
let toastTimer;
function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.display = "none"; }, 2800);
}

// ===== RENDER CATALOGUE =====
function renderBooks(list) {
  const tbody = document.getElementById("bookList");
  tbody.innerHTML = list.map((book, idx) => `
    <tr>
      <td style="color:var(--text-muted)">${book.id}</td>
      <td style="font-weight:500">${book.title}</td>
      <td style="color:var(--text-secondary)">${book.author}</td>
      <td>
        <span class="status-pill ${book.available ? 'available' : 'issued'}">
          ${book.available ? 'Available' : 'Issued'}
        </span>
      </td>
      <td>
        <button
          class="btn btn-primary"
          onclick="issueBook(${book.id})"
          ${!book.available ? 'disabled' : ''}
        >Issue</button>
      </td>
    </tr>
  `).join('');
}

// ===== SEARCH =====
function searchBooks() {
  const q = document.getElementById("searchBox").value.toLowerCase().trim();
  const filtered = q
    ? books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    : books;
  renderBooks(filtered);
}

// ===== ISSUE BOOK =====
function issueBook(id) {
  const name = document.getElementById("studentName").value.trim();
  if (!name) {
    showToast("Please enter the student's name before issuing.");
    document.getElementById("studentName").focus();
    return;
  }

  const book = books.find(b => b.id === id);
  if (!book || !book.available) return;

  book.available = false;
  issuedBooks.push({
    id: book.id,
    title: book.title,
    student: name,
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  });

  saveData();
  updateStats();
  renderBooks(books);
  renderIssued();
  showToast(`"${book.title}" issued to ${name}`);
}

// ===== RETURN BOOK =====
function returnBook(index) {
  const rec = issuedBooks[index];
  const book = books.find(b => b.id === rec.id);
  if (book) book.available = true;

  const title = rec.title;
  issuedBooks.splice(index, 1);

  saveData();
  updateStats();
  renderBooks(books);
  renderIssued();
  showToast(`"${title}" has been returned.`);
}

// ===== RENDER ISSUED TABLE =====
function renderIssued() {
  const tbody = document.getElementById("issuedList");
  const empty = document.getElementById("emptyState");
  const badge = document.getElementById("issuedBadge");

  badge.textContent = `${issuedBooks.length} record${issuedBooks.length !== 1 ? 's' : ''}`;

  if (!issuedBooks.length) {
    tbody.innerHTML = '';
    empty.classList.add("visible");
    return;
  }

  empty.classList.remove("visible");
  tbody.innerHTML = issuedBooks.map((rec, i) => `
    <tr>
      <td style="color:var(--text-muted)">${i + 1}</td>
      <td style="font-weight:500">${rec.title}</td>
      <td style="color:var(--text-secondary)">${rec.student}</td>
      <td style="color:var(--text-muted)">${rec.date}</td>
      <td>
        <button class="btn btn-outline" onclick="returnBook(${i})">Return</button>
      </td>
    </tr>
  `).join('');
}

// ===== STATS =====
function updateStats() {
  const issued = issuedBooks.length;
  const available = books.filter(b => b.available).length;
  document.getElementById("totalBooks").textContent    = books.length;
  document.getElementById("availableCount").textContent = available;
  document.getElementById("issuedCount").textContent   = issued;
}

// ===== THEME =====
function toggleTheme() {
  const isDark = document.body.classList.toggle("dark");
  document.getElementById("icon-sun").style.display  = isDark ? "none"  : "block";
  document.getElementById("icon-moon").style.display = isDark ? "block" : "none";
  localStorage.setItem("sl_theme", isDark ? "dark" : "light");
}

function loadTheme() {
  if (localStorage.getItem("sl_theme") === "dark") {
    document.body.classList.add("dark");
    document.getElementById("icon-sun").style.display  = "none";
    document.getElementById("icon-moon").style.display = "block";
  }
}

// ===== INIT =====
loadTheme();
loadData();
updateStats();
renderBooks(books);
renderIssued();
