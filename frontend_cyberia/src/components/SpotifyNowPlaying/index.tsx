import { useEffect, useState } from "react";
import styles from "./styles.module.css";

type Track = {
  is_playing?: boolean;
  title?: string;
  artists?: string;
  album?: string;
  cover?: string | null;
  url?: string;
  played_at?: string;
};

type SpotifyNowPlayingProps = {
  showRecentlyPlayed?: boolean;
  compact?: boolean;
};

export function SpotifyNowPlaying({
  showRecentlyPlayed = true,
  compact = false,
}: SpotifyNowPlayingProps) {
  const [track, setTrack] = useState<Track | null>(null);
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);

  useEffect(() => {
    let ativo = true;

    async function buscarMusicas() {
      const [currentData, recentData] = await Promise.all([
        fetch("/spotify/now-playing/", { credentials: "include" })
          .then(async (response): Promise<Track> =>
            response.ok ? response.json() : { is_playing: false },
          )
          .catch((): Track => ({ is_playing: false })),
        showRecentlyPlayed
          ? fetch("/spotify/recently-played/", { credentials: "include" })
              .then(async (response): Promise<{ items?: Track[] }> =>
                response.ok ? response.json() : { items: [] },
              )
              .catch((): { items: Track[] } => ({ items: [] }))
          : Promise.resolve({ items: [] as Track[] }),
      ]);

      if (ativo) {
        setTrack(currentData.is_playing ? currentData : null);
        setRecentTracks(recentData.items || []);
      }
    }

    buscarMusicas();
    const intervalo = window.setInterval(buscarMusicas, 30000);

    return () => {
      ativo = false;
      window.clearInterval(intervalo);
    };
  }, [showRecentlyPlayed]);

  if (!track && recentTracks.length === 0) return null;

  return (
    <aside
      className={[styles.spotifyColumn, compact && styles.compact]
        .filter(Boolean)
        .join(" ")}
      aria-label="Spotify"
    >
      {track && (
        <a
          className={styles.nowPlaying}
          href={track.url || "https://open.spotify.com"}
          target="_blank"
          rel="noreferrer"
        >
          {track.cover && (
            <img
              className={styles.cover}
              src={track.cover}
              alt={track.album || "Album"}
            />
          )}
          <span className={styles.info}>
            <strong>{track.title}</strong>
            <span>{track.artists}</span>
          </span>
          <span className={styles.bars} aria-label="Now playing">
            <i />
            <i />
            <i />
          </span>
        </a>
      )}

      {recentTracks.length > 0 && (
        <section className={styles.recentSection}>
          <h3>Recently played</h3>
          <div className={styles.recentList}>
            {recentTracks.map((recentTrack, index) => (
              <a
                className={styles.recentTrack}
                href={recentTrack.url || "https://open.spotify.com"}
                target="_blank"
                rel="noreferrer"
                key={`${recentTrack.url || recentTrack.title}-${index}`}
              >
                {recentTrack.cover && (
                  <img
                    className={styles.recentCover}
                    src={recentTrack.cover}
                    alt={recentTrack.album || "Album"}
                  />
                )}
                <span className={styles.recentInfo}>
                  <strong>{recentTrack.title}</strong>
                  <span>{recentTrack.artists}</span>
                </span>
                {recentTrack.played_at && (
                  <time dateTime={recentTrack.played_at}>
                    {new Date(recentTrack.played_at).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                )}
              </a>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
