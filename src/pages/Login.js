import React, { useEffect, useState } from "react"; 
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom"; 
import LoginImage from "../assets/Login.jpg"; // Import the image from your assets folder

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
  const navigate = useNavigate(); 

  useEffect(() => {
    const handleUserData = async () => {
      if (isAuthenticated) {
        try {
          const accessTokenResponse = await getAccessTokenSilently();
          setAccessToken(accessTokenResponse); 

          const idTokenClaims = await getIdTokenClaims();
          const rawIdToken = idTokenClaims.__raw; 
          setIdToken(rawIdToken); 

          await sendIdTokenToBackend(rawIdToken);
          navigate("/dashboard"); 

        } catch (error) {
          console.error("Error in handling user data:", error);
        }
      }
    };

    handleUserData();
  }, [isAuthenticated, getAccessTokenSilently, getIdTokenClaims, navigate]);

  const sendIdTokenToBackend = async (token) => {
    try {
      const response = await fetch("http://localhost:5000/receive-id-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, 
        },
        body: JSON.stringify({ idToken: token }), 
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response from backend:", data);

    } catch (error) {
      console.error("Error sending ID token to backend:", error);
    }
  };

  return (
    <div style={styles.container}>
      {/* Left half with image */}
      <div style={styles.imageContainer}>
        <img src={LoginImage} alt="Login" style={styles.image} />
      </div>
      
      {/* Right half with text and buttons */}
      <div style={styles.contentContainer}>
        <h1 style={styles.heading}>Welcome to Telestroke WebApp</h1>
        <button onClick={loginWithPopup} style={styles.button}>
          Login with Popup
        </button>
        <button onClick={loginWithRedirect} style={styles.button}>
          Login with Redirect
        </button>
        
        {accessToken && (
          <div style={styles.tokenContainer}>
            <h2>Access Token:</h2>
            <pre>{accessToken}</pre> 
          </div>
        )}

        {idToken && (
          <div style={styles.tokenContainer}>
            <h2>ID Token:</h2>
            <pre>{idToken}</pre> 
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    height: "100vh",
  },
  imageContainer: {
    flex: 0.65,
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  contentContainer: {
    flex: 0.35,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    backgroundColor: "#f5f5f5",
    textAlign: "center",
  },
  heading: {
    fontSize: "1.8rem",
    fontWeight: "bold",
    marginBottom: "20px",
  },
  button: {
    margin: "10px",
    padding: "10px 20px",
    backgroundColor: "#4A90E2",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "1rem",
    transition: "background-color 0.3s",
  },
  tokenContainer: {
    marginTop: "20px",
    textAlign: "left",
    maxWidth: "80%",
  },
};

export default Login;
