import React from 'react';
import ReactDOM from 'react-dom/client';
import { ProjectProvider } from '@/ProjectContext'; // Ensure capital "P"
import HeaderNavBar from '@/HeaderNavBar'; // Direct sibling import check
import App from '@/App'; // Target App component directly
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </React.StrictMode>
);
