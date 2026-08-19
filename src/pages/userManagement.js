import React, { useEffect, useState } from "react";
import axios from "axios";
import { getApiBaseUrl } from "../api/client";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AppShell from "../components/AppShell";
import { LayoutList, LayoutGrid, Eye, EyeOff, Pencil, Plus, X, User, Lock } from "lucide-react";


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

        const response = await axios.get(`${getApiBaseUrl()}/api/users/get`, {
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
        `${getApiBaseUrl()}/api/users/add`,
        { username: newUser.username, password: newUser.password },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      const response = await axios.get(`${getApiBaseUrl()}/api/users/get`, {
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
        `${getApiBaseUrl()}/api/users/edit`,
        { 
          currentUsername: editingUser.username, 
          newUsername: editedUsername, 
          newPassword: newPassword || null // Include password only if changed 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const response = await axios.get(`${getApiBaseUrl()}/api/users/get`, {
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
  

  if (loading && users.length === 0) {
    return (
      <AppShell variant="admin" page="USERS" title="User Management" subtitle="Clinician accounts with workspace access.">
        <div className="ts-loading"><span className="ts-spinner" /> Loading users...</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell variant="admin" page="USERS" title="User Management" subtitle="Clinician accounts with workspace access.">
        <div className="ts-alert ts-alert-err">{error}</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      variant="admin"
      page="USERS"
      title="User Management"
      subtitle="Clinician accounts with workspace access."
      actions={
        <>
          <button
            type="button"
            className="ts-btn-icon"
            onClick={() => setViewMode(viewMode === "list" ? "cards" : "list")}
            aria-label="Toggle view"
          >
            {viewMode === "list" ? <LayoutGrid size={16} /> : <LayoutList size={16} />}
          </button>
          <button type="button" className="ts-btn ts-btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} /> Create user
          </button>
        </>
      }
    >
      {viewMode === "list" ? (
        <div className="ts-panel">
          <div className="ts-panel-head">
            <h3 className="ts-panel-title">Clinician accounts</h3>
            <span className="ts-panel-meta">{users.length} shown</span>
          </div>
          <div className="ts-table-wrap">
            <table className="ts-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th className="ts-col-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="ts-user-cell">
                        <div className="ts-avatar">{(user.username || "?").charAt(0).toUpperCase()}</div>
                        <div><strong>{user.username}</strong></div>
                      </div>
                    </td>
                    <td>
                      <span className="ts-badge ts-badge-accent">{user.role}</span>
                    </td>
                    <td className="ts-col-center">
                      <button type="button" className="ts-btn-icon" title="Edit user" onClick={() => handleEditUser(user)}>
                        <Pencil size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="ts-metrics" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {users.map((user) => (
            <div key={user._id} className="ts-panel" style={{ padding: "1.1rem" }}>
              <div className="ts-user-cell" style={{ marginBottom: "0.85rem" }}>
                <div className="ts-avatar" style={{ width: 44, height: 44 }}>
                  {(user.username || "?").charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{user.username}</strong>
                  <span className="ts-badge ts-badge-accent">{user.role}</span>
                </div>
              </div>
              <button type="button" className="ts-btn ts-btn-ghost w-full" onClick={() => handleEditUser(user)}>
                <Pencil size={14} /> Edit user
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="ts-modal-backdrop">
          <div className="ts-modal">
            <div className="ts-modal-head">
              <h2>Add new user</h2>
              <button
                type="button"
                className="ts-btn-icon"
                onClick={() => {
                  setIsModalOpen(false);
                  setNewUser({ username: "", password: "", confirmPassword: "" });
                  setCreateError("");
                  setShowNewPassword(false);
                  setShowNewConfirmPassword(false);
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ts-modal-body">
              {createError && <div className="ts-alert ts-alert-err">{createError}</div>}
              <div className="ts-field">
                <label>Username</label>
                <div className="ts-field-input-wrap">
                  <User size={16} className="ts-field-icon" />
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="ts-input"
                    placeholder="johndoe"
                    minLength={3}
                    maxLength={30}
                  />
                </div>
              </div>
              <div className="ts-field">
                <label>Password</label>
                <div className="ts-field-input-wrap">
                  <Lock size={16} className="ts-field-icon" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="ts-input"
                    placeholder="••••••••"
                    maxLength={16}
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button type="button" className="ts-field-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="ts-field">
                <label>Confirm password</label>
                <div className="ts-field-input-wrap">
                  <Lock size={16} className="ts-field-icon" />
                  <input
                    type={showNewConfirmPassword ? "text" : "password"}
                    value={newUser.confirmPassword}
                    onChange={(e) => {
                      setNewUser({ ...newUser, confirmPassword: e.target.value });
                      if (createError) setCreateError("");
                    }}
                    className="ts-input"
                    placeholder="••••••••"
                    maxLength={16}
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button type="button" className="ts-field-toggle" onClick={() => setShowNewConfirmPassword(!showNewConfirmPassword)}>
                    {showNewConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="button" onClick={handleCreateUser} className="ts-btn ts-btn-primary w-full" style={{ padding: "0.7rem" }}>
                Create user
              </button>
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="ts-modal-backdrop">
          <div className="ts-modal">
            <div className="ts-modal-head">
              <h2>Edit user</h2>
              <button
                type="button"
                className="ts-btn-icon"
                onClick={() => {
                  setEditingUser(null);
                  setNewPassword("");
                  setConfirmPassword("");
                  setEditError("");
                  setShowEditPassword(false);
                  setShowEditConfirmPassword(false);
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="ts-modal-body">
              {editError && <div className="ts-alert ts-alert-err">{editError}</div>}
              <div className="ts-field">
                <label>Username</label>
                <div className="ts-field-input-wrap">
                  <User size={16} className="ts-field-icon" />
                  <input
                    type="text"
                    value={editedUsername}
                    onChange={(e) => {
                      setEditedUsername(e.target.value);
                      if (editError) setEditError("");
                    }}
                    className="ts-input"
                  />
                </div>
              </div>
              <div className="ts-field">
                <label>New password <span style={{ fontWeight: 500, opacity: 0.7 }}>(optional)</span></label>
                <div className="ts-field-input-wrap">
                  <Lock size={16} className="ts-field-icon" />
                  <input
                    type={showEditPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (editError) setEditError("");
                    }}
                    className="ts-input"
                    placeholder="••••••••"
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button type="button" className="ts-field-toggle" onClick={() => setShowEditPassword(!showEditPassword)}>
                    {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="ts-field">
                <label>Confirm password</label>
                <div className="ts-field-input-wrap">
                  <Lock size={16} className="ts-field-icon" />
                  <input
                    type={showEditConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (editError) setEditError("");
                    }}
                    className="ts-input"
                    placeholder="••••••••"
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button type="button" className="ts-field-toggle" onClick={() => setShowEditConfirmPassword(!showEditConfirmPassword)}>
                    {showEditConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="button" onClick={handleEditSubmit} disabled={loading} className="ts-btn ts-btn-primary w-full" style={{ padding: "0.7rem" }}>
                {loading ? "Updating..." : "Update user"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
};
export default UserManagement;
