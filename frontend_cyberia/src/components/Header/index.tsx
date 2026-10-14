import styles from "./styles.module.css";

type HeaderProps = {
    children: React.ReactNode;
}
export function Header({ children }: HeaderProps){
    return(
        <header className={styles.header}>{children}</header>
    )
}