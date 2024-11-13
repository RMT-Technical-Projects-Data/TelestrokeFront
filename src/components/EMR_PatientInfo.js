import React, { useState } from "react";

let savedPatientInfo = {}; // Variable to store saved data, accessible from other components

export function getSavedPatientInfo() {
  // Function to retrieve the saved data from the main page
  return savedPatientInfo;
}

export default function EMR_PatientInfo() {
  const [patientEMR, setPatientEMR] = useState({
    PatientDOB: "",
    PatientSex: "",
    ExamDate: "",
    VisualActivityOD: "",
    VisualActivityOS: "",
    RelNeurologicalFinds: "",
    HasAphasia: true,
    AphasiaText: "",
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const today = new Date().toISOString().split('T')[0];

    if (type === "radio" && name === "HasAphasia") {
      setPatientEMR((prevState) => ({
        ...prevState,
        [name]: value === "true",
      }));
    } else if (name === "PatientDOB") {
      if (value > today) {
        alert("Date of birth must be today or earlier.");
        return;
      }
      setPatientEMR((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    } else if (name === "ExamDate") {
      if (value < today) {
        alert("Exam date must be today or later.");
        return;
      }
      setPatientEMR((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    } else {
      setPatientEMR((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const savePatientInfo = () => {
    savedPatientInfo = { ...patientEMR };
    alert("Patient information set.");
    console.log("Patient Info:", savedPatientInfo); // For debugging, you can see saved data in the console.
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-20">
        <div>
          <p className="font-bold text-lg my-3">Patient D.O.B</p>
          <input
            className="border-t-0 border-x-0 border-b-2"
            type="date"
            name="PatientDOB"
            value={patientEMR.PatientDOB}
            onChange={handleChange}
          />
        </div>
        <div>
          <p className="font-bold text-lg my-3">Patient Sex</p>
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
        <div>
          <p className="font-bold text-lg my-3">Exam Date</p>
          <input
            className="border-t-0 border-x-0 border-b-2"
            type="date"
            name="ExamDate"
            value={patientEMR.ExamDate}
            onChange={handleChange}
          />
        </div>
        <div>
          <p className="font-bold text-lg my-3 text-center">Visual Activity</p>
          <label className="font-bold text-lg m-4">OD</label>
          <input
            className="border-t-0 border-x-0 border-b-2"
            type="text"
            name="VisualActivityOD"
            value={patientEMR.VisualActivityOD}
            onChange={handleChange}
          />
          <label className="font-bold text-lg m-4">OS</label>
          <input
            className="border-t-0 border-x-0 border-b-2"
            type="text"
            name="VisualActivityOS"
            value={patientEMR.VisualActivityOS}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="flex flex-row gap-20 mt-10">
        <div>
          <p className="font-bold text-lg">Relevant Neurological Findings</p>
          <textarea
            className="h-20 w-60"
            name="RelNeurologicalFinds"
            value={patientEMR.RelNeurologicalFinds}
            onChange={handleChange}
          />
        </div>
        <div>
          <p className="font-bold text-lg inline mr-8">Has Aphasia</p>
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
          <textarea
            className="h-20 block w-60"
            name="AphasiaText"
            value={patientEMR.AphasiaText}
            onChange={handleChange}
          />
        </div>
      </div>
      <button
        onClick={savePatientInfo}
        className="mt-4 bg-blue-500 text-white px-2 py-1 rounded w-24 text-sm"
      >
        Set
      </button>
    </div>
  );
}
