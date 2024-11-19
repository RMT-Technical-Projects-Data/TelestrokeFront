import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client"; // Import your axios client
import { FaTrash, FaEdit } from "react-icons/fa"; // Import trash and edit icons from react-icons
import { deleteAppointment, UpdateAppointment } from "../utils/auth"; // Import delete and update functions

const AppointmentTable = ({ addAppointment }) => {
  const [appointments_data, setAppointmentsData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState({});
  const [updatedDate, setUpdatedDate] = useState('');
  const [updatedTime, setUpdatedTime] = useState('');
  const [updatedDuration, setUpdatedDuration] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await client.get('/api/appointments');
        setAppointmentsData(response.data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    fetchAppointments();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Handle invalid dates
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString(undefined, options);
  };

  const handleDelete = async (patientId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this appointment?");
    if (!confirmDelete) return;

    try {
      // Call the delete API with just the patientId
      const result = await deleteAppointment({ patientId });

      if (result?.success) {
        // Filter out the deleted appointment from the state
        setAppointmentsData(appointments_data.filter(appointment => appointment.ID !== patientId));
        setErrorMessage(null);
      } else {
        setErrorMessage("Failed to delete appointment. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
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

  const handleUpdate = async () => {
    try {
      const result = await UpdateAppointment({
        _id: currentAppointment._id, // Use _id to identify the appointment
        appointmentDate: updatedDate,
        appointmentTime: updatedTime,
        duration: updatedDuration,
      });

      if (result.success) {
        setAppointmentsData(appointments_data.map(appointment =>
          appointment._id === currentAppointment._id
            ? { ...appointment, AppointmentDate: updatedDate, AppointmentTime: updatedTime, Duration: updatedDuration }
            : appointment
        ));
        setIsEditing(false);
        setErrorMessage(null);
      } else {
        setErrorMessage("Failed to update appointment. Please try again.");
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      setErrorMessage("An error occurred. Please try again.");
    }
  };

  const openEditModal = (appointment) => {
    setCurrentAppointment(appointment);
    setUpdatedDate(appointment?.AppointmentDate ?? '');
    setUpdatedTime(appointment?.AppointmentTime ?? '');
    setUpdatedDuration(appointment?.Duration ?? '');
    setIsEditing(true);
  };

  const handleJoin = (appointmentId, patientName) => {
    // Store the patient name in local storage
    localStorage.setItem('patientName', patientName);
  };

  return (
    <div className="w-full">
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <button
          onClick={addAppointment}
          className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-blue-700 mr-48"
        >
          Add Appointment
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: '1275px' }} className="bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-200">
              <th className="px-4 py-2">Patient ID</th>
              <th className="px-4 py-2">Patient Name</th>
              <th className="px-4 py-2">Appointment Date</th>
              <th className="px-4 py-2">Appointment Time</th>
              <th className="px-4 py-2">Duration</th>
              <th className="px-4 py-2">Join</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments_data.map((appointment) => (
              <tr key={appointment?.ID ?? Math.random()}>
                <td className="border px-4 py-2 text-center">{String(appointment?.ID ?? '00000').padStart(5, '0')}</td>
                <td className="border px-4 py-2 text-center">{appointment?.Name ?? ''}</td>
                <td className="border px-4 py-2 text-center">{formatDate(appointment?.AppointmentDate)}</td>
                <td className="border px-4 py-2 text-center">{formatTime(appointment?.AppointmentTime)}</td>
                <td className="border px-4 py-2 text-center">{appointment?.Duration ?? ''} Minutes</td>
                <td className="border px-4 py-2 text-center">
                  <Link to={`/emr/${appointment?.ID}/${appointment?.meetingId}`}>
                    <div
                      className="bg-[#234ee8] text-white px-4 py-2 w-20 rounded-md shadow-lg mx-auto"
                      onClick={() => handleJoin(appointment.ID, appointment.Name)} // Store name on join button click
                    >
                      Join
                    </div>
                  </Link>
                </td>
                <td className="border px-4 py-2 text-center">
                  <button 
                    onClick={() => openEditModal(appointment)}
                    className="text-blue-600 mr-2"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleDelete(appointment?.ID)}
                    className="text-red-600"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg">
            <h2 className="text-xl mb-4">Update Appointment</h2>
            <label className="block mb-2">Date:</label>
            <input
              type="date"
              value={updatedDate.split('T')[0]}
              onChange={(e) => setUpdatedDate(e.target.value)}
              className="border border-gray-300 rounded-md p-2 mb-4 w-full"
            />
            <label className="block mb-2">Time:</label>
            <input
              type="time"
              value={updatedTime}
              onChange={(e) => setUpdatedTime(e.target.value)}
              className="border border-gray-300 rounded-md p-2 mb-4 w-full"
            />
            <div className="mb-4">
              <label className="block text-gray-700">Duration (Minutes):</label>
              <select
                name="Duration"
                value={updatedDuration}
                onChange={(e) => setUpdatedDuration(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 mt-1"
              >
                <option value="">Select Duration</option>
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="45">45 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="90">1 Hour 30 Minutes</option>
                <option value="120">2 Hours</option>
              </select>
            </div>
            <button
              onClick={handleUpdate}
              className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg"
            >
              Update Appointment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentTable;
