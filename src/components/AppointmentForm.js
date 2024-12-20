import React, { useState, useEffect } from "react";
import { AppointmentFormSubmit } from "../utils/auth";
import { getAllAppointments } from "../utils/auth";
import { getToken, createMeeting } from "../API";
import { toast, ToastContainer } from "react-toastify"; // Import Toastify

const AppointmentForm = ({ close }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelEnabled, setIsCancelEnabled] = useState(true);
  const [newAppointment, setNewAppointment] = useState({
    Name: "",
    ID: "",
    AppointmentTime: "",
    AppointmentDate: "",
    Checkup_Status: "Pending",
    token: "",
    meetingId: "",
    Doctor: "", // Add Doctor field in the state
  });

  // Retrieve the doctor's name from localStorage
  useEffect(() => {
    const doctorName = localStorage.getItem("Doctor") || "Unknown Doctor";
    setNewAppointment((prev) => ({
      ...prev,
      Doctor: doctorName, // Set the Doctor field
    }));
  }, []);

  const handleChange = (e) => {
    const today = new Date().toISOString().split("T")[0];
    const { name, value } = e.target;

    // Check if the AppointmentDate is less than today's date
    if (name === "AppointmentDate" && value < today) {
      toast.error("Please select today or a future date!"); // Show toast error notification
    } else {
      setNewAppointment((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Handle invalid dates
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString(undefined, options);
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hour, minute] = time.split(':') || [];
    if (!hour || !minute) return '';
    const hourNum = parseInt(hour, 10);
    const isPM = hourNum >= 12;
    const formattedHour = hourNum % 12 || 12;
    const amPm = isPM ? 'PM' : 'AM';
    return `${formattedHour}:${minute} ${amPm}`;
  };

  const generateAppointmentID = async () => {
    try {
      const doctor = localStorage.getItem("Doctor");
      const appointments = await getAllAppointments(doctor);
      let maxID = 0;

      if (appointments && appointments.length > 0) {
        maxID = Math.max(...appointments.map((appt) => parseInt(appt.ID, 10)));
      }

      const newID = String(maxID + 1).padStart(5, "0");
      return newID;
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Error generating appointment ID. Please try again.");
    }
  };

  const checkForClashes = async () => {
    try {
      const doctor = localStorage.getItem("Doctor");
      const appointments = await getAllAppointments(doctor);

      // Format the appointment time and date of the new appointment
      const appointmentDate = newAppointment.AppointmentDate;
      const appointmentTime = newAppointment.AppointmentTime;

      // Loop through existing appointments to check for a time clash
      for (const appt of appointments) {
        const existingDate = appt.AppointmentDate; // e.g., "2024-12-18T00:00:00.000Z"
        const existingTime = appt.AppointmentTime; // e.g., "08:30"

        const formattedExistingDate = formatDate(existingDate); 
        const formattedExistingTime = formatTime(existingTime);

        const formattedNewDate = formatDate(appointmentDate);
        const formattedNewTime = formatTime(appointmentTime);

        if (formattedExistingDate === formattedNewDate && formattedExistingTime === formattedNewTime) {
          toast.error("Appointment time clashes with an existing appointment.");
          return false; // Conflict found
        }
      }

      return true; // No conflicts
    } catch (error) {
      console.error("Error checking for conflicts:", error);
      toast.error("Error checking for appointment clashes.");
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);
    setIsCancelEnabled(false);

    const isClashFree = await checkForClashes();
    if (!isClashFree) {
      setIsSubmitting(false);
      setIsCancelEnabled(true);
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Failed to generate token. Please try again.");
        setIsSubmitting(false);
        setIsCancelEnabled(true);
        return;
      }

      const meetingId = await createMeeting();
      if (!meetingId) {
        toast.error("Failed to create meeting. Please try again.");
        setIsSubmitting(false);
        setIsCancelEnabled(true);
        return;
      }

      const appointmentID = await generateAppointmentID();
      const newAppointmentData = {
        ...newAppointment,
        ID: appointmentID,
        token: token,
        meetingId: meetingId,
        Doctor: localStorage.getItem("Doctor") || "",
      };

      const response = await AppointmentFormSubmit(newAppointmentData);

      if (response) {
        toast.success("Appointment saved successfully!");
        setTimeout(() => {
          setIsSubmitting(false);
          setIsCancelEnabled(true);
          close();
        }, 1000);
      } else {
        toast.error("Failed to save the appointment. Please try again.");
        setIsSubmitting(false);
        setIsCancelEnabled(true);
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
      setIsCancelEnabled(true);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md mr-52 mt-8">
      <div className="mb-4">
        <label className="block text-gray-700">
          Patient Name <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          name="Name"
          value={newAppointment.Name}
          onChange={handleChange}
          className="w-1/3 p-2 border rounded"
          required
          maxLength={30}
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">
          Patient ID <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          name="ID"
          value={newAppointment.ID}
          onChange={handleChange}
          className="w-smalll p-2 border rounded"
          required
          readOnly
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">
          Doctor <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          name="Doctor"
          value={newAppointment.Doctor}
          className="w-medium p-2 border rounded bg-gray-200"
          readOnly
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">
          Appointment Date <span className="text-red-600">*</span>
        </label>
        <input
          type="date"
          name="AppointmentDate"
          value={newAppointment.AppointmentDate}
          onChange={handleChange}
          className="w-small p-2 border rounded"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">
          Appointment Time <span className="text-red-600">*</span>
        </label>
        <input
          type="time"
          name="AppointmentTime"
          value={newAppointment.AppointmentTime}
          onChange={handleChange}
          className="w-small p-2 border rounded"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Checkup Status</label>
        <select
          name="Checkup_Status"
          value={newAppointment.Checkup_Status}
          onChange={(e) =>
            setNewAppointment({ ...newAppointment, Checkup_Status: e.target.value })
          }
          className="w-small p-2 border rounded"
          required
        >
          <option value="Pending">Pending</option>
        </select>
      </div>

      <div className="flex justify">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={!isCancelEnabled}
        >
          Save Appointment
        </button>
        <button
          type="button"
          onClick={isCancelEnabled ? close : null}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 ml-4"
          disabled={!isCancelEnabled}
        >
          Cancel
        </button>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </form>
  );
};

export default AppointmentForm;
