import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { PatientFormSubmit } from "../utils/auth"; // Import the PatientFormSubmit function
import client from "../api/client"; // Import your axios client for fetching data

const PatientForm = ({ savePatient, close }) => {
  const [patientData, setPatientData] = useState({
    Name: "",
    Appointments_Date: new Date(),
    Appointments_Time: "",
    Duration: "",
    Checkup_Status: "Pending",
    ID: "",
  });

  const [existingIDs, setExistingIDs] = useState([]); // State to hold existing IDs

  // Fetch existing patient IDs from the database
  useEffect(() => {
    const fetchExistingIDs = async () => {
      try {
        const response = await client.get("/api/patients"); // Fetch all patients
        const ids = response.data.map(patient => patient.ID); // Extract IDs
        setExistingIDs(ids); // Store them in state
      } catch (error) {
        console.error("Error fetching patient IDs:", error);
      }
    };

    fetchExistingIDs();
  }, []); // Run once on component mount

  // Function to generate a 5-digit unique ID
  const generateUniqueID = () => {
    let uniqueID;
    do {
      uniqueID = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit random number
    } while (existingIDs.includes(uniqueID)); // Regenerate if ID is not unique
    return uniqueID;
  };

  // Function to handle the save action
  const handleSavePatient = async (event) => {
    event.preventDefault(); // Prevent default form submission

    const uniqueID = generateUniqueID(); // Generate a new unique ID

    // Ensure the duration is a number and within the specified range
    const duration = parseInt(patientData.Duration, 10);
    if (isNaN(duration) || duration < 1 || duration > 60) {
      alert("Duration must be a number between 1 and 60.");
      return;
    }

    const updatedPatientData = { 
      ...patientData, 
      ID: uniqueID, 
      Duration: duration // Ensure Duration is a number
    };

    try {
      const response = await PatientFormSubmit(updatedPatientData); // Call the API to save patient data
      if (response) {
        alert("Patient saved successfully!");
        savePatient(updatedPatientData); // Save patient data with the generated ID
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
            onClick={handleSavePatient}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Save Patient
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
              onChange={(event) => {
                const value = event.target.value.replace(/[^a-zA-Z\s]/g, ''); // Allow only letters and spaces
                setPatientData({ ...patientData, Name: value });
              }}
              onKeyPress={(event) => {
                if (!/^[a-zA-Z\s]*$/.test(event.key)) {
                  event.preventDefault();
                }
              }}
              required
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
          <div>
            <label className="block text-gray-700">Duration (1-60 mins):</label>
            <input
              type="number" // Changed to number to enforce numeric input
              className="w-half p-2 border rounded"
              value={patientData.Duration}
              min="1"
              max="60"
              onChange={(event) => setPatientData({ ...patientData, Duration: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Checkup Status:</label>
            <select
              value={patientData.Checkup_Status}
              onChange={(event) => setPatientData({ ...patientData, Checkup_Status: event.target.value })}
              className="w-half p-2 border rounded"
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
