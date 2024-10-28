import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Auth0Provider } from '@auth0/auth0-react';

// Create the root element for rendering
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the App wrapped with Auth0Provider for authentication
root.render(
    <Auth0Provider
        domain="dev-pze8jy5r117ncxha.us.auth0.com"         // Your Auth0 domain
        clientId="L2C35hxdi18IylJYG6vLiJx2EQ8tJZp3"         // Your Auth0 client ID
        authorizationParams={{
            redirect_uri: window.location.origin,           // Redirect URI after login
            audience: "https://your-app.com/api",           // Audience for your API
            scope: "openid profile email"                   // Scopes for user info and access token
        }}
    >
        <App />
    </Auth0Provider>
);

// Optional: for measuring performance
reportWebVitals();
