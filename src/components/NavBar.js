import React from "react";
import logo from "../assets/Logo.svg";
import notification from "../assets/notification.svg";
import profile from "../assets/profile.svg";

const NavBar = () => {
  return (
    <div className="bg-[#E9F5FE]  w-screen h-[5%] p-2 px-7 flex flex-row justify-between ">
      <div className="flex items-center">
        <img src={logo} width={25} alt="logo" className="inline" />
        <p className="inline ml-9 text-2xl font-bold ">Telestroke </p>
      </div>
      <input
        onChange={() => {}}
        type="text"
        className="shadow-sm rounded-lg w-[20%] p-1 pl-4"
        placeholder=" Search"
      />
      <div className="flex items-center gap-5">
        <img src={notification} width={20} alt="notification" />
        <img src={profile} width={25} alt="profile" />
        <p> Dr. Anonymous </p>
      </div>
    </div>
  );
};

export default NavBar;
