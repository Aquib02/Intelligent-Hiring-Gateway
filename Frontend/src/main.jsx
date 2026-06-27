import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* YAHAN APNI CLIENT ID PASTE KAREIN 👇 */}
    <GoogleOAuthProvider clientId="624933773014-pvk8mcc9janp5cc6mfjfbl6803jpcsgm.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)