import React, { useState } from "react";

const AppointmentForm = ({ saveAppointment, close, appointments_data }) => {
  console.log("Patient data in prop ..........", appointments_data);
  const [newAppointment, setNewAppointment] = useState({
    ID: "",
    Appointments_Time: "",
    Appointments_Date: "",
    Duration: "",
  });

  const handleChange = (e) => {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    const { name, value } = e.target;
    if (name == "Appointments_Date") {
      if (value < today) {
        alert("Select Today or later Dates!");
      } else {
        setNewAppointment({
          ...newAppointment,
          [name]: value,
        });
      }
    }
    // } else if (name == "Appointments_Time") {
    //   let time = e.target.value;
    //   // Convert 24-hour time to 12-hour format with AM/PM
    //   let [hours, minutes] = time.split(":");
    //   let suffix = hours >= 12 ? "PM" : "AM";
    //   hours = hours % 12 || 12; // Convert to 12-hour format

    //   let formattedTime = `${hours}:${minutes}`;
    //   setNewAppointment({
    //     ...newAppointment,
    //     [name]: formattedTime,
    //   });
    // }
    else {
      setNewAppointment({
        ...newAppointment,
        [name]: value,
      });
    }
  };

  const checkAppointmentCollision = () => {
    // Convert new appointment time and date into Date objects
    const newAppDate = new Date(
      `${newAppointment.Appointments_Date}T${newAppointment.Appointments_Time}`
    );

    // Iterate through existing appointments
    for (let appointment of appointments_data) {
      const appDate = new Date(
        `${appointment.Appointments_Date}T${appointment.Appointments_Time}`
      );

      // Calculate appointment end time based on duration
      const appEndTime = new Date(
        appDate.getTime() + parseDuration(appointment.Duration)
      );

      // Calculate new appointment end time
      const newAppEndTime = new Date(
        newAppDate.getTime() + parseDuration(newAppointment.Duration)
      );

      // Check if the appointments overlap
      if (
        newAppointment.Appointments_Date === appointment.Appointments_Date && // same date
        ((newAppDate >= appDate && newAppDate < appEndTime) || // starts within the existing appointment
          (newAppEndTime > appDate && newAppEndTime <= appEndTime) || // ends within the existing appointment
          (newAppDate <= appDate && newAppEndTime >= appEndTime)) // overlaps the entire existing appointment
      ) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  };

  const checkPatientIDCollision = () => {
    // Iterate through existing appointments
    for (let appointment of appointments_data) {
      // Check if the new patient ID already exists
      if (appointment.ID === newAppointment.ID) {
        return true; // Collision detected
      }
    }
    return false; // No collision
  };

  // Helper function to convert "Duration" (e.g., "30 mins") into milliseconds
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
      alert("Appointment already exsist on the Selected Date & Time.");
    } else if (checkPatientIDCollision()) {
      alert("Patient with this Id Already Exsist.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md">
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
      <div className="flex justify-between">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Appointment
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
