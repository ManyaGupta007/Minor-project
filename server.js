const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = 3000;
const DB   = path.join(__dirname, 'db.json');

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


// ── DB helpers ───────────────────────────────────────────────
function readDB()       { return JSON.parse(fs.readFileSync(DB, 'utf8')); }
function writeDB(data)  { fs.writeFileSync(DB, JSON.stringify(data, null, 2)); }

// ── GET /api/books/featured  ─────────────────────────────────
// Returns only featured books (shown on homepage by default)
app.get('/api/books/featured', (req, res) => {
  const db = readDB();
  res.json(db.books.filter(b => b.featured));
});

// ── GET /api/books/search?q=...&category=... ─────────────────
// Searches full 200-book library. Returns [] if no query.
app.get('/api/books/search', (req, res) => {
  const q        = (req.query.q        || '').toLowerCase().trim();
  const category = (req.query.category || '').trim();

  if (!q && !category) return res.json([]);

  const db = readDB();
  let results = db.books;

  if (q) {
    results = results.filter(b =>
      b.title.toLowerCase().includes(q)  ||
      b.author.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q)
    );
  }

  if (category) {
    results = results.filter(b => b.category === category);
  }

  res.json(results);
});

// ── GET /api/books/categories ────────────────────────────────
// Returns all unique categories for the filter dropdown
app.get('/api/books/categories', (req, res) => {
  const db         = readDB();
  const categories = [...new Set(db.books.map(b => b.category))].sort();
  res.json(categories);
});

// ── GET /api/books  — all books ──────────────────────────────
app.get('/api/books', (req, res) => {
  const db = readDB();
  res.json(db.books);
});

// ── GET /api/issued ──────────────────────────────────────────
app.get('/api/issued', (req, res) => {
  const db = readDB();
  res.json(db.issued);
});

// ── GET /api/stats ───────────────────────────────────────────
app.get('/api/stats', (req, res) => {
  const db        = readDB();
  const total     = db.books.length;
  const available = db.books.filter(b => b.available).length;
  const issued    = db.issued.length;
  res.json({ total, available, issued });
});

// ── POST /api/issue ──────────────────────────────────────────
app.post('/api/issue', (req, res) => {
  const { bookId, student } = req.body;
  if (!bookId || !student?.trim())
    return res.status(400).json({ error: 'bookId and student name required.' });

  const db   = readDB();
  const book = db.books.find(b => b.id === bookId);

  if (!book)           return res.status(404).json({ error: 'Book not found.' });
  if (!book.available) return res.status(409).json({ error: 'Book is already issued.' });

  book.available = false;

  const record = {
    issueId:   Date.now(),
    bookId:    book.id,
    title:     book.title,
    author:    book.author,
    category:  book.category,
    student:   student.trim(),
    issueDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    issuedAt:  new Date().toISOString()
  };

  db.issued.push(record);
  writeDB(db);
  res.status(201).json({ message: `"${book.title}" issued to ${student.trim()}.`, record });
});

// ── POST /api/return ─────────────────────────────────────────
app.post('/api/return', (req, res) => {
  const { issueId } = req.body;
  if (!issueId) return res.status(400).json({ error: 'issueId required.' });

  const db  = readDB();
  const idx = db.issued.findIndex(r => r.issueId === issueId);
  if (idx === -1) return res.status(404).json({ error: 'Issue record not found.' });

  const rec  = db.issued[idx];
  const book = db.books.find(b => b.id === rec.bookId);
  if (book) book.available = true;

  db.issued.splice(idx, 1);
  writeDB(db);
  res.json({ message: `"${rec.title}" returned successfully.` });
});

// ── DELETE /api/issued/:issueId ──────────────────────────────
app.delete('/api/issued/:issueId', (req, res) => {
  const issueId = parseInt(req.params.issueId);
  const db      = readDB();
  const idx     = db.issued.findIndex(r => r.issueId === issueId);
  if (idx === -1) return res.status(404).json({ error: 'Record not found.' });

  const rec  = db.issued[idx];
  const book = db.books.find(b => b.id === rec.bookId);
  if (book) book.available = true;
  db.issued.splice(idx, 1);
  writeDB(db);
  res.json({ message: `"${rec.title}" returned.` });
});

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅  Smart Library running at http://localhost:${PORT}`);
  console.log(`   📚  ${require('./db.json').books.length} books in the library\n`);
});
