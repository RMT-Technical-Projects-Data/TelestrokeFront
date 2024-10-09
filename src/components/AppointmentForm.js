import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Assuming you're using React Router for navigation

const AppointmentForm = ({ saveAppointment, close, appointments_data }) => {
  const navigate = useNavigate(); // Hook for navigation

  const [newAppointment, setNewAppointment] = useState({
    Patient_Name: "", // New field for patient name
    ID: "",
    Appointments_Time: "",
    Appointments_Date: "",
    Duration: "",
  });

  const handleChange = (e) => {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    const { name, value } = e.target;
    if (name === "Appointments_Date") {
      if (value < today) {
        alert("Select Today or later Dates!");
      } else {
        setNewAppointment({
          ...newAppointment,
          [name]: value,
        });
      }
    } else {
      setNewAppointment({
        ...newAppointment,
        [name]: value,
      });
    }
  };

  const checkAppointmentCollision = () => {
    const newAppDate = new Date(
      `${newAppointment.Appointments_Date}T${newAppointment.Appointments_Time}`
    );

    for (let appointment of appointments_data) {
      const appDate = new Date(
        `${appointment.Appointments_Date}T${appointment.Appointments_Time}`
      );

      const appEndTime = new Date(
        appDate.getTime() + parseDuration(appointment.Duration)
      );

      const newAppEndTime = new Date(
        newAppDate.getTime() + parseDuration(newAppointment.Duration)
      );

      if (
        newAppointment.Appointments_Date === appointment.Appointments_Date &&
        ((newAppDate >= appDate && newAppDate < appEndTime) ||
          (newAppEndTime > appDate && newAppEndTime <= appEndTime) ||
          (newAppDate <= appDate && newAppEndTime >= appEndTime))
      ) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  };

  const checkPatientIDCollision = () => {
    for (let appointment of appointments_data) {
      if (appointment.ID === newAppointment.ID) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  };

  const parseDuration = (duration) => {
    const [value, unit] = duration.split(" ");
    if (unit === "mins") {
      return value * 60000; // Convert minutes to milliseconds
    }
    return 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!checkAppointmentCollision() && !checkPatientIDCollision()) {
      saveAppointment(newAppointment);
    } else if (checkAppointmentCollision()) {
      alert("Appointment already exists on the Selected Date & Time.");
    } else if (checkPatientIDCollision()) {
      alert("Patient with this Id Already Exists.");
    }
  };

  const handleAddPatient = () => {
    navigate("/Patient"); // Change this path to your actual patient form route
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mr-52 mt-8"> 
      <div className="mb-4">
        <label className="block text-gray-700">Patient Name</label>
        <input
          type="text"
          name="Patient_Name"
          value={newAppointment.Patient_Name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Patient Id</label>
        <input
          type="text"
          name="ID"
          value={newAppointment.ID}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Appointment Date</label>
        <input
          type="date"
          name="Appointments_Date"
          value={newAppointment.Appointments_Date}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 required">Appointment Time</label>
        <input
          type="time"
          name="Appointments_Time"
          value={newAppointment.Appointments_Time}
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
          onChange={handleChange}
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

export default AppointmentForm;
