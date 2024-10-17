import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Assuming you're using React Router for navigation
import { AppointmentFormSubmit } from "../utils/auth"; // Import the function from utils

const AppointmentForm = ({ close, appointments_data }) => {
  const navigate = useNavigate(); // Hook for navigation

  const [newAppointment, setNewAppointment] = useState({
    PatientName: "",
    PatientID: "", // Keep as string, will validate on submit
    AppointmentTime: "",
    AppointmentDate: "",
    Duration: 0, // Store duration as a number (in minutes)
  });

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

  const checkAppointmentCollision = () => {
    const newAppDate = new Date(
      `${newAppointment.AppointmentDate}T${newAppointment.AppointmentTime}`
    );

    return appointments_data.some((appointment) => {
      const appDate = new Date(
        `${appointment.AppointmentDate}T${appointment.AppointmentTime}`
      );

      const appEndTime = new Date(
        appDate.getTime() + parseDuration(appointment.Duration)
      );

      const newAppEndTime = new Date(
        newAppDate.getTime() + parseDuration(newAppointment.Duration)
      );

      return (
        newAppointment.AppointmentDate === appointment.AppointmentDate &&
        ((newAppDate >= appDate && newAppDate < appEndTime) ||
          (newAppEndTime > appDate && newAppEndTime <= appEndTime) ||
          (newAppDate <= appDate && newAppEndTime >= appEndTime))
      );
    });
  };

  const checkPatientIDCollision = () => {
    return appointments_data.some(
      (appointment) => appointment.PatientID === newAppointment.PatientID
    );
  };

  const parseDuration = (duration) => {
    // Assuming duration is stored in minutes (number)
    return duration * 60000; // Convert minutes to milliseconds
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate PatientID to ensure it's exactly a 5-digit number
    const isValidPatientID = (id) => /^[0-9]{5}$/.test(id);

    if (!isValidPatientID(newAppointment.PatientID)) {
      alert("Invalid Patient ID format. Please enter a 5-digit Patient ID.");
      return;
    }

    if (!checkAppointmentCollision() && !checkPatientIDCollision()) {
      const response = await AppointmentFormSubmit(newAppointment);
      console.log(response?.status);
      
      if (response) {
        // close(); // Close the form if needed
        alert("Appointment saved successfully!");
      } else {
        alert("Appointment post request error!");
      }
    } else if (checkAppointmentCollision()) {
      alert("Appointment already exists on the selected date & time.");
    } else if (checkPatientIDCollision()) {
      alert("Patient with this ID already exists.");
    }
  };

  const handleAddPatient = () => {
    navigate("/Patient");
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mr-52 mt-8">
      <div className="mb-4">
        <label className="block text-gray-700">Patient Name</label>
        <input
          type="text"
          name="PatientName"
          value={newAppointment.PatientName}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Patient ID</label>
        <input
          type="text"
          name="PatientID"
          value={newAppointment.PatientID}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
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
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 required">Appointment Time</label>
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
          onChange={(e) => setNewAppointment({ ...newAppointment, Duration: Number(e.target.value) })} // Update to store as number
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
      <div className="flex justify">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Appointment
        </button>
        <button
          type="button"
          onClick={handleAddPatient}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Add Patient
        </button>
        <button
          type="button"
          onClick={close}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

// Export the AppointmentForm component
export default AppointmentForm;
