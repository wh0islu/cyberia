import { useState } from "react";
import { Plus } from "lucide-react";
import { MediaForm } from "../../forms";
import { Card } from "../Card";
import { DefaultButton } from "../DefaultButton";
import { FormModal } from "../FormModal";
import { ProgressBar } from "../ProgressBar";
import styles from "./styles.module.css";

const batmanCover = "/media/movies/covers/batman.jpg";
const tbbtCover = "/media/movies/covers/tbbt.jpg";
const centralCover = "https://static.mostra.org/_img/_filmes/95182.jpg";
const cangacoCover =
  "https://uploads.alternativanerd.com.br/wp-content/uploads/2023/07/AN_Cangaco-Novo-Cartaz-2.jpg";
const bacurauCover =
  "https://www.opovo.com.br/_midias/jpg/2022/03/03/bacurau_distopia_06_03_2022-18228962.jpg";

const watchedItems = [
  { type: "Movie", title: "The Batman", cover: batmanCover, rating: "★★★★☆" },
  {
    type: "Series",
    title: "The Big Bang Theory",
    cover: tbbtCover,
    rating: "★★★★☆",
  },
  {
    type: "Movie",
    title: "Central do Brasil",
    cover: centralCover,
    rating: "★★★☆☆",
  },
  {
    type: "Movie",
    title: "Central do Brasil",
    cover: centralCover,
    rating: "★★★☆☆",
  },
  {
    type: "Series",
    title: "Cangaço Novo",
    cover: cangacoCover,
    rating: "★★★★☆",
  },
  { type: "Movie", title: "Bacurau", cover: bacurauCover, rating: "★★★★★" },
];

export function Movies() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function handleSalvarMidia(_dados: unknown) {
    setIsModalOpen(false);
  }

  return (
    <>
      <main className={styles.moviesPage}>
        <section className={styles.pageIntro}>
          <div>
            <h1>Movies &amp; Series</h1>
            <p>[n] movies · [n] series · [n] hours watched</p>
          </div>
          <DefaultButton
            size="sm"
            icon={<Plus aria-hidden="true" />}
            onClick={() => setIsModalOpen(true)}
          >
            Add movie or serie
          </DefaultButton>
        </section>

        <Card
          as="nav"
          compact
          className={styles.filters}
          aria-label="Movie and series filters"
        >
          <div className={styles.filterPills}>
            <a className={styles.activeFilter} href="#all">
              All
            </a>
            <a href="#movies">Movies</a>
            <a href="#series">Series</a>
            <a href="#watchlist">Watchlist</a>
          </div>
          <div className={styles.filterControls}>
            <label>
              Ano
              <select defaultValue="2026">
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </label>
            <label>
              Genre
              <select defaultValue="all">
                <option value="all">All</option>
                <option value="action">Action</option>
                <option value="comedy">Comedy</option>
                <option value="drama">Drama</option>
              </select>
            </label>
          </div>
        </Card>

        <section className={styles.inProgressSection} id="series">
          <h2>In progress</h2>
          <div className={styles.seriesGrid}>
            <Card as="article" className={styles.seriesCard}>
              <img
                className={styles.seriesPoster}
                src={cangacoCover}
                alt="Cangaço Novo poster"
              />
              <div className={styles.seriesDetails}>
                <h3>Cangaço Novo</h3>
                <p>S1 · ep. 5 of 10</p>
                <ProgressBar value={5} max={10} className={styles.progress} />
                <small>50% of season · streaming on: [service]</small>
                <DefaultButton variant="accent" size="sm">
                  +1 episode
                </DefaultButton>
              </div>
            </Card>

            <Card as="article" className={styles.seriesCard}>
              <img
                className={styles.seriesPoster}
                src={tbbtCover}
                alt="The Big Bang Theory poster"
              />
              <div className={styles.seriesDetails}>
                <h3>The Big Bang Theory</h3>
                <p>S1 · ep. 2 of 8</p>
                <ProgressBar value={2} max={8} className={styles.progress} />
                <small>25% of season · streaming on: [service]</small>
                <DefaultButton variant="accent" size="sm">
                  +1 episode
                </DefaultButton>
              </div>
            </Card>
          </div>
        </section>

        <section className={styles.watchedSection} id="all">
          <h2>Watched</h2>
          <div className={styles.watchedGrid}>
            {watchedItems.map((item, index) => (
              <Card
                as="article"
                className={styles.watchedItem}
                key={`${item.title}-${index}`}
              >
                <img
                  src={item.cover}
                  alt={`${item.title} poster`}
                  loading="lazy"
                />
                <h3>{item.title}</h3>
                <p>{item.type} · [year]</p>
                <strong>{item.rating}</strong>
                <small>watched on [date]</small>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <FormModal
        open={isModalOpen}
        title="Log a movie or series"
        description="Track what you watched, are watching, or want to watch."
        onClose={() => setIsModalOpen(false)}
      >
        <MediaForm
          initial={undefined}
          onSubmit={handleSalvarMidia}
          onCancel={() => setIsModalOpen(false)}
        />
      </FormModal>
    </>
  );
}
