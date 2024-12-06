import React from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import logo from "../assets/Telestroke.png";
// import notification from "../assets/btn_notification.svg";
import profile from "../assets/btn_profile.svg";

const NavBar = () => {
  // Retrieve the username from local storage
  const Doctor = localStorage.getItem("Doctor") || "Anonymous";

  return (
    <div className="bg-white w-screen h-[5%] p-1 py-0 px-7 flex flex-row justify-between border-b-2 border-gray-300 text-gray-800">
      <div className="flex items-center">
        {/* Wrap the logo and name in a Link component */}
        <Link
          to="/dashboard"
          className="flex items-center p-2 hover:bg-transparent transition-transform duration-150 ease-in-out transform hover:scale-110"
        >
          <img
            src={logo}
            alt="logo"
            className="inline"
            style={{ width: "auto", maxHeight: "60px" }} // Adjusted size
          />
          <h1 className="font-black">TELESTROKE</h1>
        </Link>
      </div>

      <div className="flex items-center gap-5">
        {/* <img src={notification} width={20} alt="notification" /> */}
        <img src={profile} width={25} alt="profile" />
        <p>Dr. {Doctor}</p> {/* Display the username */}
      </div>
    </div>
  );
};

export default NavBar;
