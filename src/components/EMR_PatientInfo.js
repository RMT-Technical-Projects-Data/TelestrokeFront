import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EMR_PatientInfo() {
  const [patientEMR, setPatientEMR] = useState({
    Name: "",
    Doctor: "",
    PatientDOB: "",
    PatientSex: "Male",
    ExamDate: "",
    VisualActivityOD: "",
    VisualActivityOS: "",
    RelNeurologicalFinds: "",
    HasAphasia: "",
    AphasiaText: ""
  });

  useEffect(() => {
    const storedDoctor = localStorage.getItem("Doctor");
    setPatientEMR((prevState) => ({
      ...prevState,
     
      Doctor: storedDoctor || ""
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const today = new Date().toISOString().split("T")[0];

    if (type === "radio" && name === "HasAphasia") {
      setPatientEMR((prevState) => ({
        ...prevState,
        [name]: value === "true"
      }));
    } else if (name === "PatientDOB") {
      if (value > today) {
        toast.error("Date of birth must be today or earlier.");
        return;
      }
      setPatientEMR((prevState) => ({
        ...prevState,
        [name]: value
      }));
    } else if (name === "ExamDate") {
      if (value < today) {
        toast.error("Exam date must be today or later.");
        return;
      }
      setPatientEMR((prevState) => ({
        ...prevState,
        [name]: value
      }));
    } else {
      setPatientEMR((prevState) => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const savePatientInfo = () => {
    for (const key in patientEMR) {
      // Skip the 'AphasiaText' field from validation
      if (key !== "AphasiaText" && patientEMR[key] === "") {
        toast.error(`Please fill in all fields. Missing field: ${key}`);
        return;
      }
    }
    setPatientEMR(patientEMR);
    localStorage.setItem("patientEMR", JSON.stringify(patientEMR));
    toast.success("Patient information set.");
  };
  
  

  return (
    <div className="flex flex-wrap gap-4">
    {/* Name, Doctor, D.O.B, and Sex on a single line */}
    <div className="flex flex-row gap-4 items-center">
      <p className="font-bold text-lg">Patient</p> {/* Title on the left */}
      <div>
        <input
          className="border-t-0 border-x-0 border-b-2"
          type="text"
          name="Name"
          value={patientEMR.Name}
          onChange={handleChange}
          maxLength={30} // Limit to 20 characters
          placeholder="Name"
        />
        </div>
        <div className="flex flex-row gap-4 items-center">
           <p className="font-bold text-lg">Doctor</p> {/* Title on the left */}
        
        <div>
          <input
            className="border-t-0 border-x-0 border-b-2"
            type="text"
            name="Doctor"
            value={patientEMR.Doctor}
            onChange={handleChange}
            readOnly
            placeholder="Doctor"
          />
        </div>
        </div>
        <div className="flex flex-row gap-4 items-center">
           <p className="font-bold text-lg">DOB</p> {/* Title on the left */}
        <div>
          <input
            className="border-t-0 border-x-0 border-b-2"
            type="date"
            name="PatientDOB"
            value={patientEMR.PatientDOB}
            onChange={handleChange}
            placeholder="D.O.B"
          />
        </div>
        </div>
        <div className="flex flex-row gap-4 items-center">
           <p className="font-bold text-lg">Gender</p> {/* Title on the left */}
        <div>
          <select
            className="border-t-0 border-x-0 border-b-2"
            name="PatientSex"
            value={patientEMR.PatientSex}
            onChange={handleChange}
          >
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      </div>
      </div>

      {/* Exam Date, Visual Activity OD/OS on a single line */}
        <div className="flex flex-row gap-4 items-center">
        <p className="font-bold text-lg">Exam Date</p> {/* Title on the left */}
        <input
          className="border-t-0 border-x-0 border-b-2"
          type="date"
          name="ExamDate"
          value={patientEMR.ExamDate}
          onChange={handleChange}
          placeholder="Exam Date"
        />


<div className="flex flex-row gap-4 items-center">
  <p className="font-bold text-lg">Visual</p> {/* Title on the left */}
  <div className="flex flex-row gap-2">
    <div>
      <input
        className="border-t-0 border-x-0 border-b-2"
        type="text"
        name="VisualActivityOD"
        value={patientEMR.VisualActivityOD}
        onChange={handleChange}
        placeholder="OD"
        maxLength={30} // Limit text to 40 characters
      />
    </div>
    <div>
      <input
        className="border-t-0 border-x-0 border-b-2"
        type="text"
        name="VisualActivityOS"
        value={patientEMR.VisualActivityOS}
        onChange={handleChange}
        placeholder="OS"
        maxLength={30} // Limit text to 40 characters
      />
    </div>
  </div>
</div>
</div>


      {/* Relevant Neurological Findings and Aphasia on a single line */}
      <div className="flex flex-row gap-4">
        <div>
          <textarea
            className="h-20 w-60"
            name="RelNeurologicalFinds"
            value={patientEMR.RelNeurologicalFinds}
            onChange={handleChange}
            placeholder="Neurological Findings"
            maxLength={50} // Limit text to 40 characters
          />
        </div>
        <div className="flex flex-row gap-4">
          <div className="flex items-center">
           
          </div>
          <textarea
            className="h-20 w-60"
            name="AphasiaText"
            value={patientEMR.AphasiaText}
            onChange={handleChange}
            placeholder="Aphasia Text"
            maxLength={50} // Limit text to 40 characters
            
          />
          <div className="flex items-center mt-4"> {/* Added margin-top here */}
      <input
        className="inline m-2"
        type="radio"
        value="true"
        name="HasAphasia"
        checked={patientEMR.HasAphasia === true}
        onChange={handleChange}
      />
      <label>Yes</label>
      <input
        className="inline m-2"
        type="radio"
        value="false"
        name="HasAphasia"
        checked={patientEMR.HasAphasia === false}
        onChange={handleChange}
      />
      <label>No</label>
    </div>
        </div>
      </div>

      {/* Save button */}
      <button
  onClick={savePatientInfo}
  className="mt-2 bg-blue-500 text-white px-2 py-1 rounded w-24 h-14 text-sm ml-auto"
>
  Set
</button>


      {/* ToastContainer to display the toast notifications */}
      <ToastContainer />
    </div>
  );
}
