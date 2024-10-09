import React, { useState } from "react";
import Button from "./Button";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PatientForm = ({ savePatient, close }) => {
  const [patientData, setPatientData] = useState({
    Name: "",
    Appointments_Date: new Date(), // Initialize with current date
    Appointments_Hours: "04", // Default hour
    Appointments_Minutes: "05", // Default minutes
    Appointments_AMPM: "AM", // Default AM/PM
    Duration: "30 mins",
    Checkup_Status: "Complete",
    ID: "", // Adding ID field to store generated unique ID
  });

  // Function to generate a 5-digit unique ID
  const generateUniqueID = () => {
    return Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit random number
  };

  // Function to handle the save action
  const handleSavePatient = () => {
    const uniqueID = generateUniqueID(); // Generate a new ID
    const timeString = `${patientData.Appointments_Hours}:${patientData.Appointments_Minutes} ${patientData.Appointments_AMPM}`;
    const updatedPatientData = { ...patientData, Appointments_Time: timeString, ID: uniqueID }; // Combine hour, minute, and AM/PM into one string
    setPatientData(updatedPatientData); // Update state with the new time and ID
    savePatient(updatedPatientData); // Save patient data with the generated ID
  };

  const back = () => {
    setPatientData({
      Name: "",
      Appointments_Date: new Date(),
      Appointments_Hours: "04",
      Appointments_Minutes: "05",
      Appointments_AMPM: "AM",
      Duration: "",
      Checkup_Status: "",
      ID: "", // Resetting ID when navigating back
    });
    close();
  };

  // Generate options for hours (1 to 12)
  const hourOptions = [...Array(12)].map((_, i) => {
    const value = (i + 1).toString().padStart(2, "0");
    return <option key={value} value={value}>{value}</option>;
  });

  // Generate options for minutes (00 to 59)
  const minuteOptions = [...Array(60)].map((_, i) => {
    const value = i.toString().padStart(2, "0");
    return <option key={value} value={value}>{value}</option>;
  });

  return (
    <>
      <div className="flex flex-row justify-between mb-6">
        <h1 className="text-2xl font-bold">Patients</h1>
        <div className="flex flex-row gap-3 mr-52">
          <button
            onClick={() => back()}
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
      // Use a regular expression to allow only letters and spaces
      const value = event.target.value.replace(/[^a-zA-Z\s]/g, '');
      setPatientData({ ...patientData, Name: value });
    }}
    onKeyPress={(event) => {
      // Prevent numbers and special characters from being typed
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
            <div className="flex flex-row gap-2">
              {/* Hour Selector */}
              <select
                value={patientData.Appointments_Hours}
                onChange={(e) => setPatientData({ ...patientData, Appointments_Hours: e.target.value })}
                className="border rounded p-2"
              >
                {hourOptions}
              </select>
              {/* Minute Selector */}
              <select
                value={patientData.Appointments_Minutes}
                onChange={(e) => setPatientData({ ...patientData, Appointments_Minutes: e.target.value })}
                className="border rounded p-2"
              >
                {minuteOptions}
              </select>
              {/* AM/PM Selector */}
              <select
                value={patientData.Appointments_AMPM}
                onChange={(e) => setPatientData({ ...patientData, Appointments_AMPM: e.target.value })}
                className="border rounded p-2"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-gray-700">Duration:</label>
            <input
  type="number"
  className="w-half p-2 border rounded"
  onChange={(event) => {
    // Ensure that only integers are set in the state
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      setPatientData({
        ...patientData,
        Duration: value,
      });
    } else {
      setPatientData({
        ...patientData,
        Duration: "", // Optionally reset if the input is invalid
      });
    }
  }}
  required
  min="0" // Prevent negative numbers
  step="1" // Only allow whole numbers
/>

          </div>
          <div>
            <label className="block text-gray-700">Checkup Status:</label>
            <select
              onChange={(event) => {
                setPatientData({
                  ...patientData,
                  Checkup_Status: event.target.value,
                });
              }}
              className="w-half p-2 border rounded"
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
