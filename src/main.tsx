import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { SavedReefsProvider } from './hooks/useSavedReefs';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SavedReefsProvider>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </SavedReefsProvider>
  </StrictMode>,
)
