import React from "react";
import LogoutButton from "../components/Logout_button"; // Adjust the path if needed

const Logout = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Are you sure you want to log out?</h1>
      <LogoutButton /> {/* Render the logout button */}
    </div>
  );
};

export default Logout;
