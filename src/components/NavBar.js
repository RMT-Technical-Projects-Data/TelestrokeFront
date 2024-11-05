// NavBar.js

import React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import logo from "../assets/btn_Logo.svg";
import notification from "../assets/btn_notification.svg";
import profile from "../assets/btn_profile.svg";
import { useAuth0 } from "@auth0/auth0-react"; // Import the useAuth0 hook

const NavBar = () => {
  const { user } = useAuth0(); // Get user information from Auth0

  // Extract nickname or use a default value
  const nickname = user?.nickname || "Anonymous";

  return (
    <div className="bg-[#E9F5FE] w-screen h-[5%] p-2 px-7 flex flex-row justify-between">
      <div className="flex items-center">
        {/* Wrap the logo and name in a Link component */}
        <Link
          to="/dashboard"
          className="flex items-center p-2 hover:bg-transparent transition-transform duration-150 ease-in-out transform hover:scale-110" // Apply hover effect to the container
        >
          <img src={logo} width={25} alt="logo" className="inline" />
          <p className="inline ml-3 text-2xl font-bold">Telestroke</p>
        </Link>
      </div>

      <div className="flex items-center gap-5">
        <img src={notification} width={20} alt="notification" />
        <img src={profile} width={25} alt="profile" />
        <p>Dr. {nickname}</p> {/* Display the nickname */}
      </div>
    </div>
  );
};

export default NavBar;
