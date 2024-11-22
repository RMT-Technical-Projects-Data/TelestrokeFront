import React from "react";
import dashboard from "../assets/btn_dashboard.svg";
import dashboard_selected from "../assets/btn_dashboard_selected.svg";
import appointments from "../assets/btn_appointments.svg";
import appointments_selected from "../assets/btn_appointments_selected.svg";
import emr from "../assets/btn_EMR.svg";
import emr_selected from "../assets/btn_EMR_selected.svg";
import patient from "../assets/btn_patients.svg";
import patient_selected from "../assets/btn_patients_selected.svg";
import settings from "../assets/btn_settings.svg";
import settings_selected from "../assets/btn_settings_selected.svg";
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
    <div className="fixed flex flex-col justify-center rounded-r-xl px-4 bg-slate-800 h-[100%] text-white gap-10">
      <Link to="/dashboard">
        <div
          className={
            page === "DASHBOARD"
              ? " flex flex-col items-center p-2 cursor-pointer bg-slate-700 rounded-xl hover:bg-slate-600 hover:rounded-lg"
              : "flex flex-col items-center p-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
          }
        >
          <img
            src={page === "DASHBOARD" ? dashboard_selected : dashboard}
            width={60}
            alt="dashboard"
          />
          <p className="hidden lg:inline"> Dashboard</p>
        </div>
      </Link>

      <Link to="/appointment">
        <div
          className={
            page === "APPOINTMENTS"
              ? " flex flex-col items-center p-2 cursor-pointer bg-slate-700 rounded-xl hover:bg-slate-600 hover:rounded-lg"
              : "flex flex-col items-center p-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
          }
        >
          <img
            src={page === "APPOINTMENTS" ? appointments_selected : appointments}
            width={60}
            alt="appointments"
          />
          <p className="hidden lg:inline">Appointments</p>
        </div>
      </Link>

      <Link to="/emr">
        <div
          className={
            page === "EMR"
              ? " flex flex-col items-center p-2 cursor-pointer bg-slate-700 rounded-xl hover:bg-slate-600 hover:rounded-lg"
              : "flex flex-col items-center p-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
          }
        >
          <img src={page === "EMR" ? emr_selected : emr} width={60} alt="emr" />
          <p className="hidden lg:inline">EMR</p>
        </div>
      </Link>

      <Link to="/meeting">
        <div
          className={
            page === "PATIENTS"
              ? " flex flex-col items-center p-2 cursor-pointer bg-slate-700 rounded-xl hover:bg-slate-600 hover:rounded-lg"
              : "flex flex-col items-center p-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
          }
        >
          <img
            src={page === "PATIENTS" ? patient_selected : patient}
            width={60}
            alt="patient"
          />
          <p className="hidden lg:inline">Meeting</p>
        </div>
      </Link>

      {/* Logout Button with Image */}
      <div
        onClick={handleLogout} // Use the custom logout handler here
        className="flex flex-col items-center p-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
      >
        <img src={LogoutIcon} width={60} alt="logout" /> {/* Use the Logout image */}
        <p className="hidden lg:inline">Logout</p>
      </div>
    </div>
  );
};

export default Sidebar;
