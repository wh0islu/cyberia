import { useState } from "react";
import { Plus, Search, Star } from "lucide-react";
import { BookForm } from "../../forms";
import { Card } from "../Card";
import { DefaultButton } from "../DefaultButton";
import { FormModal } from "../FormModal";
import { ProgressBar } from "../ProgressBar";
import { Select } from "../Select";
import styles from "./styles.module.css";

type Book = {
  title: string;
  author: string;
  currentPage: number;
  totalPages: number;
  lastRead: string;
  cover: string;
  rating?: number;
};

const bookCovers = {
  domCasmurro:
    "https://storage.googleapis.com/novo-blog-wordpress/2023/11/f7e9553a-dom-casmurro-reprod.jpg",
  cortico:
    "https://martinsfontespaulista.vteximg.com.br/arquivos/ids/242129-800-800/887228_ampliada.jpg?v=637250738515730000",
  memorias:
    "https://is1-ssl.mzstatic.com/image/thumb/Publication124/v4/d0/b8/d1/d0b8d19f-8b33-6bd8-b743-42c5b5f3830e/1032894253.jpg/1200x1200wz.jpg",
  iracema:
    "https://acdn-us.mitiendanube.com/stores/002/192/085/products/58cbc65127696988a2798c570da5e328-051cf43ec3d3ede77817284079827106-640-0.webp",
  vidasSecas:
    "https://cdn.awsli.com.br/2500x2500/1304/1304678/produto/255011060/a15bj0ux25l-_sl1500_-8f8nm4t8tp.jpg",
  senhora:
    "https://img.travessa.com.br/livro/GR/51/51b374fa-d4b6-4539-b652-6d8acb80618c.jpg",
  oGuarani:
    "https://higinocultural.com.br/wp-content/uploads/2023/02/O-Guarani-Jose-De-Alencar-Serie-Bom-Livro-25a-Ed.-6a-Imp..jpg",
};

const readingBooks: Book[] = [
  {
    title: "Dom Casmurro",
    author: "Machado de Assis",
    currentPage: 120,
    totalPages: 256,
    lastRead: "today",
    cover: bookCovers.domCasmurro,
  },
  {
    title: "O Cortiço",
    author: "Aluísio Azevedo",
    currentPage: 45,
    totalPages: 304,
    lastRead: "3 days ago",
    cover: bookCovers.cortico,
  },
];

const shelfBooks = [
  {
    title: "Memórias Póstumas de Brás Cubas",
    author: "Machado de Assis",
    status: "Read",
    rating: 5,
    cover: bookCovers.memorias,
  },
  {
    title: "Iracema",
    author: "José de Alencar",
    status: "Read",
    rating: 4,
    cover: bookCovers.iracema,
  },
  {
    title: "Vidas Secas",
    author: "Graciliano Ramos",
    status: "Want to read",
    rating: null,
    cover: bookCovers.vidasSecas,
  },
  {
    title: "Senhora",
    author: "José de Alencar",
    status: "Read",
    rating: 4,
    cover: bookCovers.senhora,
  },
  {
    title: "O Guarani",
    author: "José de Alencar",
    status: "Abandoned",
    progress: 18,
    rating: null,
    cover: bookCovers.oGuarani,
  },
  {
    title: "O Guarani",
    author: "José de Alencar",
    status: "Abandoned",
    progress: 18,
    rating: null,
    cover: bookCovers.oGuarani,
  },
];

function ReadingBookCard({ book }: { book: Book }) {
  const percentage = Math.round((book.currentPage / book.totalPages) * 100);

  return (
    <Card as="article" className={styles.readingCard}>
      <img
        className={styles.readingCover}
        src={book.cover}
        alt={`${book.title} cover`}
        loading="lazy"
      />

      <div className={styles.readingDetails}>
        <h3>{book.title}</h3>
        <p>
          {book.author} · {book.totalPages} pages
        </p>
        <div className={styles.readingProgressHeader}>
          <span>
            p. {book.currentPage} / {book.totalPages}
          </span>
          <strong>{percentage}%</strong>
        </div>
        <ProgressBar
          value={book.currentPage}
          max={book.totalPages}
          className={styles.bookProgress}
        />
        <small>
          {book.totalPages - book.currentPage} pages left · last read:{" "}
          {book.lastRead}
        </small>
        <div className={styles.pageForm}>
          <label htmlFor={`book-page-${book.title}`}>Paused at p.</label>
          <input
            id={`book-page-${book.title}`}
            type="number"
            defaultValue={book.currentPage}
          />
          <DefaultButton size="sm">Save</DefaultButton>
        </div>
      </div>
    </Card>
  );
}

