import type { HTMLAttributes } from "react";
import styles from "./styles.module.css";

type ScrollAreaProps = HTMLAttributes<HTMLDivElement>;

export function ScrollArea({ className = "", children, ...props }: ScrollAreaProps) {
  return (
    <div
      className={[styles.scrollArea, className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
