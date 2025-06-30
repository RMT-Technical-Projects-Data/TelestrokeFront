// import React from "react";
// import { Link } from "react-router-dom"; // Import Link for navigation
// import logo from "../assets/Telestroke-logo.png";
// import profile from "../assets/btn_profile.svg";

// const NavBar = ({ disableDashboardLink = false }) => {
//   // Retrieve the username from local storage
//   const Doctor = localStorage.getItem("Doctor") || "Anonymous";

//   return (
//       <div className="bg-white w-screen h-[7%] p-1 py-7 px-7 flex flex-row justify-between items-center border-b-2 border-gray-300 text-gray-800 z-50 fixed top-0 left-0">
        
//         <div className="flex items-center justify-between w-full">
//           {/* Conditionally render the dashboard link */}
//           {!disableDashboardLink ? (
//             <Link
//               to="/dashboard"
//               className="flex items-center p-2 hover:bg-transparent transition-transform duration-150 ease-in-out transform hover:scale-110"
//             >
//               <img
//                 src={logo}
//                 alt="logo"
//                 className="inline"
//                 style={{ width: "auto", maxHeight: "100px" }}
//               />
//             </Link>
//           ) : (
//             <div className="flex items-center p-2">
//               <img
//                 src={logo}
//                 alt="logo"
//                 className="inline"
//                 style={{ width: "auto", maxHeight: "100px" }}
//               />
//             </div>
//           )}
          
       
//         </div>
    
//         {/* Profile section */}
//         <div className="hidden md:flex items-center gap-5">
//           <img src={profile} width={25} alt="profile" />
//           <p>{Doctor}</p> {/* Display the username */}
//         </div>
    
//       </div>
//     );
    
// };

// export default NavBar;
import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/Telestroke-logo.png";
import profile from "../assets/btn_profile.svg";
import Sidebar from "./Sidebar";

const NavBar = ({ disableDashboardLink = false }) => {
  const Doctor = localStorage.getItem("Doctor") || "Anonymous";
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDoctorName, setShowDoctorName] = useState(false);

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  const toggleDoctorName = () => {
    setShowDoctorName(!showDoctorName);
  };

  return (
    <>
      <div className="bg-white w-screen h-[48px] sm:h-[64px] px-4 sm:px-7 flex flex-row justify-between items-center border-b-2 border-gray-300 text-gray-800 z-50 fixed top-0 left-0">
        
        {/* Mobile menu button */}
        <div className="sm:hidden">
          <button onClick={toggleSidebar} className="focus:outline-none">
            <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Logo section */}
        <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 sm:justify-start">
          {!disableDashboardLink ? (
            <Link
              to="/dashboard"
              className="flex items-center p-2 hover:bg-transparent transition-transform duration-150 ease-in-out transform hover:scale-110"
            >
              <img
                src={logo}
                alt="logo"
                className="inline h-[48px] sm:h-[68px] md:h-[80px] lg:h-[90px]"
                style={{ width: "auto" }}
              />
            </Link>
          ) : (
            <div className="flex items-center p-2">
              <img
                src={logo}
                alt="logo"
                className="inline h-[48px] sm:h-[64px] md:h-[80px] lg:h-[90px]"
                style={{ width: "auto" }}
              />
            </div>
          )}
        </div>

        {/* Profile section */}
{/* Profile section */}
<div className="flex items-center relative group">
  <img
    src={profile}
    width={22}
    alt="profile"
    className="cursor-pointer"
    onClick={toggleDoctorName}
    onMouseEnter={() => setShowDoctorName(true)}
    onMouseLeave={() => setShowDoctorName(false)}
  />

  {/* Tooltip for mobile/tablet (click or hover) */}
  <div
    className={`
      absolute top-full mt-1 right-0
      bg-white text-gray-800 text-xs px-2 py-1 rounded shadow border 
      whitespace-nowrap z-50
      ${showDoctorName ? "block" : "hidden"}
      md:hidden
    `}
    style={{ maxWidth: "200px" }}
  >
    {Doctor}
  </div>

  {/* Inline name for desktop */}
  <p className="hidden md:block ml-2 text-sm">{Doctor}</p>
</div>

      </div>

      {/* Sidebar only rendered on small screens */}
      {showSidebar && (
        <div className="sm:hidden">
          <Sidebar isMobileOpen={showSidebar} onClose={toggleSidebar} />
        </div>
      )}
    </>
  );
};

export default NavBar;


