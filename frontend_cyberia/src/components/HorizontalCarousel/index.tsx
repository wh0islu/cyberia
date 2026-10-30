import { useRef, type PointerEvent, type ReactNode } from "react";
import styles from "./styles.module.css";

type HorizontalCarouselProps = {
  children: ReactNode;
  label: string;
};

export function HorizontalCarousel({ children, label }: HorizontalCarouselProps) {
  const dragRef = useRef<{ startX: number; scrollLeft: number; dragging: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    suppressClickRef.current = false;
    if (event.pointerType !== "mouse" || event.button !== 0 ||
      (event.target as HTMLElement).closest("button, a, input, select, textarea")) return;

    dragRef.current = {
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
      dragging: false,
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const distance = event.clientX - drag.startX;
    if (!drag.dragging && Math.abs(distance) < 5) return;

    if (!drag.dragging) {
      drag.dragging = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add(styles.dragging);
    }
    event.currentTarget.scrollLeft = drag.scrollLeft - distance;
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    suppressClickRef.current = Boolean(dragRef.current?.dragging);
    dragRef.current = null;
    event.currentTarget.classList.remove(styles.dragging);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      className={styles.viewport}
      role="region"
      aria-label={label}
      tabIndex={0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onDragStart={(event) => event.preventDefault()}
      onClickCapture={(event) => {
        if (!suppressClickRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
      }}
    >
      <div className={styles.track}>{children}</div>
    </div>
  );
}
