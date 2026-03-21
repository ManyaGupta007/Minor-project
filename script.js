const books = [
  { id: 1, title: "Data Structures", author: "Mark Allen", available: true },
  { id: 2, title: "Operating System", author: "Galvin", available: true },
  { id: 3, title: "Database Management", author: "Korth", available: true },
  { id: 4, title: "Computer Networks", author: "Tanenbaum", available: true },
  { id: 5, title: "Artificial Intelligence", author: "Stuart Russell", available: true }
];

let issuedBooks = [];

// Toast Notification
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerText = msg;
  toast.style.display = "block";
  setTimeout(() => toast.style.display = "none", 2000);
}

// Display Books
function displayBooks(list) {
  const bookList = document.getElementById("bookList");
  bookList.innerHTML = "";

  list.forEach(book => {
    const div = document.createElement("div");
    div.className = "book";

    div.innerHTML = `
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      <p class="status ${book.available ? "available" : "issued"}">
        ${book.available ? "Available" : "Issued"}
      </p>
      <button onclick="issueBook(${book.id})" ${!book.available ? "disabled" : ""}>
        Issue
      </button>
    `;

    bookList.appendChild(div);
  });
}

// Search
function searchBooks() {
  const search = document.getElementById("searchBox").value.toLowerCase();
  const filtered = books.filter(b => b.title.toLowerCase().includes(search));
  displayBooks(filtered);
}

// Issue Book
function issueBook(id) {
  const book = books.find(b => b.id === id);

  if (book.available) {
    book.available = false;
    issuedBooks.push(book);
    updateDashboard();
    displayBooks(books);
    showToast("Book Issued ✅");
  } else {
    showToast("Already Issued ❌");
  }
}

// Return Book
function returnBook(index) {
  const book = issuedBooks[index];
  book.available = true;

  issuedBooks.splice(index, 1);
  updateDashboard();
  displayBooks(books);
  showToast("Book Returned 🔄");
}

// Update Dashboard
function updateDashboard() {
  const list = document.getElementById("issuedList");
  list.innerHTML = "";

  issuedBooks.forEach((book, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${book.title}
      <button onclick="returnBook(${index})">Return</button>
    `;
    list.appendChild(li);
  });
}

// Initial Load
displayBooks(books);