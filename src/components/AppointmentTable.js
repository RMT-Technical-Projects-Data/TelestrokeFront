import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";
import { FaTrash, FaEdit } from "react-icons/fa"; 
import { deleteAppointment, UpdateAppointment, getAllAppointments } from "../utils/auth"; 

const AppointmentTable = ({ addAppointment }) => {
  const [appointments_data, setAppointmentsData] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState({});
  const [updatedDate, setUpdatedDate] = useState('');
  const [updatedTime, setUpdatedTime] = useState('');
  const [updatedCheckupStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Items per page

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const Doctor = localStorage.getItem('Doctor');
        const appointmentsData = await getAllAppointments(Doctor);
        setAppointmentsData(appointmentsData);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Failed to load appointments!");
      }
    };
    fetchAppointments();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; 
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
                  toast.dismiss(); 
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
        _id: currentAppointment._id, 
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

  // Function to handle search input
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value); 
  };

  // Filter appointments_data based on the search query
  const filteredAppointmentsData = appointments_data.filter((appointment) =>
    appointment?.ID?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
    appointment?.Name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginated Data
  const paginatedData = filteredAppointmentsData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle Page Change
  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
  };

  // Calculate the total number of pages
  const totalPages = Math.ceil(filteredAppointmentsData.length / itemsPerPage);

  return (
    <div className="w-full px-4 py-6">
      {errorMessage && <div className="text-red-500 font-semibold">{errorMessage}</div>}
      <ToastContainer position="top-right" autoClose={3000} /> 


      <div className="flex justify-between items-center mb-6 mt-28">
        <h1 className="text-3xl font-bold text-black-600">Appointments</h1>
        <button
          onClick={addAppointment}
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500 transition-all"
        >
          Add Appointment
        </button>
      </div>
      
     
      <div className="mb-6 flex justify-left">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by Patient ID or Name"
          className="p-3 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/4 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150"
        />
      </div>
      
    
      <div style={{ overflowX: 'auto' }}>
        <table className="bg-white border border-gray-200 min-w-full shadow-lg rounded-lg">
          <thead className="bg-indigo-50">
            <tr>
              <th className="px-6 py-4 text-center text-gray-700 font-medium">Patient ID</th>
              <th className="px-6 py-4 text-center text-gray-700 font-medium">Appointment Date</th>
              <th className="px-6 py-4 text-center text-gray-700 font-medium">Appointment Time</th>
              <th className="px-6 py-4 text-center text-gray-700 font-medium">Checkup Status</th>
              <th className="px-6 py-4 text-center text-gray-700 font-medium">Join</th>
              <th className="px-6 py-4 text-center text-gray-700 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((appointment) => (
              <tr key={appointment?.ID ?? Math.random()} className="border-t border-gray-300 hover:bg-indigo-50 transition duration-150">
                <td className="px-6 py-4 text-center">{String(appointment?.ID ?? '00000').padStart(5, '0')}</td>
                <td className="px-6 py-4 text-center">{formatDate(appointment?.AppointmentDate)}</td>
                <td className="px-6 py-4 text-center">{formatTime(appointment?.AppointmentTime)}</td>
                <td className="px-6 py-4 text-center">
                  <div className={`flex justify-center items-center space-x-2`}>
                    {appointment?.Checkup_Status === "Complete" ? (
                      <div className="w-4 h-4 bg-green-500 rounded-full" />
                    ) : appointment?.Checkup_Status === "Pending" ? (
                      <div className="w-4 h-4 bg-red-500 rounded-full" />
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <Link to={`/emr/${appointment?.ID}/${appointment?.meetingId}`}>
                    <div
                      className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2 rounded-lg mx-auto shadow-md transition-all"
                    >
                      Join
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => openEditModal(appointment)}
                    className="text-indigo-600 hover:text-indigo-800 transition duration-150"
                  >
                    <FaEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(appointment?.ID)}
                    className="text-red-600 hover:text-red-800 transition duration-150"
                  >
                    <FaTrash size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isEditing && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-md shadow-lg w-full sm:w-3/4 md:w-1/2 lg:w-1/3 xl:w-1/3">
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
              className="bg-[#3b4fdf] text-white hover:bg-[#2f44c4] px-4 py-2 rounded-md mr-2"
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

      <div className="flex justify-center mt-4">
        <button
           disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md mr-2 disabled:bg-gray-400"
        >
          Prev
        </button>
        <span className="text-gray-700 px-4 py-2">{currentPage} of {totalPages}</span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md ml-2 disabled:bg-gray-400"
        >
          Next
        </button>
      </div>
    </div>

    
  );
};

export default AppointmentTable;
