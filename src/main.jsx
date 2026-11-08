import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import {WorkspaceProvider} from './WorkspaceContext.jsx';
import StartupBoundary from './StartupBoundary.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StartupBoundary><WorkspaceProvider><App /></WorkspaceProvider></StartupBoundary>
  </React.StrictMode>
);
