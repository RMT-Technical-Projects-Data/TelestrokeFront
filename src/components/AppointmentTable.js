import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";
import { FaTrash, FaEdit, FaChevronLeft, FaChevronRight } from "react-icons/fa"; 
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
  const itemsPerPage = 8;    

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
        <div className="mt-2 flex justify-end gap-2">
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
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-colors"
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
            ? { ...appointment, AppointmentDate: updatedDate, AppointmentTime: updatedTime }
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

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const filteredAppointmentsData = appointments_data.filter((appointment) =>
    appointment?.ID?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
    appointment?.Name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedData = filteredAppointmentsData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAppointmentsData.length / itemsPerPage);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  return (
    <div className="w-full px-4 py-6 pt-28">
      {errorMessage && <div className="text-red-500 font-semibold mb-4">{errorMessage}</div>}
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Appointments</h1>
        <button
          onClick={addAppointment}
          className="bg-[#3b4fdf] hover:bg-[#2f44c4] text-white px-4 sm:px-5 py-2 rounded-lg shadow-md transition-colors w-full sm:w-auto"
        >
          Add Appointment
        </button>
      </div>
      
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by Patient ID or Name"
          className="p-2 sm:p-3 w-full sm:w-1/2 md:w-1/3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>
      
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-indigo-50">
            <tr>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">Patient ID</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">Time</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">Join</th>
              <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((appointment) => (
                <tr key={appointment?.ID ?? Math.random()} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                    {String(appointment?.ID ?? '00000').padStart(5, '0')}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(appointment?.AppointmentDate)}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(appointment?.AppointmentTime)}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        appointment?.Checkup_Status === "Complete" ? "bg-green-500" : "bg-red-500"
                      }`} />
                      {appointment?.Checkup_Status}
                    </div>
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment?.meetingId ? (
                      <Link to={`/emr/${appointment?.ID}/${appointment?.meetingId}`}>
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs sm:text-sm transition-colors">
                          Join
                        </button>
                      </Link>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => openEditModal(appointment)}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors"
                        aria-label="Edit"
                      >
                        <FaEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(appointment?.ID)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        aria-label="Delete"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No appointments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4">Update Appointment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={updatedDate.split('T')[0]}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setUpdatedDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={updatedTime}
                  onChange={(e) => setUpdatedTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {filteredAppointmentsData.length > itemsPerPage && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center px-4 py-2 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#3b4fdf] text-white hover:bg-[#2f44c4]'} transition-colors`}
          >
            <FaChevronLeft className="mr-1" /> Previous
          </button>
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center px-4 py-2 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#3b4fdf] text-white hover:bg-[#2f44c4]'} transition-colors`}
          >
            Next <FaChevronRight className="ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AppointmentTable;
