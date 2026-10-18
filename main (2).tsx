import { createRoot } from "react-dom/client";
import App from "./src/App";
import './src/index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(<App />);
}
