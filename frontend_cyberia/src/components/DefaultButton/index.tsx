import type { ComponentProps, ReactNode } from "react";
import styles from "./styles.module.css";

type DefaultButtonProps = {
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "accent" | "danger";
  size?: "sm" | "md" | "lg";
} & ComponentProps<"button">;

export function DefaultButton({
  icon,
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: DefaultButtonProps) {
  const classes = [
    styles.btn,
    styles[`btn--${variant}`],
    size !== "md" && styles[`btn--${size}`],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} {...props}>
      {icon}
      {children}
    </button>
  );
}
