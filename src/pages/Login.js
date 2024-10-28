import React, { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Login = () => {
  const { loginWithRedirect, isAuthenticated, user } = useAuth0();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // This function will handle triggering the backend to save user info
  const triggerUserSave = async () => {
    try {
      // Send the user info to the backend
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: user.email,
          name: user.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save user info');
      }

      const data = await response.json();
      console.log("Response from backend:", data);

      // Handle the response appropriately, e.g., redirect or store user info

    } catch (error) {
      setError(error.message);
      console.error("Error saving user info to backend:", error);
    }
  };

  useEffect(() => {
    const authenticateUser = async () => {
      if (isAuthenticated) {
        try {
          // Directly call the function to save user info
          await triggerUserSave();
        } catch (error) {
          setError(error.message);
          console.error("Error saving user info:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    authenticateUser();
  }, [isAuthenticated, user]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Login Page</h1>
      {!isAuthenticated ? (
        <button onClick={loginWithRedirect}>Log In</button>
      ) : (
        <div>Welcome, {user.name}</div>
      )}
    </div>
  );
};

export default Login;
