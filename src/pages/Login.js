import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function Login() {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  // Redirect to Google login when component mounts if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect({
        connection: "google-oauth2", // Redirect to Google login
      });
    } else {
      // Optionally redirect to dashboard if already authenticated
      window.location.href = "/dashboard";
    }
  }, [isAuthenticated, loginWithRedirect]);

  return null; // No UI, just redirecting
}
