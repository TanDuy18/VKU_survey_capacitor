import React from 'react';
import { seedCloud } from './cloud';

import { createRoot } from 'react-dom/client';
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/latin-600.css';
import '@fontsource/be-vietnam-pro/latin-800.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-600.css';
import '@fontsource/be-vietnam-pro/vietnamese-800.css';
import './styles.css';
import App from './App.jsx';

seedCloud(); 
createRoot(document.getElementById('root')).render(<App />);

// Service Worker chỉ đăng ký trên web (APK đã đóng gói sẵn file trong app)
if ('serviceWorker' in navigator && import.meta.env.PROD && !window.Capacitor?.isNativePlatform?.()) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
}
