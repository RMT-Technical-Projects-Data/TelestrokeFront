import React, { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";

const Logout = () => {
  const { logout } = useAuth0();

  useEffect(() => {
    // Call logout and redirect to login page
    logout({
      returnTo: window.location.origin + "/login", // Redirect to the login page
    });
  }, [logout]);

  return null; // No need to render anything
};

export default Logout;
