import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/theme-vars.css';
import './styles/global.css';
import './styles/workbench.css';
import { initNotificationSound } from './notification-sound';
import { APP_CONFIG } from '../shared/app-config';

initNotificationSound();

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ErrorBoundary label={APP_CONFIG.productName}>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
