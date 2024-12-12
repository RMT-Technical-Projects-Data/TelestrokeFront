import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify"; // Import Toastify
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS
// import client from "../api/client"; // Import your axios client
import { FaTrash, FaEdit } from "react-icons/fa"; // Import trash and edit icons from react-icons
import { deleteAppointment, UpdateAppointment, getAllAppointments  } from "../utils/auth"; // Import delete and update functions

const AppointmentTable = ({ addAppointment }) => {
  const [appointments_data, setAppointmentsData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState({});
  const [updatedDate, setUpdatedDate] = useState('');
  const [updatedTime, setUpdatedTime] = useState('');
  const [updatedCheckupStatus] = useState('');

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Get the doctor's name from localStorage
        const Doctor = localStorage.getItem('Doctor');  // Assuming 'Doctor' is stored in localStorage
        
        // Call the getAllAppointments function with the Doctor parameter
        const appointmentsData = await getAllAppointments(Doctor);
        
        // Set the appointments data in state
        setAppointmentsData(appointmentsData);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Failed to load appointments!");
      }
    };
  
    fetchAppointments();
  }, []);  // Empty dependency array ensures this runs on component mount
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Handle invalid dates
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return date.toLocaleDateString(undefined, options);
  };

  const handleDelete = async (patientId) => {
    toast.info(
      <>
        <div>Are you sure you want to delete this appointment?</div>
        <div className="mt-2 flex justify-end">
          <button
            onClick={async () => {
              try {
                const result = await deleteAppointment({ patientId });

                if (result?.success) {
                  setAppointmentsData(
                    appointments_data.filter(
                      (appointment) => appointment.ID !== patientId
                    )
                  );
                  toast.dismiss(); // Close the confirmation toast
                  toast.success("Appointment successfully deleted!");
                } else {
                  toast.error("Failed to delete appointment. Please try again.");
                }
              } catch (error) {
                console.error("Error deleting appointment:", error);
                toast.error("An error occurred while deleting the appointment.");
              }
            }}
            className="bg-red-600 text-white px-3 py-1 rounded mr-2"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="bg-gray-600 text-white px-3 py-1 rounded"
          >
            Cancel
          </button>
        </div>
      </>,
      { autoClose: false }
    );
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
        checkupStatus: updatedCheckupStatus,
      });

      if (result.success) {
        setAppointmentsData(appointments_data.map(appointment =>
          appointment._id === currentAppointment._id
            ? { ...appointment, AppointmentDate: updatedDate, AppointmentTime: updatedTime,  }
            : appointment
        ));
        setIsEditing(false);
        setErrorMessage(null);
        toast.success("Appointment successfully updated!");
      } else {
        setErrorMessage("Failed to update appointment. Please try again.");
        toast.error("Failed to update appointment.");
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      setErrorMessage("An error occurred. Please try again.");
      toast.error("An error occurred while updating the appointment.");
    }
  };

  const openEditModal = (appointment) => {
    setCurrentAppointment(appointment);
    setUpdatedDate(appointment?.AppointmentDate ?? '');
    setUpdatedTime(appointment?.AppointmentTime ?? '');
    setIsEditing(true);
  };

  const handleJoin = (appointmentId, patientName) => {
    localStorage.setItem('patientName', patientName);
    toast.info(`Joining appointment with ${patientName}`);
  };

  return (
    <div className="w-full">
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}
      <ToastContainer position="top-right" autoClose={3000} /> {/* Toast Container */}
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
              <th className="px-4 py-2">Checkup Status</th>
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
                <td className="border px-4 py-2 text-center">{appointment?.Checkup_Status ?? 'Pending'}</td>
                <td className="border px-4 py-2 text-center">
                  <Link to={`/emr/${appointment?.ID}/${appointment?.meetingId}`}>
                    <div
                      className="bg-[#234ee8] text-white px-4 py-2 w-20 rounded-md shadow-lg mx-auto"
                      onClick={() => handleJoin(appointment.ID, appointment.Name)}
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
              min={new Date().toISOString().split('T')[0]} // Set the minimum date to today
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


            <div className="flex justify-end">
              <button 
                onClick={handleUpdate} 
                className="bg-blue-600 text-white px-4 py-2 rounded-md mr-2"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentTable;
