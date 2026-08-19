import React, { Component } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import useAuth from './components/useAuth'; // Import useAuth
import EMRpage from "./pages/EMR";
import EMRReportpage from "./pages/EMR_Report";
import MeetingPage from "./pages/MeetingPage";
import Appointments from "./pages/Appointmets";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/userManagement";
import Settings from "./pages/Settings";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Application Error</h2>
            <p className="text-gray-600 mb-6">An unexpected error occurred. Click below to refresh.</p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/dashboard";
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  // Apply the useAuth function here to ensure authentication check happens globally
  useAuth();

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/emr/:patientid/:meetingid" element={<EMRpage />} />
        <Route path="/emr/:patientid/" element={<EMRpage />} />
        <Route path="/emr" element={<EMRReportpage />} />
        <Route path="/meeting" element={<MeetingPage />} />
        <Route path="/appointment" element={<Appointments />} />
        <Route path="/login" element={<Login />} />
        <Route path="/userManagement" element={<UserManagement />} />
        <Route path="/settings" element={<Settings />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </ErrorBoundary>
  );
}

export default App;
