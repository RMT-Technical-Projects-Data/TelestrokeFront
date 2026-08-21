import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EMR_PatientInfo() {
  const [patientEMR, setPatientEMR] = useState(() => {
    const saved = localStorage.getItem("patientEMR");
    if (saved) return JSON.parse(saved);
    const doctor = localStorage.getItem("Doctor") || "";
    return {
      Name: "",
      Doctor: doctor,
      PatientDOB: "",
      PatientSex: "Male",
      ExamDate: "",
      VisualActivityOD: "",
      VisualActivityOS: "",
      RelNeurologicalFinds: "",
      HasAphasia: "",
      AphasiaText: ""
    };
  });

  // Auto-save to localStorage whenever patientEMR changes
  useEffect(() => {
    localStorage.setItem("patientEMR", JSON.stringify(patientEMR));
  }, [patientEMR]);

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
      setPatientEMR((prevState) => {
        const newState = { ...prevState, [name]: value };
        if (newState.ExamDate) {
          validateAge(value, newState.ExamDate);
        }
        return newState;
      });
    } else if (name === "ExamDate") {
      if (value < today) {
        toast.error("Exam date must be today or later.");
        return;
      }
      setPatientEMR((prevState) => {
        const newState = { ...prevState, [name]: value };
        if (newState.PatientDOB) {
          validateAge(newState.PatientDOB, value);
        }
        return newState;
      });
    } else {
      setPatientEMR((prevState) => ({
        ...prevState,
        [name]: value
      }));
    }
  };

  const validateAge = (dobString, examString) => {
    const dob = new Date(dobString);
    const exam = new Date(examString);
    let ageAtExam = exam.getFullYear() - dob.getFullYear();
    const monthDiff = exam.getMonth() - dob.getMonth();
    const dayDiff = exam.getDate() - dob.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      ageAtExam--;
    }

    if (ageAtExam < 5) {
      toast.error("Patient must be at least 5 years old on the exam date.");
      return false;
    }
    return true;
  };

  return (
    <div className="ts-exam-patient">
      <div className="ts-exam-patient-row">
        <div className="ts-exam-inline-field">
          <label htmlFor="patient-name">Patient</label>
          <input
            id="patient-name"
            className="ts-input"
            type="text"
            name="Name"
            value={patientEMR.Name}
            onChange={handleChange}
            maxLength={30}
            placeholder="Name"
          />
        </div>
        <div className="ts-exam-inline-field">
          <label htmlFor="patient-doctor">Doctor</label>
          <input
            id="patient-doctor"
            className="ts-input"
            type="text"
            name="Doctor"
            value={patientEMR.Doctor}
            onChange={handleChange}
            readOnly
            placeholder="Doctor"
          />
        </div>
        <div className="ts-exam-inline-field">
          <label htmlFor="patient-dob">DOB</label>
          <input
            id="patient-dob"
            className="ts-input"
            type="date"
            name="PatientDOB"
            value={patientEMR.PatientDOB}
            onChange={handleChange}
          />
        </div>
        <div className="ts-exam-inline-field">
          <label htmlFor="patient-sex">Gender</label>
          <select
            id="patient-sex"
            className="ts-input"
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

      <div className="ts-exam-patient-row">
        <div className="ts-exam-inline-field">
          <label htmlFor="exam-date">Exam Date</label>
          <input
            id="exam-date"
            className="ts-input"
            type="date"
            name="ExamDate"
            value={patientEMR.ExamDate}
            onChange={handleChange}
          />
        </div>
        <div className="ts-exam-inline-field">
          <label htmlFor="visual-od">Visual</label>
          <input
            id="visual-od"
            className="ts-input"
            type="text"
            name="VisualActivityOD"
            value={patientEMR.VisualActivityOD}
            onChange={handleChange}
            placeholder="OD"
            maxLength={30}
          />
          <input
            className="ts-input"
            type="text"
            name="VisualActivityOS"
            value={patientEMR.VisualActivityOS}
            onChange={handleChange}
            placeholder="OS"
            maxLength={30}
          />
        </div>
        <div className="ts-exam-inline-field ts-exam-inline-field-grow">
          <textarea
            className="ts-input ts-exam-textarea"
            name="RelNeurologicalFinds"
            value={patientEMR.RelNeurologicalFinds}
            onChange={handleChange}
            placeholder="Neurological Findings"
            maxLength={50}
          />
        </div>
        <div className="ts-exam-inline-field ts-exam-inline-field-grow">
          <textarea
            className="ts-input ts-exam-textarea"
            name="AphasiaText"
            value={patientEMR.AphasiaText}
            onChange={handleChange}
            placeholder="Aphasia Text"
            maxLength={50}
          />
          <div className="ts-exam-radio-row">
            <label className="ts-exam-radio">
              <input
                type="radio"
                value="true"
                name="HasAphasia"
                checked={patientEMR.HasAphasia === true}
                onChange={handleChange}
              />
              Yes
            </label>
            <label className="ts-exam-radio">
              <input
                type="radio"
                value="false"
                name="HasAphasia"
                checked={patientEMR.HasAphasia === false}
                onChange={handleChange}
              />
              No
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
