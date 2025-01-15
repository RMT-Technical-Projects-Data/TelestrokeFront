import { Routes, Route} from "react-router-dom";
import useAuth from './components/useAuth'; // Import useAuth
import EMRpage from "./pages/EMR";
import EMRReportpage from "./pages/EMR_Report";
import MeetingPage from "./pages/MeetingPage";
import Appointments from "./pages/Appointmets";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/userManagement";
import "./App.css";

function App() {
  // Apply the useAuth function here to ensure authentication check happens globally
  useAuth();

  return (
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
    </Routes>
  );
}

export default App;
