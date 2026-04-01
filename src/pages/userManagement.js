import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import NavBar from "../components/NavBar";
import { FaList, FaThLarge, FaEye, FaEyeSlash } from "react-icons/fa";
// import { FaUserMd } from "react-icons/fa";
import doctorImage from "../assets/doctor.png";


const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "", confirmPassword: "" });
  const [createError, setCreateError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editedUsername, setEditedUsername] = useState(""); // New state for editing username
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // New state for confirm password
  const [editError, setEditError] = useState(""); // State for edit modal errors
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("list"); // New state for toggling view

  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewConfirmPassword, setShowNewConfirmPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditConfirmPassword, setShowEditConfirmPassword] = useState(false);


  

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/api/users/get`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsers(response.data);
      } catch (error) {
        setError("Error fetching users: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);
   
  const handleToggleView = (mode) => {
    setViewMode(mode);
  };
 

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  
  const handleCreateUser = async () => {
    setCreateError("");
  
    // Check for empty fields
    const missingFields = [];
    if (!newUser.username.trim()) missingFields.push("Username");
    if (!newUser.password) missingFields.push("Password");
    if (!newUser.confirmPassword) missingFields.push("Confirm password");

    if (missingFields.length > 0) {
      const message = missingFields.join(", ") + (missingFields.length > 1 ? " are required." : " is required.");
      setCreateError(message);
      return;
    }

    // Check if the password length is between 8 and 16 characters
    if (newUser.password.length < 8 || newUser.password.length > 16) {
      setCreateError("Password must be between 8 and 16 characters long.");
      return;
    }
  
    // Check if the password contains at least one special character
    const specialCharacterRegex = /[!@#$%^&*(),.?":{}|<>]/;
    if (!specialCharacterRegex.test(newUser.password)) {
      setCreateError("Password must contain at least one special character.");
      return;
    }
  
    // Check if passwords match
    if (newUser.password !== newUser.confirmPassword) {
      setCreateError("Passwords do not match.");
      return;
    }

    // Check if the username is at least 3 characters long, less than or equal to 20 characters, 
    // and contains only alphabets and spaces
    const nameRegex = /^[A-Za-z\s]+$/;  // Allow alphabets and spaces
    if (newUser.username.length < 3 || newUser.username.length > 20 || !nameRegex.test(newUser.username)) {
      setCreateError("Username must be between 3 and 20 characters and contain only alphabets and spaces.");
      return;
    }
  
    // Check if the username already exists
    const usernameExists = users.some((user) => user.username === newUser.username);
    if (usernameExists) {
      setCreateError("Username already exists. Please choose a different one.");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/users/add`,
        { username: newUser.username, password: newUser.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/users/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
  
      setNewUser({ username: "", password: "", confirmPassword: "" });
      setIsModalOpen(false);
      setShowNewPassword(false);
      setShowNewConfirmPassword(false);
  
      toast.success("User successfully created!");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setCreateError("Expired or Invalid token. Please log in again.");
        handleLogout(); // Log out the user
      } else {
        setCreateError("Error creating user: " + error.message);
      }
    }
  };
  


  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditedUsername(user.username); // Set current username for editing
    setNewPassword(""); // Reset password field
    setConfirmPassword(""); // Reset confirm password field
    setEditError(""); // Reset error message
    setShowEditPassword(false);
    setShowEditConfirmPassword(false);
  };

  const handleEditSubmit = async () => {
    // Check for missing fields
    const missingFields = [];
    if (!editedUsername.trim()) missingFields.push("Username");
    
    // Validate the new password if either password field is provided
    if (newPassword || confirmPassword) {
      if (!newPassword) missingFields.push("New password");
      if (!confirmPassword) missingFields.push("Confirm password");
    }

    if (missingFields.length > 0) {
      const message = missingFields.join(", ") + (missingFields.length > 1 ? " are required." : " is required.");
      setEditError(message);
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setEditError("Passwords do not match.");
        return;
      }

      if (newPassword.length < 8 || newPassword.length > 16) {
        setEditError("Password must be between 8 and 16 characters long.");
        return;
      }

      const specialCharacterRegex = /[!@#$%^&*(),.?":{}|<>]/;
      if (!specialCharacterRegex.test(newPassword)) {
        setEditError("Password must contain at least one special character.");
        return;
      }
    }

    setEditError(""); // Clear errors before proceeding

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token provided. Please log in again.");
        handleLogout();
        return;
      }

      // Disable button while updating
      setLoading(true);

      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/users/edit`,
        { 
          currentUsername: editingUser.username, 
          newUsername: editedUsername, 
          newPassword: newPassword || null // Include password only if changed 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL || "http://localhost:5000"}/users/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
      setEditingUser(null);
      setEditError("");
      toast.success("User updated successfully!");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        setEditError("Expired or Invalid token. Please log in again.");
        handleLogout();
      } else {
        const msg = error.response?.data?.message || error.message;
        setEditError("Error updating user: " + msg);
      }
    } finally {
      // Re-enable button
      setLoading(false);
    }
  };
  

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <p>Loading users...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">User Management</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <>
    <NavBar disableDashboardLink={true} />
    <div className="p-8">
    <div className="flex items-center justify-between mb-6 mt-20">
      <h1 className="text-2xl font-bold">User Management</h1>
      <div className="flex gap-4">
        <button
          onClick={handleLogout}
          className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-500"
        >
          Logout
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-500"
        >
          Create New User
        </button>
      </div>
    </div>


     {/* View Mode Toggle Icon */}
     <div className="flex justify-end mb-4">
        <button
          onClick={() => setViewMode(viewMode === "list" ? "cards" : "list")}
          className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
          aria-label="Toggle View"
        >
          {viewMode === "list" ? (
            <FaThLarge className="text-xl text-gray-700" />
          ) : (
            <FaList className="text-xl text-gray-700" />
          )}
        </button>
      </div>

      {/* Conditional Rendering for List or Card View */}
      {viewMode === "list" ? (
       <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
       <thead>
         <tr className="bg-gray-200 text-gray-700">
           <th className="py-3 px-6 border-b border-gray-300 text-left font-semibold">Username</th>
           <th className="py-3 px-6 border-b border-gray-300 text-left font-semibold">Role</th>
           <th className="py-3 px-6 border-b border-gray-300 text-center font-semibold">Actions</th>
         </tr>
       </thead>
       <tbody>
         {users.map((user, index) => (
           <tr
             key={user._id}
             className={`${
               index % 2 === 0 ? "bg-gray-50" : "bg-white"
             } hover:bg-blue-50 transition duration-200`}
           >
             <td className="py-3 px-6 border-b border-gray-300">{user.username}</td>
             <td className="py-3 px-6 border-b border-gray-300">{user.role}</td>
             <td className="py-3 px-6 border-b border-gray-300 text-center">
               <button
                 onClick={() => handleEditUser(user)}
                 className="py-2 px-4 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-500 transition"
               >
                 Edit User
               </button>
             </td>
           </tr>
         ))}
       </tbody>
     </table>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div
            key={user._id}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transform hover:-translate-y-1 hover:scale-105 transition-all duration-300"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{user.username}</h3>
                <p className="text-gray-600 mt-2">
                  Role: <span className="font-medium text-gray-700">{user.role}</span>
                </p>
                <button
                  onClick={() => handleEditUser(user)}
                  className="mt-4 py-2 px-5 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-500 hover:shadow-md transition-all duration-300"
                >
                  Edit User
                </button>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src={doctorImage}
                  alt="Doctor"
                  className="w-40 h-25 object-cover rounded-full" // Styling for the image
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      )}


 {isModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
              <h2 className="text-xl font-bold mb-4">Add New User</h2>
              {createError && <p className="text-red-500 text-sm mt-2 text-center">{createError}</p>}
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  className="border p-2 rounded w-full"
                  minLength={3}
                  maxLength={30}
                />
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    className="border p-2 rounded w-full pr-10"
                    maxLength={16}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-500 hover:text-gray-700 bg-transparent border-none outline-none shadow-none p-0 focus:outline-none"
                  >
                    {showNewPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={newUser.confirmPassword}
                    onChange={(e) => {
                      setNewUser({ ...newUser, confirmPassword: e.target.value });
                      if (createError) setCreateError("");
                    }}
                    className="border p-2 rounded w-full pr-10 border-gray-300 focus:outline-none focus:border-blue-500"
                    maxLength={16}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewConfirmPassword(!showNewConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-500 hover:text-gray-700 bg-transparent border-none outline-none shadow-none p-0 focus:outline-none"
                  >
                    {showNewConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                  </button>
                </div>
                <button
                  onClick={handleCreateUser}
                  className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-500 mt-2"
                >
                  Create User
                </button>
                
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setNewUser({ username: "", password: "", confirmPassword: "" });
                  setCreateError("");
                  setShowNewPassword(false);
                  setShowNewConfirmPassword(false);
                }}
                className="mt-4 py-2 px-4 bg-gray-400 text-white rounded-lg hover:bg-gray-300 w-full"
              >
                Cancel
              </button>
            </div>
          </div>
        )}


      

      {/* User editing modal */}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            {editError && <p className="text-red-500 text-sm mt-2 text-center">{editError}</p>}
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="New Username"
                value={editedUsername}
                onChange={(e) => {
                  setEditedUsername(e.target.value);
                  if (editError) setEditError("");
                }}
                className="border p-2 rounded w-full border-gray-300 focus:outline-none focus:border-blue-500" />
              <div className="relative flex items-center">
                <input
                  type={showEditPassword ? "text" : "password"}
                  placeholder="New Password (Optional)"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (editError) setEditError("");
                  }}
                  className="border p-2 rounded w-full pr-10 border-gray-300 focus:outline-none focus:border-blue-500" />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 flex items-center text-gray-500 hover:text-gray-700 bg-transparent border-none outline-none shadow-none p-0 focus:outline-none"
                >
                  {showEditPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type={showEditConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (editError) setEditError("");
                  }}
                  className="border p-2 rounded w-full pr-10 border-gray-300 focus:outline-none focus:border-blue-500" />
                <button
                  type="button"
                  onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}
                  className="absolute right-3 flex items-center text-gray-500 hover:text-gray-700 bg-transparent border-none outline-none shadow-none p-0 focus:outline-none"
                >
                  {showEditConfirmPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
                </button>
              </div>
              <div>
                <button
                  onClick={handleEditSubmit}
                  disabled={loading}
                  className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-500 w-full font-medium transition duration-200"
                >
                  {loading ? "Updating..." : "Update User"}
                </button>
                {loading && <div className="loader mt-2"></div>}
                
              </div>
              <button
                onClick={() => {
                  setEditingUser(null);
                  setNewPassword("");
                  setConfirmPassword("");
                  setEditError("");
                  setShowEditPassword(false);
                  setShowEditConfirmPassword(false);
                }}
                className="mt-2 py-2 px-4 bg-gray-400 text-white rounded-lg hover:bg-gray-300 w-full transition duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div></>
  );
};
export default UserManagement;
