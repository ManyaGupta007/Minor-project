// ===== BOOK DATA =====
const books = [
  { id: 1, title: "Data Structures", author: "Mark Allen", available: true, img: "https://picsum.photos/400/300?random=1" },
  { id: 2, title: "Operating System", author: "Galvin", available: true, img: "https://picsum.photos/400/300?random=2" },
  { id: 3, title: "Database Management", author: "Korth", available: true, img: "https://picsum.photos/400/300?random=3" },
  { id: 4, title: "Computer Networks", author: "Tanenbaum", available: true, img: "https://picsum.photos/400/300?random=4" },
  { id: 5, title: "Artificial Intelligence", author: "Russell", available: true, img: "https://picsum.photos/400/300?random=5" }
];

let issuedBooks = [];

// ===== LOAD DATA =====
function loadData() {
  const data = localStorage.getItem("issuedBooks");
  if (data) issuedBooks = JSON.parse(data);

  // restore availability based on issued books
  issuedBooks.forEach(issued => {
    const book = books.find(b => b.id === issued.id);
    if (book) book.available = false;
  });
}

// ===== SAVE DATA =====
function saveData() {
  localStorage.setItem("issuedBooks", JSON.stringify(issuedBooks));
}

// ===== TOAST =====
function showToast(msg) {
  const t = document.getElementById("toast");
  t.innerText = msg;
  t.style.display = "block";

  setTimeout(() => {
    t.style.display = "none";
  }, 2000);
}

// ===== DISPLAY BOOKS =====
function displayBooks(list) {
  const bookList = document.getElementById("bookList");
  bookList.innerHTML = "";

  list.forEach(book => {
    const div = document.createElement("div");
    div.className = "book";

    div.style.backgroundImage = `url(${book.img})`;

    div.innerHTML = `
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      <p class="${book.available ? "available" : "issued"}">
        ${book.available ? "Available" : "Issued"}
      </p>
      <button onclick="issueBook(${book.id})" ${!book.available ? "disabled" : ""}>
        ${book.available ? "Issue" : "Issued"}
      </button>
    `;

    bookList.appendChild(div);
  });
}

// ===== SEARCH =====
function searchBooks() {
  const search = document.getElementById("searchBox").value.toLowerCase();

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search) ||
    b.author.toLowerCase().includes(search)
  );

  displayBooks(filtered);
}

// ===== ISSUE BOOK =====
function issueBook(id) {
  const name = document.getElementById("studentName").value.trim();

  if (!name) {
    showToast("Enter student name ❗");
    return;
  }

  const book = books.find(b => b.id === id);

  if (book && book.available) {
    book.available = false;

    issuedBooks.push({
      id: book.id,
      title: book.title,
      student: name,
      date: new Date().toLocaleDateString()
    });

    saveData();
    updateDashboard();
    displayBooks(books);

    showToast("Book Issued ✅");
  }
}

// ===== RETURN BOOK =====
function returnBook(index) {
  const issued = issuedBooks[index];

  // find original book and update it
  const originalBook = books.find(b => b.id === issued.id);
  if (originalBook) originalBook.available = true;

  issuedBooks.splice(index, 1);

  saveData();
  updateDashboard();
  displayBooks(books);

  showToast("Book Returned 🔄");
}

// ===== DASHBOARD =====
function updateDashboard() {
  const list = document.getElementById("issuedList");
  list.innerHTML = "";

  issuedBooks.forEach((book, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${book.title}</strong><br>
      👤 ${book.student}<br>
      📅 ${book.date}<br>
      <button onclick="returnBook(${index})">Return</button>
    `;

    list.appendChild(li);
  });

  document.getElementById("totalBooks").innerText = books.length;
  document.getElementById("issuedCount").innerText = issuedBooks.length;
}

// ===== THEME TOGGLE =====
function toggleTheme() {
  document.body.classList.toggle("dark");
}

// ===== INIT =====
loadData();
displayBooks(books);
updateDashboard();