import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './pages/CartContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CartProvider> {/* Wrap App with CartProvider */}
      <App />
    </CartProvider>
  </StrictMode>,
);
