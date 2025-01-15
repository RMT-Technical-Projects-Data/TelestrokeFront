import React from "react";
import dashboard from "../assets/btn_dashboard.svg";
import appointments from "../assets/btn_appointments.svg";
import emr from "../assets/btn_EMR.svg";
import patient from "../assets/btn_patients.svg";
import LogoutIcon from "../assets/btn_Logout.png"; // Import the Logout image
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate for programmatic navigation

const Sidebar = ({ page }) => {
  const navigate = useNavigate(); // Initialize useNavigate hook for redirection

  // Custom logout handler
  const handleLogout = () => {
    // Remove the token from localStorage or sessionStorage
    localStorage.removeItem("token");
    
    // You can also clear any other data like user info, etc. if stored in localStorage
    // localStorage.removeItem("user");

    // Redirect to login page
    navigate("/login"); // Navigate to the login page after logout
  };

  return (
    <div className="fixed top-10 left-0 flex flex-col justify-center rounded-r-xl px-4 bg-[#1c2434] h-[100vh] w-[250px] text-white gap-10 z-40">
      <Link to="/dashboard">
        <div
          className={
            page === "DASHBOARD"
              ? "flex flex-row items-center p-2 cursor-pointer bg-slate-700 rounded-xl hover:bg-slate-600 hover:rounded-lg"
              : "flex flex-row items-center p-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
          }
        >
          <img
            src={page === "DASHBOARD" ? dashboard : dashboard}
            width={60} // You can adjust the size here
            alt="dashboard"
            className="mr-4" // Adds margin-right to space out icon and text
          />
          <p className="hidden lg:inline">Dashboard</p>
        </div>
      </Link>
  
      <Link to="/appointment">
        <div
          className={
            page === "APPOINTMENTS"
              ? "flex flex-row items-center p-2 cursor-pointer bg-slate-700 rounded-xl hover:bg-slate-600 hover:rounded-lg"
              : "flex flex-row items-center p-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
          }
        >
          <img
            src={page === "APPOINTMENTS" ? appointments : appointments}
            width={60} // You can adjust the size here
            alt="appointments"
            className="mr-4" // Adds margin-right to space out icon and text
          />
          <p className="hidden lg:inline">Appointments</p>
        </div>
      </Link>
  
      <Link to="/emr">
        <div
          className={
            page === "EMR"
              ? "flex flex-row items-center p-2 cursor-pointer bg-slate-700 rounded-xl hover:bg-slate-600 hover:rounded-lg"
              : "flex flex-row items-center p-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
          }
        >
          <img
            src={page === "EMR" ? emr : emr}
            width={60} // You can adjust the size here
            alt="emr"
            className="mr-4" // Adds margin-right to space out icon and text
          />
          <p className="hidden lg:inline">EMR</p>
        </div>
      </Link>
  
      <Link to="/meeting">
        <div
          className={
            page === "PATIENTS"
              ? "flex flex-row items-center p-2 cursor-pointer bg-slate-700 rounded-xl hover:bg-slate-600 hover:rounded-lg"
              : "flex flex-row items-center p-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
          }
        >
          <img
            src={page === "PATIENTS" ? patient : patient}
            width={60} // You can adjust the size here
            alt="patient"
            className="mr-4" // Adds margin-right to space out icon and text
          />
          <p className="hidden lg:inline">Meeting</p>
        </div>
      </Link>
  
      {/* Logout Button with Image */}
      <div
        onClick={handleLogout} // Use the custom logout handler here
        className="flex flex-row items-center p-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
      >
        <img src={LogoutIcon} width={60} alt="logout" className="mr-4" /> {/* Adds margin-right */}
        <p className="hidden lg:inline">Logout</p>
      </div>
    </div>
  );
  
};

export default Sidebar;
