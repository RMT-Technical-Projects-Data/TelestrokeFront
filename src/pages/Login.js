import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // For API requests
import telestroke from "../assets/eyeimage.png";
import { toast, ToastContainer } from "react-toastify"; // Import toast and ToastContainer
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for react-toastify
import logo from "../assets/Telestroke-logo.png";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior
  
    console.log(process.env.REACT_APP_BACKEND_URL);
  
    try {
      // Call the backend API for login
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/login`, {
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
      if (error.response) {
        if (error.response.status === 400) {
          // Handle invalid credentials (bad request)
          toast.error(error.response.data.message || "Invalid username or password. Please try again.");
        } else if (error.response.status === 401) {
          // Unauthorized (invalid credentials)
          toast.error("Invalid username or password. Please try again.");
        } else {
          // Other server-side errors
          toast.error("An error occurred while logging in. Please try again later.");
        }
      } else {
        // Network error or no response from the server
        toast.error("Unable to connect to the server. Please check your network connection.");
      }
    }
  };
  

  return (
    <div
  className="relative w-screen h-screen bg-cover bg-center"
  style={{ backgroundImage: `url(${require('../assets/bg.jpg')})` }} // Replace with your desired background image URL
>
    {/* Main container */}
    <div className="flex items-center justify-center h-screen">
      {/* Card */}
      <div className="flex flex-col lg:flex-row bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full p-10">
        {/* Left Section: Logo/Illustration */}
        <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-100 flex flex-col justify-center items-center p-12">
          <img
            src={logo}
            alt="Illustration"
            className="w-3/4 mb-6"
          />
          <h2 className="text-3xl font-semibold text-white text-center mb-4">
            Remote Eyestroke Test App
          </h2>
          <div className="text-center mb-4">
            <img
              src={telestroke}
              alt="icon"
              className="w-20 h-20 mx-auto"
            />
          </div>
        </div>
  
        {/* Right Section: Login Form */}
        <div className="flex-1 p-8 flex flex-col justify-center bg-gray-50 rounded-xl shadow-md">
          <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
            Welcome
          </h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-gray-600 mb-2 font-medium">
                Username or Email
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-600 mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md"
            >
              Login
            </button>
          </form>
  
        
        </div>
      </div>
    </div>
  
    {/* Toast container */}
    <ToastContainer />
  </div>
  
  
  );
};

export default Login;
