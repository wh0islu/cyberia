import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./services/queryClient";
import { preloadCollections } from "./services/collections";
import "@fontsource-variable/geist/wght.css";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from "./App";


void preloadCollections();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
