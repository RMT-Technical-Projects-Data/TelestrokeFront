import React, { useState, useEffect } from "react";
import { AppointmentFormSubmit } from "../utils/auth";
import { getAllAppointments } from "../utils/auth";
import { getToken, createMeeting } from "../API";
import { toast, ToastContainer } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";

const AppointmentForm = ({ close }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelEnabled, setIsCancelEnabled] = useState(true);
  const [newAppointment, setNewAppointment] = useState({
    DeviceID: "",
    ID: "",
    AppointmentTime: "",
    AppointmentDate: "",
    Checkup_Status: "Pending",
    token: "",
    meetingId: "",
    Doctor: "",
  });

  useEffect(() => {
    const doctorName = localStorage.getItem("Doctor") || "Unknown Doctor";
    setNewAppointment((prev) => ({
      ...prev,
      Doctor: doctorName,
    }));
  }, []);

  const handleChange = (e) => {
    const today = new Date().toISOString().split("T")[0];
    const { name, value } = e.target;

    if (name === "AppointmentDate" && value < today) {
      toast.error("Please select today or a future date!");
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
    if (isNaN(date.getTime())) return '';
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
      const appointmentDate = newAppointment.AppointmentDate;
      const appointmentTime = newAppointment.AppointmentTime;

      for (const appt of appointments) {
        const existingDate = appt.AppointmentDate;
        const existingTime = appt.AppointmentTime;

        const formattedExistingDate = formatDate(existingDate); 
        const formattedExistingTime = formatTime(existingTime);
        const formattedNewDate = formatDate(appointmentDate);
        const formattedNewTime = formatTime(appointmentTime);

        if (formattedExistingDate === formattedNewDate && formattedExistingTime === formattedNewTime) {
          toast.error("Appointment time clashes with an existing appointment.");
          return false;
        }
      }

      return true;
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <form 
        onSubmit={handleSubmit} 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header Section */}
        <div className="bg-blue-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Create Appointment</h1>
            {/* <button
              type="button"
              onClick={isCancelEnabled ? close : null}
              className="text-white hover:text-gray-200 text-2xl"
              disabled={!isCancelEnabled}
            >
              &times;
            </button> */}
          </div>
          <p className="text-blue-100 mt-1">Please fill out the details below to schedule an appointment.</p>
        </div>

        {/* Form Section */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Device ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="DeviceID"
                  value={newAppointment.DeviceID}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
                <label className="block text-gray-700 font-medium mb-2">
                  Patient ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ID"
                  value={newAppointment.ID}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  required
                  readOnly
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="Doctor"
                  value={newAppointment.Doctor}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Checkup Status
                </label>
                <select
                  name="Checkup_Status"
                  value={newAppointment.Checkup_Status}
                  onChange={(e) => setNewAppointment({ ...newAppointment, Checkup_Status: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Appointment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="AppointmentDate"
                value={newAppointment.AppointmentDate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Appointment Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="AppointmentTime"
                value={newAppointment.AppointmentTime}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={isCancelEnabled ? close : null}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isCancelEnabled 
                ? "bg-gray-300 hover:bg-gray-400 text-gray-800"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            disabled={!isCancelEnabled}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isCancelEnabled 
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-400 text-white cursor-not-allowed"
            }`}
            disabled={!isCancelEnabled}
          >
            {isSubmitting ? "Saving..." : "Save Appointment"}
          </button>
        </div>
      </form>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AppointmentForm;
