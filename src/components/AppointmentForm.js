import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Assuming you're using React Router for navigation
import { AppointmentFormSubmit, getAllAppointments } from "../utils/auth"; // Import the function from utils

const AppointmentForm = ({ close, appointments_data }) => {
  const navigate = useNavigate(); // Hook for navigation

  const [newAppointment, setNewAppointment] = useState({
    PatientName: "",
    PatientID: "", // Add PatientID to state
    AppointmentTime: "",
    AppointmentDate: "",
    Duration: 0, // Store duration as a number (in minutes)
    Checkup_Status: "Pending", // Default status
  });

  const [patients, setPatients] = useState([]); // To hold fetched patients
  const [suggestions, setSuggestions] = useState([]); // To hold search suggestions
  const [autofilledDate, setAutofilledDate] = useState(""); // Track autofilled date

  // Fetch patients on component mount
  useEffect(() => {
    const fetchPatients = async () => {
      const allAppointments = await getAllAppointments(); // Fetch all appointments
      setPatients(allAppointments.map(formatPatientDate)); // Format dates when setting patients data
    };

    fetchPatients();
  }, []);

  // Function to format the appointment date from DB format
  const formatPatientDate = (patient) => {
    if (patient.AppointmentDate) {
      const date = new Date(patient.AppointmentDate); // Convert to Date object
      patient.AppointmentDate = date.toISOString().split("T")[0]; // Format to YYYY-MM-DD
    }
    return patient;
  };

  const handleChange = (e) => {
    const today = new Date().toISOString().split("T")[0];
    const { name, value } = e.target;

    if (name === "AppointmentDate" && value < today) {
      alert("Select today or later dates!");
    } else {
      setNewAppointment((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle patient search input
  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase(); // Make search case insensitive

    // Search for matching patients by name or ID
    const matchedPatients = patients.filter(
      (patient) =>
        patient.PatientName.toLowerCase().startsWith(value) || // Match by name
        patient.PatientID.toString().startsWith(value) // Match by ID
    );

    setSuggestions(matchedPatients); // Set suggestions based on search
    setNewAppointment((prev) => ({ ...prev, PatientName: e.target.value })); // Update PatientName field
  };

  const handleSuggestionClick = (patient) => {
    // Set selected patient data, including autofilling AppointmentDate
    setNewAppointment({
      ...newAppointment,
      PatientName: patient.PatientName,
      PatientID: patient.PatientID,
      AppointmentDate: patient.AppointmentDate || newAppointment.AppointmentDate, // Autofill AppointmentDate if available
    });
    setAutofilledDate(patient.AppointmentDate); // Track the autofilled date
    setSuggestions([]); // Clear suggestions after selection
  };

  const checkAppointmentCollision = () => {
    // Check for collision based on PatientID, PatientName, and AppointmentDate
    return appointments_data.some((appointment) => {
      const isSamePatient = newAppointment.PatientID === appointment.PatientID;
      const isSameName = newAppointment.PatientName === appointment.PatientName;
      const isSameDate = newAppointment.AppointmentDate === appointment.AppointmentDate;

      // Debugging logs to see what values are being compared
      console.log(`Checking collision: 
        PatientID: ${isSamePatient}, 
        PatientName: ${isSameName}, 
        AppointmentDate: ${isSameDate}`);

      return isSamePatient && isSameName && isSameDate;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if patient exists based on ID
    const patientExists = patients.some(
      (patient) => patient.PatientID === newAppointment.PatientID
    );

    if (!patientExists) {
      alert("Patient not found, please use Add Patient for making a new patient");
      return;
    }

    // Collision check for existing appointments
    if (checkAppointmentCollision()) {
      alert("Patient already has an appointment on the same date.");
      return; // Prevent further execution if appointment exists
    }

    // Proceed to save the appointment if no collision is found
    const newAppointmentData = {
      ...newAppointment,
    };

    try {
      const response = await AppointmentFormSubmit(newAppointmentData);

      if (response) {
        alert("Appointment saved successfully!");
        close(); // Close the form if needed
      } else {
        alert("Appointment post request error!");
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      alert("Error saving appointment. Please try again.");
    }
  };

  const handleAddPatient = () => {
    navigate("/Patient");
  };

  // Disable the save button if the autofilled date hasn't been changed
  const isSaveDisabled = autofilledDate && newAppointment.AppointmentDate === autofilledDate;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mr-52 mt-8">
      <div className="mb-4">
        <label className="block text-gray-700">Patient Name</label>
        <input
          type="text"
          name="PatientName"
          value={newAppointment.PatientName}
          onChange={handleSearchChange} // Handle search input
          className="w-full p-2 border rounded"
          required
        />
        {suggestions.length > 0 && (
          <ul className="border rounded mt-1">
            {suggestions.map((patient) => (
              <li
                key={patient.PatientID}
                onClick={() => handleSuggestionClick(patient)} // Select patient on click
                className="cursor-pointer hover:bg-gray-200 p-2"
              >
                {patient.PatientName} (ID: {patient.PatientID})
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Patient ID</label>
        <input
          type="text"
          name="PatientID"
          value={newAppointment.PatientID}
          readOnly // Make ID read-only as it will be filled by selecting a patient
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Appointment Date</label>
        <input
          type="date"
          name="AppointmentDate"
          value={newAppointment.AppointmentDate}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        {isSaveDisabled && (
          <span className="text-red-500 text-sm">Change the Date</span>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Appointment Time</label>
        <input
          type="time"
          name="AppointmentTime"
          value={newAppointment.AppointmentTime}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Duration</label>
        <select
          name="Duration"
          value={newAppointment.Duration}
          onChange={(e) =>
            setNewAppointment({ ...newAppointment, Duration: Number(e.target.value) })
          } // Update to store as number
          className="w-full p-2 border rounded"
          required
        >
          {Array.from({ length: 12 }, (_, i) => (i + 1) * 5).map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} mins
            </option>
          ))}
        </select>
      </div>
      {/* Checkup Status */}
      <div className="mb-4">
        <label className="block text-gray-700">Checkup Status</label>
        <select
          name="Checkup_Status"
          value={newAppointment.Checkup_Status}
          onChange={(e) =>
            setNewAppointment({ ...newAppointment, Checkup_Status: e.target.value })
          }
          className="w-full p-2 border rounded"
          required
        >
          <option value="Pending">Pending</option>
          <option value="Complete">Complete</option>
        </select>
      </div>
      <div className="flex justify">
        <button
          type="submit"
          disabled={isSaveDisabled} // Disable button if conditions not met
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${isSaveDisabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          Save Appointment
        </button>
        <button
          type="button"
          onClick={handleAddPatient}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-4"
        >
          Add Patient
        </button>
        <button
          type="button"
          onClick={close}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-4"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AppointmentForm;
