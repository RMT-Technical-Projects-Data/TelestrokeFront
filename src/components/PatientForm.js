import React, { useState, useEffect } from "react";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { PatientFormSubmit } from "../utils/auth"; // Import the PatientFormSubmit function
import client from "../api/client"; // Import your axios client for fetching data
import { getToken, createMeeting } from "../API"; // For meeting generation

const PatientForm = ({ savePatient, close }) => {
  const [patientData, setPatientData] = useState({
    Name: "",
    AppointmentDate: new Date(),
    AppointmentTime: "",
    Duration: "",
    Checkup_Status: "Pending",
    ID: "",
    Gender: "",
    Age: "",
    meetingId: "",
    token: "",
  });
  const [existingNames, setExistingNames] = useState([]); // Store existing names
  const [duplicateName, setDuplicateName] = useState(false); // Track duplicate name
  const [proceedWithDuplicate, setProceedWithDuplicate] = useState(false); // Track if proceeding with duplicate name

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
    if (!proceedWithDuplicate && existingNames.includes(patientData.Name)) {
      setDuplicateName(true); // Show the warning if name exists
      return;
    }

    // Check if a valid gender is set
    const validGenders = ["Male", "Female", "Other"]; // Adjust this array based on your application's accepted gender values
    if (!validGenders.includes(patientData.Gender)) {
      alert("Please select a valid gender."); // Show an alert if gender is not valid
      return;
    }

    const uniqueID = await generateUniqueID(); // Generate a new unique ID

    // Ensure the duration is a number and within the specified range
    const duration = parseInt(patientData.Duration, 10);
    if (isNaN(duration) || duration < 1 || duration > 60) {
      alert("Duration must be a number between 1 and 60.");
      return;
    }

    // Update the patient data with generated ID and validated duration
    const updatedPatientData = {
      ...patientData,
      ID: uniqueID,
      Duration: duration, // Ensure Duration is a number
    };

    try {
      // Generate meeting token and ID
      const token = await getToken(); 
      const meetingId = await createMeeting();
      if (!meetingId) {
        alert("Failed to create meeting. Please try again.");
        return;
      }

      // Include the generated meetingId and token in the data
      updatedPatientData.meetingId = meetingId;
      updatedPatientData.token = token;

      // Send the combined patient and appointment data in one request
      const response = await PatientFormSubmit(updatedPatientData); // Call the API to save patient and appointment data

      if (response) {
        alert("Patient and appointment saved successfully!");

        // Save the patient data in the state
        savePatient(updatedPatientData); 

        setDuplicateName(false); // Reset duplicate warning after success
        setProceedWithDuplicate(false); // Reset the proceed flag
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
      AppointmentDate: new Date(),
      AppointmentTime: "",
      Duration: "",
      Checkup_Status: "Pending",
      ID: "",
      Gender: "", // Reset gender field
      Age: "",
      meetingId: "",
      token: "",
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
            className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${duplicateName ? "hidden" : ""}`}
          >
            Save Patient
          </button>
          {duplicateName && (
           <button
           className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
           onClick={(e) => {
             setProceedWithDuplicate((prev) => {
               handleSavePatient(e); // Pass the event to handleSavePatient
               return true; // Set proceedWithDuplicate to true
             });
           }}
         >
           Proceed Anyway
         </button>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-5 p-6 bg-white rounded shadow-md mr-52">
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
                setProceedWithDuplicate(false); // Reset the proceed flag
              }}
              required
            />
            {duplicateName && (
              <p className="text-red-600 mt-2">Name Already Exists, press again to continue</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Age:</label>
            <input
              type="number"
              value={patientData.Age || ''} // Default value or empty if null
              onChange={(e) =>
                setPatientData({ ...patientData, Age: e.target.value })
              }
              className="w-small p-2 border rounded"
              placeholder="Enter age"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Appointment Date:</label>
            <DatePicker
              selected={patientData.AppointmentDate}
              onChange={(date) =>
                setPatientData({ ...patientData, AppointmentDate: date })
              }
              dateFormat="dd/MM/yyyy"
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Appointment Time:</label>
            <input
              type="time"
              value={patientData.AppointmentTime}
              onChange={(e) =>
                setPatientData({ ...patientData, AppointmentTime: e.target.value })
              }
              className="border rounded p-2"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Duration:</label>
            <input
              type="number"
              value={patientData.Duration}
              onChange={(e) =>
                setPatientData({ ...patientData, Duration: e.target.value })
              }
              className="border rounded p-2"
              placeholder="Enter duration in minutes"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700">Gender:</label>
            <select
              value={patientData.Gender}
              onChange={(e) =>
                setPatientData({ ...patientData, Gender: e.target.value })
              }
              className="border rounded p-2"
              required
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Checkup Status:</label>
            <select
              value={patientData.Checkup_Status}
              onChange={(e) =>
                setPatientData({ ...patientData, Checkup_Status: e.target.value })
              }
              className="border rounded p-2"
            >
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </form>
      </div>
    </>
  );
};

export default PatientForm;
