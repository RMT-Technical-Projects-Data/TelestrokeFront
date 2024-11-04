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
            clientId="6k6KDVCo9951hHmXKUP4560xboSuHJaJ"         // Your Auth0 client ID
            redirectUri={window.location.origin}
            audience="Unique Identifier 2621" // Ensure this matches your API identifier
            scope="openid profile email" // Include scopes for user info
        >
            <App />
        </Auth0Provider>
    
);

// Optional: for measuring performance
reportWebVitals();
