import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Assuming you're using React Router for navigation
import { AppointmentFormSubmit, getAllAppointments } from "../utils/auth"; // Import the function from utils
import { getToken, createMeeting } from "../API"; // Import createMeeting

const AppointmentForm = ({ close, appointments_data }) => {
  const navigate = useNavigate(); // Hook for navigation

  const [newAppointment, setNewAppointment] = useState({
    Name: "",
    ID: "",
    AppointmentTime: "",
    AppointmentDate: "",
    Duration: 0,
    Checkup_Status: "Pending",
    token: "",
    meetingId: "", // Added to store the generated meeting ID
  });

  const [patients, setPatients] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [autofilledDate, setAutofilledDate] = useState("");

  useEffect(() => {
    const fetchPatients = async () => {
      const allAppointments = await getAllAppointments();
      setPatients(allAppointments.map(formatPatientDate));
    };

    fetchPatients();
  }, []);

  const formatPatientDate = (patient) => {
    if (patient.AppointmentDate) {
      const date = new Date(patient.AppointmentDate);
      patient.AppointmentDate = date.toISOString().split("T")[0];
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

  const handleSearchChange = (e) => {
    const value = e.target.value.toLowerCase();

    const matchedPatients = patients.filter(
      (patient) =>
        patient.Name.toLowerCase().startsWith(value) ||
        patient.ID.toString().startsWith(value)
    );

    setSuggestions(matchedPatients);
    setNewAppointment((prev) => ({ ...prev, Name: e.target.value }));
  };

  const handleSuggestionClick = (patient) => {
    setNewAppointment({
      ...newAppointment,
      Name: patient.Name,
      ID: patient.ID,
      AppointmentDate: patient.AppointmentDate || newAppointment.AppointmentDate,
    });
    setAutofilledDate(patient.AppointmentDate);
    setSuggestions([]);
  };

  const checkAppointmentCollision = () => {
    return appointments_data.some((appointment) => {
      const isSamePatient = newAppointment.ID === appointment.ID;
      const isSameName = newAppointment.Name === appointment.Name;
      const isSameDate = newAppointment.AppointmentDate === appointment.AppointmentDate;

      return isSamePatient && isSameName && isSameDate;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = await getToken();
      if (!token) {
        alert("Failed to generate token. Please try again.");
        return;
      }

      // Check if patient exists based on ID
      const patientExists = patients.some(
        (patient) => patient.ID === newAppointment.ID
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

      // Call createMeeting and pass the region (you can change this if needed)
      const meetingId = await createMeeting();
      if (!meetingId) {
        alert("Failed to create meeting. Please try again.");
        return;
      }

      // Proceed to save the appointment if no collision is found
      const newAppointmentData = {
        ...newAppointment,
        token: token, // Add the token to the appointment data
        meetingId: meetingId, // Add the meeting ID to the appointment data
      };

      const response = await AppointmentFormSubmit(newAppointmentData);

      if (response) {
        alert("Appointment saved successfully!");
        close();
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

  const isSaveDisabled = autofilledDate && newAppointment.AppointmentDate === autofilledDate;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mr-52 mt-8">
      <div className="mb-4">
        <label className="block text-gray-700">Patient Name</label>
        <input
          type="text"
          name="Name"
          value={newAppointment.Name}
          onChange={handleSearchChange}
          className="w-full p-2 border rounded"
          required
        />
        {suggestions.length > 0 && (
          <ul className="border rounded mt-1">
            {suggestions.map((patient) => (
              <li
                key={patient.ID}
                onClick={() => handleSuggestionClick(patient)}
                className="cursor-pointer hover:bg-gray-200 p-2"
              >
                {patient.Name} (ID: {patient.ID})
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Patient ID</label>
        <input
          type="text"
          name="ID"
          value={newAppointment.ID}
          readOnly
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
    }
    className="w-full p-2 border rounded"
    required
  >
    {/* Replace 5 with 0 */}
    {Array.from({ length: 13 }, (_, i) => i * 5).map((minutes) => (
      <option key={minutes} value={minutes}>
        {minutes} mins
      </option>
    ))}
  </select>
</div>

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
          disabled={isSaveDisabled}
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
