import { useState, type MouseEvent } from "react";
import { DefaultButton } from "../DefaultButton";
import { useTheme } from "../../hooks/useTheme";
import styles from "./styles.module.css";
import {
  House,
  LibraryBig,
  MonitorPlay,
  CalendarCheck2,
  Salad,
  BookOpenCheck,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
} from "lucide-react";

const icons = {
  home: House,
  books: LibraryBig,
  movies: MonitorPlay,
  routine: CalendarCheck2,
  meals: Salad,
  courses: BookOpenCheck,
  insights: Activity,
};

type SectionCountKey = "books" | "movies" | "routine" | "courses";
type NavigationItem = {
  id: keyof typeof icons;
  name: string;
  href: string;
  countKey?: SectionCountKey;
};
type NavigationGroup = { title: string | null; items: NavigationItem[] };

const navigationGroups: NavigationGroup[] = [
  {
    title: null,
    items: [
      { id: "home", name: "Home", href: "/" },
      { id: "insights", name: "Insights", href: "/insights" },
    ],
  },
  {
    title: "Library",
    items: [
      { id: "books", name: "Books", href: "/books", countKey: "books" },
      { id: "movies", name: "Movies & Series", href: "/movies/series", countKey: "movies" },
      { id: "routine", name: "Routine", href: "/routine", countKey: "routine" },
      { id: "meals", name: "Meals", href: "/meals" },
      { id: "courses", name: "Courses", href: "/courses", countKey: "courses" },
    ],
  },
] as const;

type SidebarProps = {
  currentPath?: string;
  counts?: Partial<Record<SectionCountKey, number>>;
  onNavigate?: (href: string) => void;
};

export function Sidebar({
  currentPath = "/",
  counts = {},
  onNavigate,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  function handleNavigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!onNavigate || href.startsWith("#")) return;

    event.preventDefault();
    onNavigate(href);
  }

  return (
    <aside
      className={`${styles.sidebar} ${
        isCollapsed ? styles["sidebar--collapsed"] : ""
      }`}
    >
      <div className={styles["sidebar__cabecalho"]}>
        <a
          href="/"
          className={styles["sidebar__logo"]}
          aria-label="Cyberia, home"
          onClick={(event) => handleNavigate(event, "/")}
        >
          <svg viewBox="0 0 34 34" fill="none" aria-hidden="true">
            <circle cx="17" cy="17" r="17" fill="var(--text-default)" />
            <path
              d="M17 9.5v15M10.5 13.25l13 7.5M10.5 20.75l13-7.5"
              stroke="var(--bg-surface)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span>cyberia</span>
        </a>
        <button
          type="button"
          className={styles["sidebar__toggle"]}
          aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
          aria-expanded={!isCollapsed}
          title={isCollapsed ? "Expand menu" : "Collapse menu"}
          onClick={() => setIsCollapsed((currentValue) => !currentValue)}
        >
          {isCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
        </button>
      </div>

      <nav className={styles["sidebar__nav"]} aria-label="Sections">
        {navigationGroups.map((group) => (
          <div key={group.title ?? "main"} className={styles["sidebar__grupo"]}>
            {group.title && (
              <span className={styles["sidebar__grupo-titulo"]}>
                {group.title}
              </span>
            )}
            {group.items.map((item) => {
              const isActive = currentPath === item.href;
              const ItemIcon = icons[item.id];

              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={styles["sidebar__link"]}
                  aria-label={item.name}
                  title={isCollapsed ? item.name : undefined}
                  aria-current={isActive ? "page" : undefined}
                  onClick={(event) => handleNavigate(event, item.href)}
                >
                  <ItemIcon aria-hidden="true" />
                  <span className={styles["sidebar__link-nome"]}>
                    {item.name}
                  </span>
                  {item.countKey && counts[item.countKey] != null && (
                    <span className={styles["sidebar__contagem"]}>
                      {counts[item.countKey]}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles["sidebar__footer"]}>
        <DefaultButton
          className={styles["sidebar__theme"]}
          variant="ghost"
          size="sm"
          icon={theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          aria-label={`Switch to ${nextTheme} theme`}
          title={isCollapsed ? `Switch to ${nextTheme} theme` : undefined}
          onClick={toggleTheme}
        >
          <span className={styles["sidebar__theme-label"]}>
            {theme === "dark" ? "Light theme" : "Dark theme"}
          </span>
        </DefaultButton>
      </div>
    </aside>
  );
}
