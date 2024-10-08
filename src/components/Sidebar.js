import React from "react";
import dashboard from "../assets/dashboard.svg";
import dashboard_selected from "../assets/dashboard_selected.svg";
import appointments from "../assets/appointments.svg";
import appointments_selected from "../assets/appointments_selected.svg";
import emr from "../assets/EMR.svg";
import emr_selected from "../assets/EMR_selected.svg";
import patient from "../assets/patients.svg";
import patient_selected from "../assets/patients_selected.svg";
import settings from "../assets/settings.svg";
import settings_selected from "../assets/settings_selected.svg";
// Import useAuth0 hook for logout
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";

const Sidebar = ({ page }) => {
  const { logout } = useAuth0(); // Get the logout function from Auth0

  return (
    <div className="fixed flex flex-col justify-center rounded-r-xl px-4 bg-slate-800 h-[100%] text-white gap-10">
      <Link to="/dashboard">
        <div
          className={
            page === "DASHBOARD"
              ? " flex flex-col  items-center  p-2 cursor-pointer bg-slate-700 rounded-xl hover:bg-slate-600 hover:rounded-lg"
              : "flex flex-col items-center p-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
          }
        >
          <img src={page === "DASHBOARD" ? dashboard_selected : dashboard} width={60} alt="dashboard" />
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
          <img src={page === "APPOINTMENTS" ? appointments_selected : appointments} width={60} alt="appointments" />
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

      <Link to="/patient">
        <div
          className={
            page === "PATIENTS"
              ? " flex flex-col items-center p-2 cursor-pointer bg-slate-700 rounded-xl hover:bg-slate-600 hover:rounded-lg"
              : "flex flex-col items-center p-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
          }
        >
          <img src={page === "PATIENTS" ? patient_selected : patient} width={60} alt="patient" />
          <p className="hidden lg:inline">Patient</p>
        </div>
      </Link>

      <Link to="/dashboard">
        <div
          className={
            page === "SETTINGS"
              ? " flex flex-col items-center px-5 py-2 cursor-pointer bg-slate-700 rounded-xl hover:bg-slate-600"
              : "flex flex-col items-center px-5 py-2 cursor-pointer hover:bg-slate-600 hover:rounded-lg"
          }
        >
          <img src={page === "SETTINGS" ? settings_selected : settings} width={60} alt="settings" />
          <p className="hidden lg:inline">Settings</p>
        </div>
      </Link>

    
      

      {/* New Logout Button */}
      <div
        onClick={() =>
          logout({
            returnTo: window.location.origin + "/login", // Redirect to login page after logout
          })
        }
        className="flex flex-col items-center p-2 cursor-pointer "
      >
        <p className="hidden lg:inline">Logout</p>
      </div>
    </div>
  );
};

export default Sidebar;
