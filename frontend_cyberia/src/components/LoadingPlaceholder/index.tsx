import styles from "./styles.module.css";

type LoadingPlaceholderProps = {
  compact?: boolean;
};

export function LoadingPlaceholder({ compact = false }: LoadingPlaceholderProps) {
  return (
    <span
      className={`${styles.placeholder} ${compact ? styles.compact : ""}`}
      role="status"
      aria-label="Loading content"
    >
      <span className={styles.line} aria-hidden="true" />
      {!compact && <span className={styles.shortLine} aria-hidden="true" />}
    </span>
  );
}