import { useEffect, useState, type MouseEvent } from "react";
import styles from "./styles.module.css";
import {
  SunIcon,
  MoonIcon,
  House,
  LibraryBig,
  MonitorPlay,
  CalendarCheck2,
  Salad,
  BookOpenCheck,
  UserRound,
  Activity,
} from "lucide-react";

const ICONES = {
  inicio: House,
  livros: LibraryBig,
  filmes: MonitorPlay,
  rotina: CalendarCheck2,
  alimentacao: Salad,
  cursos: BookOpenCheck,
  insights: Activity,
  avatar: UserRound,
};

const GRUPOS = [
  {
    titulo: null,
    itens: [
      { id: "inicio", nome: "Home", href: "/" },
      { id: "insights", nome: "Insights", href: "/insights" },
    ],
  },
  {
    titulo: "Library",
    itens: [
      { id: "livros", nome: "Books", href: "/books" },
      { id: "filmes", nome: "Movies & Series", href: "/movies/series" },
      { id: "rotina", nome: "Routine", href: "/routine" },
      { id: "alimentacao", nome: "Meals", href: "/meals" },
      { id: "cursos", nome: "Courses", href: "/courses" },
    ],
  },
] as const;

function useTema() {
  const [tema, setTema] = useState<"dark" | "light">(() => {
    try {
      return localStorage.getItem("tema") === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    const raiz = document.documentElement;
    if (tema === "light") raiz.dataset.theme = "light";
    else delete raiz.dataset.theme;
    try {
      localStorage.setItem("tema", tema);
    } catch {}
  }, [tema]);

  return [tema, setTema] as const;
}

type SidebarProps = {
  rotaAtual?: string;
  contagens?: Partial<Record<keyof typeof ICONES, number>>;
  usuario?: { nome: string; sub: string };
  onNavigate?: (href: string) => void;
};

export function Sidebar({
  rotaAtual = "/",
  contagens = {},
  usuario = { nome: "My profile", sub: "Personal account" },
  onNavigate,
}: SidebarProps) {
  const [tema, setTema] = useTema();
  const [recolhido, setRecolhido] = useState(false);

  function handleNavigate(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (!onNavigate || href.startsWith("#")) return;

    event.preventDefault();
    onNavigate(href);
  }

  return (
    <aside
      className={`${styles.sidebar} ${
        recolhido ? styles["sidebar--collapsed"] : ""
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
          aria-label={recolhido ? "Expand menu" : "Collapse menu"}
          aria-expanded={!recolhido}
          onClick={() => setRecolhido((valorAtual) => !valorAtual)}
        >
          {recolhido ? "→" : "←"}
        </button>
      </div>

      <nav className={styles["sidebar__nav"]} aria-label="Sections">
        {GRUPOS.map((grupo, i) => (
          <div key={i} className={styles["sidebar__grupo"]}>
            {grupo.titulo && (
              <span className={styles["sidebar__grupo-titulo"]}>
                {grupo.titulo}
              </span>
            )}
            {grupo.itens.map((item) => {
              const ativo = rotaAtual === item.href;
              const IconeItem = ICONES[item.id];

              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={styles["sidebar__link"]}
                  aria-current={ativo ? "page" : undefined}
                  onClick={(event) => handleNavigate(event, item.href)}
                >
                  <IconeItem aria-hidden="true" />
                  <span className={styles["sidebar__link-nome"]}>
                    {item.nome}
                  </span>
                  {contagens[item.id] != null && (
                    <span className={styles["sidebar__contagem"]}>
                      {contagens[item.id]}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles["sidebar__rodape"]}>
        <div className={styles["sidebar__tema"]}>
          <span className={styles["sidebar__grupo-titulo"]}>Theme</span>
          <div className={styles.seg} role="group" aria-label="Theme">
            <button
              type="button"
              aria-pressed={tema === "dark"}
              onClick={() => setTema("dark")}
            >
              <MoonIcon aria-hidden="true" />
              Dark
            </button>
            <button
              type="button"
              aria-pressed={tema === "light"}
              onClick={() => setTema("light")}
            >
              <SunIcon aria-hidden="true" />
              Light
            </button>
          </div>
        </div>

        <a
          href="/profile"
          className={styles["sidebar__perfil"]}
          onClick={(event) => handleNavigate(event, "/profile")}
        >
          <span className={styles["sidebar__avatar"]} aria-hidden="true">
            <UserRound />
          </span>
          <span className={styles["sidebar__perfil-texto"]}>
            <strong>{usuario.nome}</strong>
            <span>{usuario.sub}</span>
          </span>
        </a>
      </div>
    </aside>
  );
}
