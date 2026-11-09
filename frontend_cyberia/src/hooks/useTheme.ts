import { useEffect, useState } from "react";

export type Theme = "dark" | "light";

function getStoredTheme(): Theme {
  try {
    return localStorage.getItem("theme") === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "light") root.dataset.theme = "light";
    else delete root.dataset.theme;

    root.style.colorScheme = theme;

    try {
      localStorage.setItem("theme", theme);
    } catch {
      // The selected theme still works when storage is unavailable.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark");
  }

  return { theme, toggleTheme };
}
