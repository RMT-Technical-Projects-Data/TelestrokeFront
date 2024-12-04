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

        const response = await axios.get("http://localhost:5000/api/users/get", {
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
  
    // Check if the password is at least 6 characters long
    if (newUser.password.length < 6) {
      setCreateError("Password must be at least 6 characters long.");
      return;
    }
  
    const usernameExists = users.some((user) => user.username === newUser.username);
    if (usernameExists) {
      setCreateError("Username already exists. Please choose a different one.");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000/api/users/add",
        { username: newUser.username, password: newUser.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const response = await axios.get("http://localhost:5000/api/users/get", {
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
  


  const handlePasswordEdit = (user) => {
    setEditingUser(user);
    setNewPassword(""); // Reset password field
    setConfirmPassword(""); // Reset confirm password field
  };

  const handlePasswordChange = async () => {
    // Check if the new password is at least 6 characters long
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
  
    if (!newPassword || !confirmPassword) {
      toast.error("Both password fields are required.");
      return;
    }
  
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No token provided. Please log in again.");
        handleLogout();
        return;
      }
  
      await axios.put(
        `http://localhost:5000/api/users/edit`,
        { username: editingUser.username, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const response = await axios.get("http://localhost:5000/api/users/get", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
  
      setEditingUser(null);
      toast.success("Password updated successfully!");
    } catch (error) {
      if (error.response && error.response.status === 401) {
        toast.error("Expired or Invalid token. Please log in again.");
        handleLogout();
      } else {
        toast.error("Error updating password: " + error.message);
      }
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
              />
              <input
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="border p-2 rounded"
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
                  onClick={() => handlePasswordEdit(user)}
                  className="py-1 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
                >
                  Edit Password
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Edit Password</h2>
            <div className="flex flex-col gap-2">
              <input
                type="password"
                placeholder="New Password"
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
              <button
                onClick={handlePasswordChange}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
              >
                Update Password
              </button>
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
