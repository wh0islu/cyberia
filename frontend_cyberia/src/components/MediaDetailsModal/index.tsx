import { apiFetch } from "../../services/collections";
import { useEffect, useState } from "react";
import { FormModal } from "../FormModal";
import { ScrollArea } from "../ScrollArea";
import styles from "./styles.module.css";

export type MediaDetailsItem = {
  kind: "movie" | "series";
  persistedId?: number;
  title: string;
  cover: string | null;
  tmdbId: number;
  synopsis?: string;
  year?: string;
  genre?: string;
  runtimeMinutes?: number;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  seasonEpisodeCounts?: Record<number, number>;
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
  onSynopsisSaved?: (kind: "movie" | "series", id: number, synopsis: string) => void;
};

export function MediaDetailsModal({ item, onClose, onSynopsisSaved }: MediaDetailsModalProps) {
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
    setError("");
    setDetails(null);
    if (selectedItem.synopsis?.trim() || !selectedItem.tmdbId) {
      setLoading(false);
      return;
    }
    setLoading(true);

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
        if (payload.overview && selectedItem.persistedId) {
          try {
            const csrf = document.cookie
              .split("; ")
              .find((cookie) => cookie.startsWith("csrftoken="))
              ?.split("=")[1];
            const saved = await apiFetch(
              `/api/v1/${selectedItem.kind === "movie" ? "movies" : "series"}/${selectedItem.persistedId}/`,
              {
                method: "PATCH",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                  ...(csrf ? { "X-CSRFToken": decodeURIComponent(csrf) } : {}),
                },
                body: JSON.stringify({ tmdb_synopsis: payload.overview }),
                signal: controller.signal,
              },
            );
            if (saved.ok && !controller.signal.aborted) {
              onSynopsisSaved?.(selectedItem.kind, selectedItem.persistedId, payload.overview);
            }
          } catch (error) {
            void error;
          }
        }
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Could not load title details.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadDetails();
    return () => controller.abort();
  }, [item, onSynopsisSaved]);

  const title = details?.title || item?.title || "Title details";
  const rating = item?.rating ?? 0;
  const seasonCounts = details?.seasons ?? Object.entries(item?.seasonEpisodeCounts ?? {})
    .map(([number, episode_count]) => ({ number: Number(number), episode_count }));

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
              {item.kind === "movie" && (details?.runtime ?? item.runtimeMinutes) != null && (
                <p className={styles.muted}>{details?.runtime ?? item.runtimeMinutes} min</p>
              )}
              {item.kind === "movie" && item.currentMinute != null && (
                <p className={styles.muted}>Your progress: minute {item.currentMinute}</p>
              )}
              {item.kind === "series" && (details?.number_of_seasons ?? item.numberOfSeasons) != null && (
                <p className={styles.muted}>
                  {details?.number_of_seasons ?? item.numberOfSeasons} seasons · {details?.number_of_episodes ?? item.numberOfEpisodes ?? 0} episodes
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
              <p>{item.synopsis || details?.overview || "No synopsis is available for this title."}</p>
            )}
          </section>

          {item.kind === "series" && seasonCounts.length > 0 ? (
            <section className={styles.section}>
              <h3>Seasons</h3>
              <ul className={styles.seasons}>
                {seasonCounts.map((season) => (
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
