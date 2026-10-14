import styles from "./styles.module.css";

const avatarUrl =
  "media/profile/pfp/Screenshot_2026-10-09_at_23-46-56_somalia_-_Pesquisa_Google.png";
export function Menu() {
  return (
    <nav className={styles.menu}>
      <ul className={styles.menuLink}>
        <li>
          <a href="/">/home</a>
        </li>
        <li>
          <a href="/">/books</a>
        </li>
        <li>
          <a href="/">/movies/series</a>
        </li>
      </ul>
      <div className={styles.navUser}>
        <span>Pingu</span>
        <a href="/profile" title="Profile">
          <img
            className={styles.navUserAvatar}
            src={avatarUrl}
            alt="Avatar de Pingu"
          />
        </a>
        <a href="/logout">/quit</a>
      </div>
    </nav>
  );
}
