import React, { useState, useEffect } from "react";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { PatientFormSubmit } from "../utils/auth"; // Import the PatientFormSubmit function
import { AppointmentFormSubmit } from "../utils/auth"; // Import the AppointmentFormSubmit and getToken functions
import client from "../api/client"; // Import your axios client for fetching data
import {getToken, createMeeting} from "../API";

const PatientForm = ({ savePatient, close }) => {
  const [patientData, setPatientData] = useState({
    Name: "",
    // Appointments_Date: new Date(),
    // Appointments_Time: "",
    // Duration: "",
    // Checkup_Status: "Pending",
    ID: "",
    Gender: "Select" ,
    DOB: Date(),
  });
  const [existingNames, setExistingNames] = useState([]); // Store existing names
  const [duplicateName, setDuplicateName] = useState(false); // Track duplicate name

  // Function to generate a 5-digit unique ID
  const generateUniqueID = async () => {
    let uniqueID;
    let existingIDs = [];
    try {
      const response = await client.get("/api/patients"); // Fetch all patients
      existingIDs = response.data.map((patient) => patient.ID); // Extract IDs
    } catch (error) {
      console.error("Error fetching patient IDs:", error);
    }

    do {
      uniqueID = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit random number
    } while (existingIDs.includes(uniqueID)); // Regenerate if ID is not unique

    return uniqueID;
  };

  // Fetch existing patient names on page load
  useEffect(() => {
    const fetchPatientNames = async () => {
      try {
        const response = await client.get("/api/patients"); // Replace with your API endpoint
        const names = response.data.map((patient) => patient.Name); // Extract names
        setExistingNames(names);
      } catch (error) {
        console.error("Error fetching patient names:", error);
      }
    };

    fetchPatientNames();
  }, []);

  // Function to handle the save action
  const handleSavePatient = async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Check for duplicate name
    if (existingNames.includes(patientData.Name)) {
      setDuplicateName(true); // Show the warning if name exists
      return;
    }

    const uniqueID = await generateUniqueID(); // Generate a new unique ID

    // Ensure the duration is a number and within the specified range
    const duration = parseInt(patientData.Duration, 10);
    if (isNaN(duration) || duration < 1 || duration > 60) {
      alert("Duration must be a number between 1 and 60.");
      return;
    }

    const updatedPatientData = {
      ...patientData,
      ID: uniqueID,
      Duration: duration, // Ensure Duration is a number
    };

    try {
      const response = await PatientFormSubmit(updatedPatientData); // Call the API to save patient data
      if (response) {
        alert("Patient saved successfully!");

        // Save the patient data
        savePatient(updatedPatientData); // Save patient data with the generated ID

        // Now save the same data in the appointments table
        const token = await getToken(); // Generate the token
        const meetingId = await createMeeting();
        if (!meetingId) {
          alert("Failed to create meeting. Please try again.");
          return;
        }
        const appointmentData = {
          PatientID: uniqueID,
          PatientName: patientData.Name,
          AppointmentDate: patientData.Appointments_Date,
          AppointmentTime: patientData.Appointments_Time,
          Duration: duration,
          Checkup_Status: patientData.Checkup_Status,
          token: token, // Add the token to the appointment data
          meetingId: meetingId
        };

        // Submit the appointment data
        const appointmentResponse = await AppointmentFormSubmit(appointmentData);
        if (appointmentResponse) {
          alert("Appointment saved successfully!");
        } else {
          alert("Error saving appointment.");
        }

        setDuplicateName(false); // Reset duplicate warning after success
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const back = () => {
    setPatientData({
      Name: "",
      Appointments_Date: new Date(),
      Appointments_Time: "",
      Duration: "",
      Checkup_Status: "Pending",
      ID: "",
    });
    close();
  };

  // Function to handle pressing "Proceed Anyway" after seeing the duplicate name warning
  const handleProceedAfterWarning = async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Proceed to save patient data, generating unique ID as well
    const uniqueID = await generateUniqueID(); // Generate a new unique ID

    const duration = parseInt(patientData.Duration, 10);
    if (isNaN(duration) || duration < 1 || duration > 60) {
      alert("Duration must be a number between 1 and 60.");
      return;
    }

    const updatedPatientData = {
      ...patientData,
      ID: uniqueID,
      Duration: duration, // Ensure Duration is a number
    };

    try {
      const response = await PatientFormSubmit(updatedPatientData); // Call the API to save patient data
      if (response) {
        alert("Patient saved successfully!");

        // Save the patient data
        savePatient(updatedPatientData); // Save patient data with the generated ID

        // Now save the same data in the appointments table
        const token = await getToken(); // Generate the token
        const meetingId = await createMeeting();
        if (!meetingId) {
          alert("Failed to create meeting. Please try again.");
          return;
        }
        const appointmentData = {
          PatientID: uniqueID,
          PatientName: patientData.Name,
          AppointmentDate: patientData.Appointments_Date,
          AppointmentTime: patientData.Appointments_Time,
          Duration: duration,
          Checkup_Status: patientData.Checkup_Status,
          Token: token, // Add the token to the appointment data
          meetingId: meetingId
        };

        // Submit the appointment data
        const appointmentResponse = await AppointmentFormSubmit(appointmentData);
        if (appointmentResponse) {
          alert("Appointment saved successfully!");
        } else {
          alert("Error saving appointment.");
        }

        setDuplicateName(false); // Reset duplicate warning after success
      } else {
        alert(`Error: ${response.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
    
  };

  return (
    <>
      <div className="flex flex-row justify-between mb-6">
        <h1 className="text-2xl font-bold">Patients</h1>
        <div className="flex flex-row gap-3 mr-52">
          <button
            onClick={back}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Back
          </button>
          <button
            onClick={duplicateName ? handleProceedAfterWarning : handleSavePatient}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {duplicateName ? "Proceed Anyway" : "Save Patient"}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-5 p-6 bg-white rounded shadow-md mr-52">
        <div>
          <p className="font-bold text-lg">Add Patient's Information</p>
          <p>Fill in the information with patient data</p>
        </div>
        <form className="flex flex-col gap-8" onSubmit={handleSavePatient}>
          <div>
            <label className="block text-gray-700">Name:</label>
            <input
              type="text"
              className="w-half p-2 border rounded"
              value={patientData.Name}
              onChange={(event) => {
                const value = event.target.value.replace(/[^a-zA-Z\s]/g, ""); // Allow only letters and spaces
                setPatientData({ ...patientData, Name: value });
                setDuplicateName(false); // Reset duplicate warning on name change
              }}
              required
            />
            {duplicateName && (
              <p className="text-red-600 mt-2">Name Already Exists, press again to continue</p>
            )}
          </div>
                <div>
            <label className="block text-gray-700">Date of Birth:</label>
            <DatePicker
              selected={patientData.DOB}
              onChange={(date) => setPatientData({ ...patientData, DOB: date })}
              dateFormat="dd/MM/yyyy"
              className="w-full p-2 border rounded"
              required
              showYearDropdown
              yearDropdownItemNumber={80} // Number of years to show in dropdown
              scrollableYearDropdown
              placeholderText="Select a date"
            />
          </div>
          <div>
            <label className="block text-gray-700">Appointment Date:</label>
            <DatePicker
              selected={patientData.Appointments_Date}
              onChange={(date) => setPatientData({ ...patientData, Appointments_Date: date })}
              dateFormat="dd/MM/yyyy"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Appointment Time:</label>
            <input
              type="time"
              value={patientData.Appointments_Time}
              onChange={(e) => setPatientData({ ...patientData, Appointments_Time: e.target.value })}
              className="border rounded p-2"
              required
            />
          </div>
          <div className="mb-4">
          <label className="block text-gray-700">Duration</label>
          <select
            name="Duration"
            value={patientData.Duration}
            onChange={(e) =>
              setPatientData({ ...patientData, Duration: Number(e.target.value) })
            } // Update to store as number
            className="w-small p-2 border rounded"
            required
          >
            {Array.from({ length: 12 }, (_, i) => (i + 1) * 5).map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes} mins
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
            <label className="block text-gray-700">Gender</label>
            <select
              name="Checkup_Status"
              value={patientData.Checkup_Status}
              onChange={(e) =>
                setPatientData({ ...patientData, Checkup_Status: e.target.value })
              }
              className="w-small p-2 border rounded"
              required
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
            {/* Checkup Status */}
          <div className="mb-4">
            <label className="block text-gray-700">Checkup Status</label>
            <select
              name="Checkup_Status"
              value={patientData.Checkup_Status}
              onChange={(e) =>
                setPatientData({ ...patientData, Checkup_Status: e.target.value })
              }
              className="w-small p-2 border rounded"
              required
            >
              <option value="Pending">Pending</option>
              <option value="Complete">Complete</option>
            </select>
          </div>
        </form>
      </div>
    </>
  );
};

export default PatientForm;
