import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import { ProjectProvider } from '@/ProjectContext';
import '@/index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Required root DOM rendering element node container target was not found in the index document mapping layout.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ProjectProvider>
      <App />
    </ProjectProvider>
  </React.StrictMode>
);
