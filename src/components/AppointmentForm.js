import React, { useState, useEffect } from "react";
import { AppointmentFormSubmit } from "../utils/auth";
import { getAllAppointments } from "../utils/auth";
import { getToken, createMeeting } from "../API";
import { toast, ToastContainer } from "react-toastify"; // Import Toastify
// import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";



const AppointmentForm = ({ close }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelEnabled, setIsCancelEnabled] = useState(true);
  const [newAppointment, setNewAppointment] = useState({
    DeviceID: "", // Change Name to DeviceID
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
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-xl max-w-3xl w-full mx-4 space-y-8 border-4 border-[rgba(59, 130, 246, 0.5)]">
      
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600">Create Appointment</h1>
        <p className="text-gray-600 mt-2">Please fill out the details below to schedule an appointment.</p>
      </div>
  
      {/* Form Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Section */}
        <div className="space-y-6">
          <div>
            <label className="block text-gray-800 font-semibold">Device ID <span className="text-red-600">*</span></label>
            <input
              type="text"
              name="DeviceID"
              value={newAppointment.DeviceID}
              onChange={handleChange}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
              required
              pattern="\d{4}"
              title="Device ID must be exactly 4 digits"
              maxLength={4}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/\D/g, '');
              }}
            />
          </div>
  
          <div>
            <label className="block text-gray-800 font-semibold">Patient ID <span className="text-red-600">*</span></label>
            <input
              type="text"
              name="ID"
              value={newAppointment.ID}
              onChange={handleChange}
              className="w-full p-4 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              required
              readOnly
            />
          </div>
  
          <div>
            <label className="block text-gray-800 font-semibold">Doctor <span className="text-red-600">*</span></label>
            <input
              type="text"
              name="Doctor"
              value={newAppointment.Doctor}
              className="w-full p-4 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>
  
          <div>
            <label className="block text-gray-800 font-semibold">Checkup Status</label>
            <select
              name="Checkup_Status"
              value={newAppointment.Checkup_Status}
              onChange={(e) => setNewAppointment({ ...newAppointment, Checkup_Status: e.target.value })}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
              required
            >
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
  
        {/* Right Section */}
        <div className="space-y-6">
          <div>
            <label className="block text-gray-800 font-semibold">Appointment Date <span className="text-red-600">*</span></label>
            <input
              type="date"
              name="AppointmentDate"
              value={newAppointment.AppointmentDate}
              onChange={handleChange}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
              required
            />
          </div>
  
          <div>
            <label className="block text-gray-800 font-semibold">Appointment Time <span className="text-red-600">*</span></label>
            <input
              type="time"
              name="AppointmentTime"
              value={newAppointment.AppointmentTime}
              onChange={handleChange}
              className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
              required
            />
          </div>
        </div>
      </div>
  
      {/* Buttons */}
      <div className="flex justify-between gap-4 items-center mt-8">
        <button
          type="submit"
          className="bg-blue-600 text-white w-full sm:w-auto py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-400 transition-colors duration-200"
          disabled={!isCancelEnabled}
        >
          Save Appointment
        </button>
  
        <button
          type="button"
          onClick={isCancelEnabled ? close : null}
          className="bg-red-600 text-white w-full sm:w-auto py-3 px-6 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-400 transition-colors duration-200"
          disabled={!isCancelEnabled}
        >
          Cancel
        </button>
      </div>
  
      <ToastContainer position="top-right" autoClose={3000} />
    </form>
  </div>
  
  
  );
};

export default AppointmentForm;
