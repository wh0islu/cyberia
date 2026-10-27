import { useEffect, useState } from "react";
import { Home } from "./components/Home";
import { Books } from "./components/Books";
import { Courses } from "./components/Courses";
import { Meals } from "./components/Meals";
import { Movies } from "./components/Movies";
import { Routine } from "./components/Routine";
import { Sidebar } from "./components/Sidebar";
import { Insights } from "./components/Insights";
import "./styles/global.css";
import "./styles/theme.css";
import styles from "./App.module.css";

export function App() {
  const [rotaAtual, setRotaAtual] = useState(() => window.location.pathname);
  const isBooksPage = rotaAtual === "/books";
  const isMoviesPage = rotaAtual === "/movies/series";
  const isMealsPage = rotaAtual === "/meals";
  const isCoursesPage = rotaAtual === "/courses";
  const isRoutinePage = rotaAtual === "/routine";
  const isInsightsPage = rotaAtual === "/insights";

  useEffect(() => {
    const atualizarRota = () => setRotaAtual(window.location.pathname);
    window.addEventListener("popstate", atualizarRota);

    return () => window.removeEventListener("popstate", atualizarRota);
  }, []);

  useEffect(() => {
    function interceptarLinks(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const elemento = event.target as HTMLElement;
      const link = elemento.closest("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      navegarPara(url.pathname);
    }

    document.addEventListener("click", interceptarLinks);
    return () => document.removeEventListener("click", interceptarLinks);
  });

  function navegarPara(href: string) {
    if (href === window.location.pathname) return;

    window.history.pushState({}, "", href);
    setRotaAtual(href);
  }

  return (
    <div className={styles.app}>
      <Sidebar
        rotaAtual={rotaAtual}
        contagens={{ livros: 26, filmes: 44, rotina: 5, alimentacao: 16, cursos: 3 }}
        onNavigate={navegarPara}
      />
      <div className={styles.app__conteudo}>
        {isBooksPage ? (
          <Books />
        ) : isMoviesPage ? (
          <Movies />
        ) : isMealsPage ? (
          <Meals />
        ) : isCoursesPage ? (
          <Courses />
        ) : isRoutinePage ? (
          <Routine />
        ) : isInsightsPage ? (
          <Insights />
        ) : (
          <Home />
        )}
      </div>
    </div>
  );
}
