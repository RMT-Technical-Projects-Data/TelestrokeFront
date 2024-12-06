import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // For API requests
import LoginImage from "../assets/Login.jpg"; // Import the image
import { toast, ToastContainer } from "react-toastify"; // Import toast and ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for react-toastify

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
        localStorage.setItem("Doctor", username); // Save the entered username

        // Navigate based on the user's role
        if (role === "admin") {
          navigate("/userManagement");
          toast.success("Login successful! Redirecting to User Management."); // Success toast
        } else if (role === "user") {
          navigate("/dashboard");
          toast.success("Login successful! Redirecting to Dashboard."); // Success toast
        } else {
          toast.error("Invalid user role. Please contact support."); // Error toast for invalid role
        }
      } else {
        toast.error("Invalid username or password. Please try again."); // Error toast for invalid login
      }
    } catch (error) {
      console.error("Login error:", error);

      // Check if the error is due to invalid credentials or network issue
      if (error.response && error.response.status === 401) {
        // Unauthorized (invalid credentials)
        toast.error("Invalid username or password. Please try again.");
      } else {
        // General error (server or network issue)
        toast.error("An error occurred while logging in. Please try again later.");
      }
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

      {/* Toast container to display toast notifications */}
      <ToastContainer />
    </div>
  );
};

export default Login;
