import { useEffect, useState } from "react";
import { FormModal } from "../FormModal";
import { ScrollArea } from "../ScrollArea";
import styles from "./styles.module.css";

export type MediaDetailsItem = {
  kind: "movie" | "series";
  title: string;
  cover: string | null;
  tmdbId: number;
  year?: string;
  genre?: string;
  status?: string;
  rating?: number;
  review?: string;
  currentMinute?: number;
  currentSeason?: number;
  currentEpisode?: number;
};

type TmdbMediaDetails = {
  title: string;
  year: string | null;
  genres: string[];
  overview: string;
  poster_url: string | null;
  runtime: number | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  seasons: { number: number; episode_count: number }[];
};

type MediaDetailsModalProps = {
  item: MediaDetailsItem | null;
  onClose: () => void;
};

export function MediaDetailsModal({ item, onClose }: MediaDetailsModalProps) {
  const [details, setDetails] = useState<TmdbMediaDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!item) {
      setDetails(null);
      setError("");
      return;
    }

    const selectedItem = item;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setDetails(null);

    async function loadDetails() {
      try {
        const response = await fetch(
          `/api/v1/tmdb/${selectedItem.kind}/${selectedItem.tmdbId}/`,
          { signal: controller.signal },
        );
        const payload: TmdbMediaDetails & { detail?: string } = await response.json();
        if (!response.ok) {
          throw new Error(payload.detail || "Could not load title details.");
        }
        setDetails(payload);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Could not load title details.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadDetails();
    return () => controller.abort();
  }, [item]);

  const title = details?.title || item?.title || "Title details";
  const rating = item?.rating ?? 0;

  return (
    <FormModal
      open={item !== null}
      title={title}
      description={item?.kind === "series" ? "Series details and your review" : "Movie details and your review"}
      onClose={onClose}
    >
      {item && (
        <ScrollArea className={styles.content}>
          <section className={styles.overview}>
            {details?.poster_url || item.cover ? (
              <img
                className={styles.poster}
                src={details?.poster_url || item.cover || ""}
                alt={`${title} poster`}
              />
            ) : (
              <div className={`${styles.poster} ${styles.posterPlaceholder}`} aria-label="Poster unavailable" />
            )}
            <div className={styles.metadata}>
              <p className={styles.eyebrow}>{item.kind === "series" ? "TV SERIES" : "MOVIE"}</p>
              <h3>{title}</h3>
              <p className={styles.muted}>
                {[details?.year || item.year, ...(details?.genres ?? (item.genre ? [item.genre] : []))]
                  .filter(Boolean)
                  .join(" · ") || "Details from TMDB"}
              </p>
              {item.kind === "movie" && details?.runtime != null && (
                <p className={styles.muted}>{details.runtime} min</p>
              )}
              {item.kind === "movie" && item.currentMinute != null && (
                <p className={styles.muted}>Your progress: minute {item.currentMinute}</p>
              )}
              {item.kind === "series" && details?.number_of_seasons != null && (
                <p className={styles.muted}>
                  {details.number_of_seasons} seasons · {details.number_of_episodes ?? 0} episodes
                </p>
              )}
              {item.kind === "series" && item.currentSeason != null && (
                <p className={styles.muted}>
                  Your progress: season {item.currentSeason}
                  {item.currentEpisode != null ? ` · episode ${item.currentEpisode}` : ""}
                </p>
              )}
              {item.status && <span className={styles.status}>{item.status}</span>}
            </div>
          </section>

          <section className={styles.section}>
            <h3>Synopsis</h3>
            {loading ? (
              <p className={styles.muted}>Loading details from TMDB…</p>
            ) : error ? (
              <p className={styles.muted} role="status">{error}</p>
            ) : (
              <p>{details?.overview || "No synopsis is available for this title."}</p>
            )}
          </section>

          {item.kind === "series" && details?.seasons.length ? (
            <section className={styles.section}>
              <h3>Seasons</h3>
              <ul className={styles.seasons}>
                {details.seasons.map((season) => (
                  <li key={season.number}>
                    <span>Season {season.number}</span>
                    <span>{season.episode_count} episodes</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={styles.review}>
            <h3>Your review</h3>
            <div className={styles.rating} aria-label={`Your rating: ${rating} out of 5 stars`}>
              {Array.from({ length: 5 }, (_, index) => (
                <span key={index} data-filled={index < rating}>★</span>
              ))}
              <small>{rating > 0 ? `${rating}/5` : "Not rated"}</small>
            </div>
            <p>{item.review || "You have not added a written review yet."}</p>
          </section>

          <p className={styles.attribution}>
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </ScrollArea>
      )}
    </FormModal>
  );
}
