import type { ElementType, HTMLAttributes } from "react";
import styles from "./styles.module.css";

type CardProps = HTMLAttributes<HTMLElement> & {
  title?: string;
  action?: { label: string; href: string };
  compact?: boolean;
  as?: ElementType;
};

export function Card({
  title,
  action,
  compact = false,
  as: Tag = "section",
  className = "",
  children,
  ...props
}: CardProps) {
  const titleId = title
    ? `card-${title.toLowerCase().replace(/\s+/g, "-")}`
    : undefined;

  return (
    <Tag
      className={[styles.card, compact && styles["card--compact"], className]
        .filter(Boolean)
        .join(" ")}
      aria-labelledby={titleId}
      {...props}
    >
      {(title || action) && (
        <div className={styles["card__header"]}>
          {title && (
            <h2 id={titleId} className={styles["card__title"]}>
              {title}
            </h2>
          )}
          {action && (
            <a className={styles["card__action"]} href={action.href}>
              {action.label}
            </a>
          )}
        </div>
      )}
      {children}
    </Tag>
  );
}
