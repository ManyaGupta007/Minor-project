const books = [
  { id: 1, title: "Data Structures", author: "Mark Allen" },
  { id: 2, title: "Operating System", author: "Galvin" },
  { id: 3, title: "Database Management", author: "Korth" },
  { id: 4, title: "Computer Networks", author: "Tanenbaum" },
  { id: 5, title: "Artificial Intelligence", author: "Stuart Russell" }
];

let issuedBooks = [];

function displayBooks(list) {
  const bookList = document.getElementById("bookList");
  bookList.innerHTML = "";

  list.forEach(book => {
    const div = document.createElement("div");
    div.className = "book";

    div.innerHTML = `
      <h3>${book.title}</h3>
      <p>${book.author}</p>
      <button onclick="issueBook(${book.id})">Issue</button>
    `;

    bookList.appendChild(div);
  });
}

function searchBooks() {
  const search = document.getElementById("searchBox").value.toLowerCase();
  const filtered = books.filter(b => b.title.toLowerCase().includes(search));
  displayBooks(filtered);
}

function issueBook(id) {
  const book = books.find(b => b.id === id);

  if (!issuedBooks.includes(book)) {
    issuedBooks.push(book);
    updateDashboard();
  } else {
    alert("Book already issued!");
  }
}

function returnBook(index) {
  issuedBooks.splice(index, 1);
  updateDashboard();
}

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

// Initial load
displayBooks(books);