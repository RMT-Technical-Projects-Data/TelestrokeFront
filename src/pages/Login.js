import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // For API requests
import LoginImage from "../assets/Login.jpg"; // Import the image

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    try {
      // Call the backend API for login
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        username,
        password,
      });

      // Extract token and role from the response
      const { token, role } = response.data;

      if (token) {
        // Store the token in localStorage
        localStorage.setItem("token", token);

        // Navigate based on the user's role
        if (role === "admin") {
          navigate("/userManagement");
        } else if (role === "user") {
          navigate("/dashboard");
        } else {
          alert("Invalid user role");
        }
      } else {
        alert("Invalid username or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Invalid username or password");
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left section with image */}
      <div className="flex-[6]">
        <img
          src={LoginImage}
          alt="Login"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right section with form */}
      <div className="flex-[4] flex flex-col justify-center items-center bg-gray-100 p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Welcome to Telestroke WebApp
        </h1>

        <form onSubmit={handleLogin} className="w-3/4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-4 p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
