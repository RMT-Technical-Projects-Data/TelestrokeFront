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
    DeviceID: "1000",
    ID: "",
    AppointmentTime: "",
    AppointmentDate: "",
    Checkup_Status: "Pending",
    token: "",
    meetingId: "",
    Doctor: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const doctorName = localStorage.getItem("Doctor") || "Unknown Doctor";
    setNewAppointment((prev) => ({
      ...prev,
      Doctor: doctorName,
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear error for this field when changed
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }

    setNewAppointment((prev) => ({
      ...prev,
      [name]: value,
    }));
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
      // Fetch ALL appointments (without doctor filter) to ensure global uniqueness 
      // as confirmed by the database unique index on ID field
      const result = await getAllAppointments();
      let maxID = 0;
      let appointments = [];

      // Robustly handle various response formats
      if (Array.isArray(result)) {
        appointments = result;
      } else if (result && Array.isArray(result.data)) {
        appointments = result.data;
      } else if (result && Array.isArray(result.appointments)) {
        appointments = result.appointments;
      }

      if (appointments && appointments.length > 0) {
        maxID = Math.max(...appointments.map((appt) => parseInt(appt.ID, 10) || 0));
      }

      const newID = String(maxID + 1).padStart(5, "0");
      console.log(`Generated new Appointment ID: ${newID} (Max existing ID: ${maxID})`);
      return newID;
    } catch (error) {
      console.error("Error generating appointment ID:", error);
      toast.error("Error generating appointment ID. Please try again.");
    }
  };

  const checkForClashes = async () => {
    try {
      const doctor = localStorage.getItem("Doctor");
      const appointments = await getAllAppointments(doctor);
      const appointmentDate = newAppointment.AppointmentDate;
      const appointmentTime = newAppointment.AppointmentTime;

      // Convert new appointment time to minutes from start of day
      const [newH, newM] = appointmentTime.split(':').map(Number);
      const newTotalMinutes = newH * 60 + newM;

      for (const appt of appointments) {
        // Skip if it's the same appointment (shouldn't happen in form but good for consistency)
        if (appt.ID === newAppointment.ID) continue;

        const existingDate = appt.AppointmentDate;
        const existingTime = appt.AppointmentTime;

        // Check if on the same date
        if (formatDate(existingDate) === formatDate(appointmentDate)) {
          const [extH, extM] = existingTime.split(':').map(Number);
          const extTotalMinutes = extH * 60 + extM;

          const diff = Math.abs(newTotalMinutes - extTotalMinutes);
          if (diff < 30) {
            toast.error("Appointment must have at least a 30-minute buffer from existing appointments.");
            return false;
          }
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

    const newErrors = {};
    if (!newAppointment.DeviceID) newErrors.DeviceID = "Device ID is required";
    if (!newAppointment.AppointmentDate) newErrors.AppointmentDate = "Date is required";
    if (!newAppointment.AppointmentTime) newErrors.AppointmentTime = "Time is required";

    // Past date check (though input min should prevent this, extra safety)
    const todayStr = new Date().toISOString().split("T")[0];
    if (newAppointment.AppointmentDate && newAppointment.AppointmentDate < todayStr) {
      newErrors.AppointmentDate = "Please select today or a future date";
    }

    // Past time check for today
    if (newAppointment.AppointmentDate === todayStr && newAppointment.AppointmentTime) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const [selectedHours, selectedMinutes] = newAppointment.AppointmentTime.split(':').map(Number);
      
      if (selectedHours < currentHours || (selectedHours === currentHours && selectedMinutes < currentMinutes)) {
        newErrors.AppointmentTime = "Please select a future time for today";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      setIsCancelEnabled(true);
      return;
    }

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

      console.log("Submitting Appointment Data:", newAppointmentData);
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
      if (error.response && error.response.data && error.response.data.error) {
        toast.error(`Error: ${error.response.data.error}`);
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
      setIsSubmitting(false);
      setIsCancelEnabled(true);
    }
  };
  
  return (
    <div className="ts-modal-backdrop">
      <form onSubmit={handleSubmit} className="ts-modal ts-modal-wide">
        <div className="ts-modal-head">
          <h2>Create appointment</h2>
          <button type="button" className="ts-btn-icon" onClick={isCancelEnabled ? close : null} disabled={!isCancelEnabled}>
            ×
          </button>
        </div>
        <div className="ts-modal-body">
          <p className="ts-muted" style={{ marginTop: 0, marginBottom: "1rem" }}>
            Fill in the details below to schedule a remote exam.
          </p>
          <div className="ts-form-grid">
            <div className="ts-field">
              <label>Device ID</label>
              <input type="text" name="DeviceID" value={newAppointment.DeviceID} readOnly className="ts-input" />
            </div>
            <div className="ts-field">
              <label>Meeting ID</label>
              <input type="text" name="ID" value={newAppointment.ID} readOnly className="ts-input" required />
            </div>
            <div className="ts-field">
              <label>Doctor</label>
              <input type="text" name="Doctor" value={newAppointment.Doctor} readOnly className="ts-input" />
            </div>
            <div className="ts-field">
              <label>Checkup status</label>
              <input type="text" value="Pending" readOnly className="ts-input" />
            </div>
            <div className="ts-field">
              <label>Appointment date</label>
              <input
                type="date"
                name="AppointmentDate"
                value={newAppointment.AppointmentDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                className="ts-input"
              />
              {errors.AppointmentDate && <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "#dc2626", fontWeight: 600 }}>{errors.AppointmentDate}</p>}
            </div>
            <div className="ts-field">
              <label>Appointment time</label>
              <input
                type="time"
                name="AppointmentTime"
                value={newAppointment.AppointmentTime}
                onChange={handleChange}
                className="ts-input"
              />
              {errors.AppointmentTime && <p style={{ margin: "0.35rem 0 0", fontSize: "0.75rem", color: "#dc2626", fontWeight: 600 }}>{errors.AppointmentTime}</p>}
            </div>
          </div>
        </div>
        <div className="ts-modal-footer">
          <button type="button" onClick={isCancelEnabled ? close : null} className="ts-btn ts-btn-ghost" disabled={!isCancelEnabled}>
            Cancel
          </button>
          <button type="submit" className="ts-btn ts-btn-primary" disabled={!isCancelEnabled}>
            {isSubmitting ? "Saving..." : "Save Appointment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;
