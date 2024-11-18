import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppointmentFormSubmit } from "../utils/auth";
import { getAllAppointments } from "../utils/auth";
import { getToken, createMeeting,} from "../API";

const AppointmentForm = ({ close }) => {
  const navigate = useNavigate();

  const [newAppointment, setNewAppointment] = useState({
    Name: "",
    ID: "",
    AppointmentTime: "",
    AppointmentDate: "",
    Duration: 0,
    Checkup_Status: "Pending",
    token: "",
    meetingId: "",

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

  const generateAppointmentID = async () => {
    try {
      const appointments = await getAllAppointments(); // Fetch existing appointments from your API or database
      let maxID = 0;
  
      if (appointments && appointments.length > 0) {
        // Find the highest appointment ID
        maxID = Math.max(...appointments.map((appt) => parseInt(appt.ID, 10)));
      }
  
      // If no appointments, start with 1, and ensure it is a 5-digit number
      const newID = String(maxID + 1).padStart(5, "0"); // Format it as a 5-digit number
      return newID;
    } catch (error) {
      console.error("Error fetching appointments:", error);
      alert("Error generating appointment ID. Please try again.");
    }
  };
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = await getToken();
      if (!token) {
        alert("Failed to generate token. Please try again.");
        return;
      }

      const meetingId = await createMeeting();
      if (!meetingId) {
        alert("Failed to create meeting. Please try again.");
        return;
      }

      // Generate the new appointment ID
      const appointmentID = await generateAppointmentID();

      const newAppointmentData = {
        ...newAppointment,
        ID: appointmentID, // Add the generated ID here
        token: token,
        meetingId: meetingId,
    
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

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mr-52 mt-8">
      <div className="mb-4">
        <label className="block text-gray-700">Patient Name</label>
        <input
          type="text"
          name="Name"
          value={newAppointment.Name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Patient ID</label>
        <input
          type="text"
          name="ID"
          value={newAppointment.ID}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
          readOnly // Make the ID field read-only as it's generated automatically
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
          {Array.from({ length: 7 }, (_, i) => i * 10).map((minutes) => (
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
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Appointment
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
