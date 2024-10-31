import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client"; // Import your axios client
import { FaTrash } from "react-icons/fa"; // Import a trash icon from react-icons (or use your own)
import { deleteAppointment } from "../utils/auth"; // Import the new delete function

const AppointmentTable = ({ addAppointment }) => {
  const [appointments_data, setAppointmentsData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null); // State for error messages

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Fetch appointments including meeting ID
        const response = await client.get('/api/appointments');
        setAppointmentsData(response.data); // Update state with fetched data
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    fetchAppointments(); // Call the fetch function
  }, []); // Empty dependency array to run only on mount

  // Helper function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options); // Adjust options as needed
  };

  const handleDelete = async (patientId, appointmentDate) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm("Are you sure you want to delete this appointment?");
  
    if (!confirmDelete) {
      // If user cancels, exit the function
      return;
    }
  
    // Format appointmentDate to match the format in your database
    const formattedDate = new Date(appointmentDate).toISOString(); // Convert to ISO string
  
    const result = await deleteAppointment({ patientId, appointmentDate: formattedDate }); // Call the delete function
    if (result.success !== false) {
      // Update state to remove the deleted appointment
      setAppointmentsData(appointments_data.filter(appointment => 
        appointment.ID !== patientId || 
        new Date(appointment.AppointmentDate).toISOString() !== formattedDate // Ensure the date is compared correctly
      ));
      setErrorMessage(null); // Clear any previous error message
    } else {
      // Handle the error if deletion was not successful
      setErrorMessage("Failed to delete appointment. Please try again."); // Update state to show error message
      console.error("Failed to delete appointment:", result.error);
    }
  };

  return (
    <div className="w-full">
      {errorMessage && <div className="text-red-500">{errorMessage}</div>} {/* Show error message if any */}
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
              <th className="px-4 py-2">Actions</th> {/* New Actions column */}
            </tr>
          </thead>
          <tbody>
            {appointments_data.map((appointment) => (
              <tr key={appointment.ID}> {/* Use ID as the key */}
                <td className="border px-4 py-2 text-center">{appointment.ID}</td>
                <td className="border px-4 py-2 text-center">{appointment.Name}</td>
                <td className="border px-4 py-2 text-center">{formatDate(appointment.AppointmentDate)}</td>
                <td className="border px-4 py-2 text-center">{appointment.AppointmentTime}</td>
                <td className="border px-4 py-2 text-center">{appointment.Duration} Minutes</td>
                <td className="border px-4 py-2 text-center">
                  <Link to={`/emr/${appointment.ID}/${appointment.meetingId}`}>
                    <div className="bg-[#234ee8] text-white px-4 py-2 w-20 rounded-md shadow-lg mx-auto">
                      Join
                    </div>
                  </Link>
                </td>
                <td className="border px-4 py-2 text-center">
                  <button 
                    onClick={() => handleDelete(appointment.ID, appointment.AppointmentDate)} // Pass both ID and date
                    className="text-red-600"
                  >
                    <FaTrash /> {/* Trash icon */}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentTable;
