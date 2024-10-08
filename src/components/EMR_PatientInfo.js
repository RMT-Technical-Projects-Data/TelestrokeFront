import React from "react";
import { useState } from "react";

export default function EMR_PatientInfo() {
  const [patientEMR, setPatientEMR] = useState({
    PatientDOB: "",
    PatientSex: "Male",
    ExamDate: "",
    VisualActivityOD: "",
    VisualActivityOS: "",
    RelNeurologicalFinds: "",
    HasAphasia: true, // Initialize as a boolean
    AphasiaText: "",
  });

  const handleChange = (e) => {
    debugger;
    const { name, value, type, checked } = e.target;
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    // Handle radio buttons differently for boolean values
    if (type === "radio" && name === "HasAphasia") {
      // Convert the string value to boolean
      setPatientEMR((prevState) => ({
        ...prevState,
        [name]: value === "true", // Convert "true" and "false" to boolean
      }));
    }else if (name === "PatientDOB") {
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row gap-20 ">
        <div>
          <p className="font-bold text-lg my-3 ">Patient D.O.B</p>
          <input
            className="border-t-0 border-x-0 border-b-2"
            type="date"
            name="PatientDOB" ///new fields for the data
            value={patientEMR.PatientDOB}
            onChange={handleChange}
          />
        </div>
        <div>
          <p
            className="font-bold text-lg my-3"
            name="PatientSex"
            value={patientEMR.PatientSex}
            onChange={handleChange}
          >
            Patient Sex
          </p>
          <select className="border-t-0 border-x-0 border-b-2">
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
          <p className="font-bold text-lg">Relevent Neurological Findings</p>
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
            value="true" // Set value as string "true"
            name="HasAphasia"
            checked={patientEMR.HasAphasia === true} // Compare with boolean true
            onChange={handleChange}
          />
          <label>Yes</label>
          <input
            className="inline m-2"
            type="radio"
            value="false" // Set value as string "false"
            name="HasAphasia"
            checked={patientEMR.HasAphasia === false} // Compare with boolean false
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
    </div>
  );
}
