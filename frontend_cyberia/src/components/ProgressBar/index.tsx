import styles from "./styles.module.css";

type ProgressBarProps = {
  value: number;
  max: number;
  /** Accessible name read by screen readers, e.g. "Dune reading progress". Required (WCAG 1.1.1 / 4.1.2). */
  label: string;
  className?: string;
};

export function ProgressBar({ value, max, label, className = "" }: ProgressBarProps) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;

  return (
    <div
      className={`${styles.track} ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuetext={`${Math.round(percentage)}%`}
    >
      <div className={styles.value} style={{ width: `${percentage}%` }} />
    </div>
  );
}