export function Books() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleSaveBook(_data: unknown) {
    setIsModalOpen(false);
  }

  return (
    <>
      <main className={styles.booksPage}>
        <section className={styles.pageIntro}>
          <div>
            <h1>Books</h1>
            <p>26 books · 3,240 pages read this year</p>
          </div>
          <div className={styles.pageActions}>
            <label className={styles.searchBox}>
              <Search size={18} aria-hidden="true" />
              <input type="search" placeholder="Search your library" />
            </label>
            <DefaultButton
              size="sm"
              icon={<Plus aria-hidden="true" />}
              onClick={() => setIsModalOpen(true)}
            >
              Add book
            </DefaultButton>
          </div>
        </section>

        <nav className={styles.filters} aria-label="Book filters">
          <div className={styles.filterPills}>
            <a className={styles.activeFilter} href="#reading">
              Reading (2)
            </a>
            <a href="#read">Read (14)</a>
            <a href="#want-to-read">Want to read (9)</a>
            <a href="#abandoned">Abandoned (1)</a>
          </div>
          <label className={styles.sortControl}>
            Sort
            <Select compact defaultValue="last-read" aria-label="Sort books">
              <option value="last-read">Last read</option>
              <option value="title">Title</option>
              <option value="rating">Rating</option>
            </Select>
          </label>
        </nav>

        <Card
          title="Currently reading"
          className={styles.sectionPanel}
          id="reading"
        >
          <div className={styles.readingGrid}>
            {readingBooks.map((book) => (
              <ReadingBookCard key={book.title} book={book} />
            ))}
          </div>
        </Card>

        <Card
          title="Bookshelf"
          action={{ label: "6 of 26", href: "#read" }}
          className={styles.shelfSection}
          id="read"
        >
          <div className={styles.shelfGrid}>
            {shelfBooks.map((book, index) => (
              <article
                className={styles.shelfBook}
                key={`${book.title}-${index}`}
              >
                <img
                  className={styles.shelfCover}
                  src={book.cover}
                  alt={`${book.title} cover`}
                  loading="lazy"
                />
                <h3>{book.title}</h3>
                <p>{book.author}</p>
                {book.status === "Read" && (
                  <ProgressBar
                    value={100}
                    max={100}
                    className={styles.shelfProgress}
                  />
                )}
                {book.status === "Abandoned" && (
                  <ProgressBar
                    value={book.progress ?? 0}
                    max={100}
                    className={styles.shelfProgress}
                  />
                )}
                <span
                  className={`${styles.bookBadge} ${styles[`bookBadge--${book.status.toLowerCase().replaceAll(" ", "-")}`]}`}
                >
                  <span aria-hidden="true" />
                  {book.status}
                  {book.rating ? (
                    <>
                      <span className={styles.badgeRating}>
                        <Star
                          size={11}
                          fill="currentColor"
                          aria-hidden="true"
                        />{" "}
                        {book.rating}/5
                      </span>
                    </>
                  ) : book.progress ? (
                    ` · ${book.progress}%`
                  ) : (
                    ""
                  )}
                </span>
              </article>
            ))}
          </div>
        </Card>
      </main>

      <FormModal
        open={isModalOpen}
        title="Add book"
        description="Add the basics now; you can edit the rest later."
        onClose={() => setIsModalOpen(false)}
      >
        <BookForm
          initial={undefined}
          onSubmit={handleSaveBook}
          onCancel={() => setIsModalOpen(false)}
        />
      </FormModal>
    </>
  );
}
