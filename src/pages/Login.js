import React, { useEffect, useState } from "react"; 
import { useAuth0 } from "@auth0/auth0-react";

const Login = () => {
  const {
    loginWithPopup,
    loginWithRedirect,
    getAccessTokenSilently,
    isAuthenticated,
    getIdTokenClaims,
  } = useAuth0();

  const [accessToken, setAccessToken] = useState(null); 
  const [idToken, setIdToken] = useState(null);

  useEffect(() => {
    const handleUserData = async () => {
      if (isAuthenticated) {
        try {
          // Fetch the access token
          const accessTokenResponse = await getAccessTokenSilently();
          console.log("Access Token:", accessTokenResponse); // Log the Access token
          setAccessToken(accessTokenResponse); // Store the Access token

          // Fetch the ID token claims
          const idTokenClaims = await getIdTokenClaims();
          const rawIdToken = idTokenClaims.__raw; // Get the raw id_token
          console.log("ID Token:", rawIdToken); // Log the ID token
          setIdToken(rawIdToken); // Store the ID token

          // Send the ID token to the backend
          await sendIdTokenToBackend(rawIdToken);

        } catch (error) {
          console.error("Error in handling user data:", error);
        }
      }
    };

    handleUserData();
  }, [isAuthenticated, getAccessTokenSilently, getIdTokenClaims]);

  const sendIdTokenToBackend = async (token) => {
    try {
      const response = await fetch("http://localhost:5000/receive-id-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // You can also send it in the Authorization header
        },
        body: JSON.stringify({ idToken: token }), // Send the token as JSON
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response from backend:", data); // Log the response from the backend

    } catch (error) {
      console.error("Error sending ID token to backend:", error);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      <h1>Welcome</h1>
      <button onClick={loginWithPopup} style={{ margin: "10px", padding: "10px 20px" }}>
        Login with Popup
      </button>
      <button onClick={loginWithRedirect} style={{ margin: "10px", padding: "10px 20px" }}>
        Login with Redirect
      </button>

      {accessToken && ( 
        <div style={{ marginTop: "20px" }}>
          <h2>Access Token:</h2>
          <pre>{accessToken}</pre> 
        </div>
      )}

      {idToken && ( 
        <div style={{ marginTop: "20px" }}>
          <h2>ID Token:</h2>
          <pre>{idToken}</pre> 
        </div>
      )}
    </div>
  );
};

export default Login;
