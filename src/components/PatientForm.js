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
      <div className="flex flex-row justify-between mb-8">
        <p className="text-2xl font-semibold">Patients</p>
        <div className="flex flex-row gap-3">
          <Button onClick={() => back()}>Back</Button>
          <Button onClick={handleSavePatient}>Save Patient</Button>
        </div>
      </div>
      <div className="flex flex-col gap-5 p-3 bg-[#F6F6F6]">
        <div>
          <p className="font-bold text-lg">Add Patient's Information</p>
          <p>Fill the Information with patient data</p>
        </div>
        <div className="flex flex-row">
          <form className="flex flex-col gap-8" onSubmit={handleSavePatient}>
            <div>
              <p className="mb-2 text-sm">Name:</p>
              <input
                type="text"
                className="border"
                onChange={(event) => {
                  setPatientData({ ...patientData, Name: event.target.value });
                }}
              />
            </div>
            <div>
              <p className="mb-2 text-sm">Appointments Date:</p>
              {/* Date picker component for selecting date */}
              <DatePicker
                selected={patientData.Appointments_Date}
                onChange={(date) => setPatientData({ ...patientData, Appointments_Date: date })}
                dateFormat="dd/MM/yyyy"
                className="border"
              />
            </div>
            <div>
              <p className="mb-2 text-sm">Appointments Time:</p>
              <div className="flex flex-row gap-2">
                {/* Hour Selector */}
                <select
                  value={patientData.Appointments_Hours}
                  onChange={(e) => setPatientData({ ...patientData, Appointments_Hours: e.target.value })}
                  className="border"
                >
                  {hourOptions}
                </select>
                {/* Minute Selector */}
                <select
                  value={patientData.Appointments_Minutes}
                  onChange={(e) => setPatientData({ ...patientData, Appointments_Minutes: e.target.value })}
                  className="border"
                >
                  {minuteOptions}
                </select>
                {/* AM/PM Selector */}
                <select
                  value={patientData.Appointments_AMPM}
                  onChange={(e) => setPatientData({ ...patientData, Appointments_AMPM: e.target.value })}
                  className="border"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm">Duration:</p>
              <input
                type="text"
                className="border"
                onChange={(event) => {
                  setPatientData({
                    ...patientData,
                    Duration: event.target.value,
                  });
                }}
              />
            </div>
            <div>
              <p className="mb-2 text-sm">Checkup Status:</p>
              <select
                onChange={(event) => {
                  setPatientData({
                    ...patientData,
                    Checkup_Status: event.target.value,
                  });
                }}
              >
                <option value="Pending">Pending</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PatientForm;
