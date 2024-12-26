import React from "react";
// import { FaPlay, FaPause } from "react-icons/fa"; // Import icons from react-icons

const Button = (props) => {
  console.log('Button prop <---------------->',props.className);
  return (
    <button
      className={props.className + " rounded bg-[#3b4fdf] hover:bg-[#2f44c4] p-2 text-white"}
      onClick={(event) => {
        props.onClick(event);
      }}
    >
      {props.children}
    </button>
  );
};

export default Button;