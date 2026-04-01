import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // For API requests
import telestroke from "../assets/eyeimage.png";
import { toast } from "react-toastify"; // Import toast
import "react-toastify/dist/ReactToastify.css"; // Import the CSS for react-toastify
import logo from "../assets/Telestroke-logo.png";
// import background from "../assets/bg-blur.jpg"

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent default form submission behavior

    // Clear previous validation errors
    setUsernameError("");
    setPasswordError("");

    let isValid = true;
    if (!username.trim()) {
      setUsernameError("Username is required");
      isValid = false;
    }
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    }
    
    if (!isValid) return;

    if (isLoading) return; // Prevent duplicate submissions
    setIsLoading(true);

    console.log(process.env.REACT_APP_BACKEND_URL);

    try {
      // Call the backend API for login
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/auth/login`, {
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
        if (error.response.status >= 400 && error.response.status < 500) {
          // Handle client errors (bad request, unauthorized, not found)
          const errorMessage = error.response.data?.message || error.response.data?.error || "Invalid username or password. Please try again.";
          toast.error(errorMessage);
        } else {
          // Other server-side errors
          toast.error("An error occurred while logging in. Please try again later.");
        }
      } else {
        // Network error or no response from the server
        toast.error("Unable to connect to the server. Please check your network connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  

  return (
    <div
  className="relative w-screen h-screen bg-cover bg-center"
   
   style={{ backgroundImage: `url(${require('../assets/bg-blur.jpg')})` }} // Replace with your desired background image URL
> 
    {/* Main container */}
    <div className="flex items-center justify-center h-screen">
      {/* Card */}
      <div className="flex flex-col lg:flex-row bg-white rounded-2xl shadow-xl overflow-hidden max-w-4xl w-full p-0">
        {/* Left Section: Logo/Illustration */}
        <div className="flex-1 bg-gradient-to-br from-blue-400 to-blue-100 flex flex-col justify-center items-center p-12">
          <img
            src={logo}
            alt="Illustration"
            className="w-3/4 mb-6"
          />
          <h2 className="text-3xl font-semibold text-white text-center mb-4">
            Remote Eyestroke Web App
          </h2>
          <div className="text-center mb-4 h-20">
            {/* <img
              src={telestroke}
              alt="icon"
              className="w-20 h-20 mx-auto"
            /> */}
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
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (usernameError) setUsernameError("");
                }}
                className={`w-full p-4 border ${usernameError ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 outline-none`}
              />
              {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-gray-600 mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError("");
                }}
                className={`w-full p-4 border ${passwordError ? 'border-red-500' : 'border-gray-300'} rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 outline-none`}
              />
              {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold rounded-lg transition-all shadow-md`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
  
        
        </div>
      </div>
    </div>
  </div>
  );
};

export default Login;
