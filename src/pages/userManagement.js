import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [createError, setCreateError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editedUsername, setEditedUsername] = useState(""); // New state for editing username
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // New state for confirm password
  const navigate = useNavigate();




  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/get`, {
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

 

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
  
  const handleCreateUser = async () => {
    setCreateError("");
  
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
        `${process.env.REACT_APP_BACKEND_URL}/api/users/add`,
        { username: newUser.username, password: newUser.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
  
      setNewUser({ username: "", password: "" });
      setIsModalOpen(false);
  
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
  };

  const handleEditSubmit = async () => {
    // Validate the new password if provided
    if (newPassword) {
      if (newPassword.length < 8 || newPassword.length > 16) {
        toast.error("Password must be between 8 and 16 characters long.");
        return;
      }

      const specialCharacterRegex = /[!@#$%^&*(),.?":{}|<>]/;
      if (!specialCharacterRegex.test(newPassword)) {
        toast.error("Password must contain at least one special character.");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
    }

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
        `${process.env.REACT_APP_BACKEND_URL}/api/users/edit`,
        { 
          currentUsername: editingUser.username, 
          newUsername: editedUsername, 
          newPassword: newPassword || null // Include password only if changed 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/users/get`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);

      setEditingUser(null);
      toast.success("User updated successfully!");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast.error("Expired or Invalid token. Please log in again.");
        handleLogout();
      } else {
        toast.error("Error updating user: " + error.message);
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      <ToastContainer />

      <button
        onClick={handleLogout}
        className="mb-4 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-500"
      >
        Logout
      </button>

      <button
        onClick={() => setIsModalOpen(true)}
        className="mb-6 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-500"
      >
        Create New User
      </button>

      {isModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
      <h2 className="text-xl font-bold mb-4">Add New User</h2>
      <div className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="Username"
          value={newUser.username}
          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          className="border p-2 rounded"
          minLength={3}  // Username must be at least 3 characters
          maxLength={30}  // Restrict username to 20 characters
        />
        <input
          type="password"
          placeholder="Password"
          value={newUser.password}
          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
          className="border p-2 rounded"
          maxLength={16}  // Restrict password to 16 characters
        />
        <button
          onClick={handleCreateUser}
          className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
        >
          Create User
        </button>
        {createError && <p className="text-red-600">{createError}</p>}
      </div>
      <button
        onClick={() => setIsModalOpen(false)}
        className="mt-4 py-2 px-4 bg-gray-400 text-white rounded-lg hover:bg-gray-300"
      >
        Cancel
      </button>
    </div>
  </div>
)}


      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b text-left">Username</th>
            <th className="py-2 px-4 border-b text-left">Role</th>
            <th className="py-2 px-4 border-b text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td className="py-2 px-4 border-b">{user.username}</td>
              <td className="py-2 px-4 border-b">{user.role}</td>
              <td className="py-2 px-4 border-b text-center">
                <button
                  onClick={() => handleEditUser(user)}
                  className="py-1 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                >
                  Edit User
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* User editing modal */}
      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Edit User</h2>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="New Username"
                value={editedUsername}
                onChange={(e) => setEditedUsername(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="password"
                placeholder="New Password (Optional)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border p-2 rounded"
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border p-2 rounded"
              />
              <div>
                <button
                  onClick={handleEditSubmit}
                  disabled={loading}
                  className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                >
                  {loading ? "Updating..." : "Update User"}
                </button>
                {loading && <div className="loader"></div>}
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="mt-2 py-2 px-4 bg-gray-400 text-white rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserManagement;
