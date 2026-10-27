import { useRef } from "react";
import styles from "./styles.module.css";

type MediaItem = {
  id: string;
  title: string;
  type: string;
  image: string;
  alt: string;
};

type MediaCarouselProps = {
  items: MediaItem[];
};

export function MediaCarousel({ items }: MediaCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  function move(direction: number) {
    viewportRef.current?.scrollBy({
      left: direction * viewportRef.current.clientWidth,
      behavior: "smooth",
    });
  }

  return (
    <div className={styles.carousel}>
      <div className={styles.controls}>
        <button type="button" onClick={() => move(-1)} aria-label="Previous watched items">
          ‹
        </button>
        <button type="button" onClick={() => move(1)} aria-label="Next watched items">
          ›
        </button>
      </div>

      <div className={styles.viewport} ref={viewportRef}>
        <div className={styles.track}>
          {items.map((item) => (
            <figure className={styles.item} key={item.id}>
              <img src={item.image} alt={item.alt} />
              <figcaption>
                {item.title}
                <small>{item.type}</small>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
