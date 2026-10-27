import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { SunIcon, MoonIcon } from "lucide-react";
import styles from "./styles.module.css";

const avatarUrl = "/media/profile/pfp/pfp_qG9jrmo.png";
const logoPath = "/media/logo.svg";

type AvailableThemes = "dark" | "light";

export function Menu() {
  const [theme, setTheme] = useState<AvailableThemes>(() => {
    const storageTheme = localStorage.getItem("theme") as AvailableThemes;
    return storageTheme === "light" ? "light" : "dark";
  });

  const nextThemeIcon: Record<AvailableThemes, ReactNode> = {
    dark: <SunIcon />,
    light: <MoonIcon />,
  };

  function handleChangeTheme(
    event: MouseEvent<HTMLAnchorElement>,
  ) {
    event.preventDefault();
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <nav className={styles.menu}>
      <div className={styles.logoHome}>
        <a href="/home" title="Home">
          <img className={styles.logoHomeStart} src={logoPath} alt="Logo" />
        </a>
      </div>
      <ul className={styles.menuLink}>
        <li>
          <a href="/">Home</a>
        </li>
        <li>
          <a href="/books">Books</a>
        </li>
        <li>
          <a href="/movies/series">Entertainment</a>
        </li>
        <li>
          <a href="/">Routine</a>
        </li>
        <li>
          <a href="/">Courses</a>
        </li>
        <li>
          <a
            href="#"
            aria-label="Change theme"
            title="Change theme"
            onClick={handleChangeTheme}
          >
            {nextThemeIcon[theme]}
          </a>
        </li>
      </ul>
      <div className={styles.navUser}>
        <a href="/profile" title="Profile">
          <img className={styles.navUserAvatar} src={avatarUrl} alt="Avatar" />
        </a>
        <a href="/logout">Log out</a>
      </div>
    </nav>
  );
}
