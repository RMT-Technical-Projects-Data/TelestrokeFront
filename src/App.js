import EMRpage from "./pages/EMR";
import PatientPage from "./pages/Patients";
import  Appointments  from "./pages/Appointmets";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
        
          <Route path="/" element={<Dashboard />}/>
          <Route path="/dashboard" element={<Dashboard />}/>
          <Route path="/emr/:patientid/:meetingid" element={<EMRpage/>} />
          <Route path="/emr/:patientid/" element={<EMRpage/>} />
          <Route path="/emr" element={<EMRpage/>} />
          <Route path="/patient" element={<PatientPage />} />
          <Route path="/appointment" element={<Appointments />} />
          <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
