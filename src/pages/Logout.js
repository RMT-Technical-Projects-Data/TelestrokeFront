import React from "react";
import LogoutButton from "../components/Logout_button"; // Adjust the path as needed

const Logout = () => {
  return (
    <div>
      <h1>Logout</h1>
      <LogoutButton /> {/* Render the login button */}
    </div>
  );
};

export default Logout;
