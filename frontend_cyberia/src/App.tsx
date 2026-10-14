import "./styles/global.css"
import "./styles/theme.css"

import { Menu } from "./components/Menu";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

export function App() {
  return (
    <>
      <Header>
        <Menu />
      </Header>
      <Footer />
    </>
  );
}
