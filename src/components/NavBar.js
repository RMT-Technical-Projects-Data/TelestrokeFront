import React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import logo from "../assets/Telestroke-logo.png";
import profile from "../assets/btn_profile.svg";

const NavBar = ({ disableDashboardLink = false }) => {
  // Retrieve the username from local storage
  const Doctor = localStorage.getItem("Doctor") || "Anonymous";

  return (
      <div className="bg-white w-screen h-[7%] p-1 py-7 px-7 flex flex-row justify-between items-center border-b-2 border-gray-300 text-gray-800 z-50 fixed top-0 left-0">
        
        <div className="flex items-center justify-between w-full">
          {/* Conditionally render the dashboard link */}
          {!disableDashboardLink ? (
            <Link
              to="/dashboard"
              className="flex items-center p-2 hover:bg-transparent transition-transform duration-150 ease-in-out transform hover:scale-110"
            >
              <img
                src={logo}
                alt="logo"
                className="inline"
                style={{ width: "auto", maxHeight: "100px" }}
              />
            </Link>
          ) : (
            <div className="flex items-center p-2">
              <img
                src={logo}
                alt="logo"
                className="inline"
                style={{ width: "auto", maxHeight: "100px" }}
              />
            </div>
          )}
          
       
        </div>
    
        {/* Profile section */}
        <div className="hidden md:flex items-center gap-5">
          <img src={profile} width={25} alt="profile" />
          <p>{Doctor}</p> {/* Display the username */}
        </div>
    
      </div>
    );
    
};

export default NavBar;
