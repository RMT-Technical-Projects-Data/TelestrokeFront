import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Assuming you're using React Router for navigation
import { AppointmentFormSubmit } from "../utils/auth"; // Import the function from utils

const AppointmentForm = ({ close, appointments_data }) => {
  const navigate = useNavigate(); // Hook for navigation

  const [newAppointment, setNewAppointment] = useState({
    PatientName: "",
    AppointmentTime: "",
    AppointmentDate: "",
    Duration: 0, // Store duration as a number (in minutes)
    Checkup_Status: "Pending", // Default status
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

  // Generate a random 5-digit ID
  const generatePatientID = () => {
    let newID;
    let isUnique = false;

    while (!isUnique) {
      newID = Math.floor(10000 + Math.random() * 90000); // Generate a 5-digit number
      isUnique = !appointments_data.some(
        (appointment) => appointment.PatientID === newID
      );
    }

    return newID;
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

  const parseDuration = (duration) => {
    // Assuming duration is stored in minutes (number)
    return duration * 60000; // Convert minutes to milliseconds
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checkAppointmentCollision()) {
      // Generate the unique PatientID
      const uniquePatientID = generatePatientID();

      const newAppointmentData = {
        ...newAppointment,
        PatientID: uniquePatientID, // Add the generated ID
      };

      const response = await AppointmentFormSubmit(newAppointmentData);

      if (response) {
        // close(); // Close the form if needed
        alert("Appointment saved successfully!");
      } else {
        alert("Appointment post request error!");
      }
    } else {
      alert("Appointment already exists on the selected date & time.");
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
          <option value="Pending"> Pending</option>
          <option value="Complete">Complete</option>
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
