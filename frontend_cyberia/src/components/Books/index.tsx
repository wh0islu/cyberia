import { useEffect, useState, type FormEvent } from "react";
import { Plus, Search } from "lucide-react";
import { BookForm } from "../../forms";
import type { BookSubmission } from "../../forms/BookForm";
import { Card } from "../Card";
import { DefaultButton } from "../DefaultButton";
import { FormModal } from "../FormModal";
import { ProgressBar } from "../ProgressBar";
import { Select } from "../Select";
import styles from "./styles.module.css";

type Book = {
  id: number;
  title: string;
  author: string;
  current_page: number;
  number_of_pages: number | null;
  status: string;
  cover: string | null;
};

const statuses: Record<string, string> = {
  RE: "Reading", NR: "Want to read", FD: "Read", RW: "Reviewing",
};

function apiError(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(apiError).join(" ");
  if (value && typeof value === "object") {
    return Object.entries(value).map(([key, error]) => `${key}: ${apiError(error)}`).join("; ");
  }
  return "Unable to complete request.";
}

async function requestBooks(path = "", options: RequestInit = {}) {
  const csrf = document.cookie.split("; ").find((cookie) => cookie.startsWith("csrftoken="))?.split("=")[1];
  const response = await fetch(`/api/v1/books/${path}`, {
    ...options,
    credentials: "include",
    headers: { ...(csrf ? { "X-CSRFToken": decodeURIComponent(csrf) } : {}), ...options.headers },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data ? apiError(data) : `Request failed (${response.status}).`);
  return data;
}

function BookCover({ book, className }: { book: Book; className: string }) {
  return book.cover ? (
    <img className={className} src={book.cover} alt={`${book.title} cover`} loading="lazy" />
  ) : <div className={className} role="img" aria-label="No cover">No cover</div>;
}

function ReadingBookCard({ book, onSave }: { book: Book; onSave: (book: Book) => void }) {
  const [page, setPage] = useState(String(book.current_page));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const total = book.number_of_pages;
  const percentage = total ? Math.min(100, Math.round(book.current_page / total * 100)) : 0;

  async function save(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const updated: Book = await requestBooks(`${book.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_page: Number(page) }),
      });
      onSave(updated);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save progress.");
    } finally { setSaving(false); }
  }

  return (
    <Card as="article" className={styles.readingCard}>
      <BookCover book={book} className={styles.readingCover} />
      <div className={styles.readingDetails}>
        <h3>{book.title}</h3>
        <p>{book.author} · {total ?? "Unknown"} pages</p>
        <div className={styles.readingProgressHeader}>
          <span>p. {book.current_page} / {total ?? "?"}</span><strong>{percentage}%</strong>
        </div>
        <ProgressBar value={book.current_page} max={total || Math.max(book.current_page, 1)} className={styles.bookProgress} />
        {total !== null && <small>{Math.max(0, total - book.current_page)} pages left</small>}
        <form className={styles.pageForm} onSubmit={save}>
          <label htmlFor={`book-page-${book.id}`}>Paused at p.</label>
          <input id={`book-page-${book.id}`} type="number" required min="0" max={total ?? undefined} value={page} onChange={(event) => setPage(event.target.value)} />
          <DefaultButton type="submit" size="sm" disabled={saving}>{saving ? "Saving..." : "Save"}</DefaultButton>
        </form>
        {error && <p role="alert">{error}</p>}
      </div>
    </Card>
  );
}

export function Books() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("latest");

  useEffect(() => {
    let active = true;
    requestBooks().then((data: Book[]) => { if (active) setBooks(data); })
      .catch((error: Error) => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleSaveBook(data: BookSubmission) {
    const body = new FormData();
    body.append("title", data.title);
    body.append("author", data.author);
    body.append("number_of_pages", String(data.pages));
    body.append("genre", data.genre);
    body.append("status", data.status);
    body.append("current_page", String(data.status === "FD" ? data.pages : data.current_page ?? 0));
    if (data.started_at) body.append("started_on", data.started_at);
    body.append("notes", data.notes);
    if (data.cover) body.append("cover", data.cover);
    data.sources.forEach((source, index) => {
      body.append(`sources[${index}]format`, source.format);
      if (source.location) body.append(`sources[${index}]location`, source.location);
      if (source.url) body.append(`sources[${index}]url`, source.url);
    });
    const book: Book = await requestBooks("", { method: "POST", body });
    setBooks((previous) => [...previous, book]);
    setIsModalOpen(false);
  }

  const visible = books.filter((book) => (!filter || book.status === filter) &&
    `${book.title} ${book.author}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : b.id - a.id);
  const reading = visible.filter((book) => book.status === "RE" || book.status === "RW");
  const shelf = visible.filter((book) => book.status !== "RE" && book.status !== "RW");
  function updateBook(updated: Book) {
    setBooks((previous) => previous.map((book) => book.id === updated.id ? updated : book));
  }

  return (
    <>
      <main className={styles.booksPage}>
        <section className={styles.pageIntro}>
          <div><h1>Books</h1><p>{books.length} books · {books.reduce((sum, book) => sum + book.current_page, 0)} pages read</p></div>
          <div className={styles.pageActions}>
            <label className={styles.searchBox}><Search size={18} aria-hidden="true" /><input type="search" placeholder="Search your library" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
            <DefaultButton size="sm" icon={<Plus aria-hidden="true" />} disabled={loading || !!error} onClick={() => setIsModalOpen(true)}>Add book</DefaultButton>
          </div>
        </section>
        <nav className={styles.filters} aria-label="Book filters">
          <div className={styles.filterPills}>
            {[["", "All"], ...Object.entries(statuses)].map(([value, label]) => (
              <a key={value} href="#books" className={filter === value ? styles.activeFilter : undefined} aria-current={filter === value ? "true" : undefined} onClick={(event) => { event.preventDefault(); setFilter(value); }}>{label} ({books.filter((book) => !value || book.status === value).length})</a>
            ))}
          </div>
          <label className={styles.sortControl}>Sort<Select compact value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort books"><option value="latest">Latest added</option><option value="title">Title</option></Select></label>
        </nav>
        {loading && <p role="status">Loading books...</p>}
        {error && <p role="alert">{error} Reload the page to retry.</p>}
        {!loading && !error && visible.length === 0 && <p>{books.length ? "No matching books." : "Your library is empty. Add your first book."}</p>}
        <Card title="Currently reading" className={styles.sectionPanel} id="reading">
          <div className={styles.readingGrid}>{reading.map((book) => <ReadingBookCard key={book.id} book={book} onSave={updateBook} />)}</div>
        </Card>
        <Card title="Bookshelf" className={styles.shelfSection} id="books">
          <div className={styles.shelfGrid}>
            {shelf.map((book) => (
              <article className={styles.shelfBook} key={book.id}>
                <BookCover book={book} className={styles.shelfCover} /><h3>{book.title}</h3><p>{book.author}</p>
                {book.status === "FD" && <ProgressBar value={100} max={100} className={styles.shelfProgress} />}
                <span className={`${styles.bookBadge} ${styles[`bookBadge--${(statuses[book.status] ?? "").toLowerCase().replaceAll(" ", "-")}`]}`}><span aria-hidden="true" />{statuses[book.status] ?? book.status}</span>
              </article>
            ))}
          </div>
        </Card>
      </main>
      <FormModal open={isModalOpen} title="Add book" description="Add a book to your library." onClose={() => setIsModalOpen(false)}>
        <BookForm onSubmit={handleSaveBook} onCancel={() => setIsModalOpen(false)} />
      </FormModal>
    </>
  );
}
