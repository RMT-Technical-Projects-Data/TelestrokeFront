import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";
import { FaTrash, FaEdit, FaChevronLeft, FaChevronRight, FaSort, FaSortUp, FaSortDown, FaPhoneAlt } from "react-icons/fa"; 
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInputValue, setPageInputValue] = useState('1');
  const itemsPerPage = 8;    

  const [sortConfig, setSortConfig] = useState({ key: 'AppointmentDate', direction: 'desc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const Doctor = localStorage.getItem('Doctor');
        const result = await getAllAppointments(Doctor);
        if (Array.isArray(result)) {
          setAppointmentsData(result);
        } else if (result && Array.isArray(result.data)) {
          setAppointmentsData(result.data);
        } else if (result && Array.isArray(result.appointments)) {
          setAppointmentsData(result.appointments);
        } else {
          setAppointmentsData([]);
          console.log("No valid appointment array returned:", result);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Failed to load appointments!");
        setAppointmentsData([]);
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

  const handleDelete = (patientId) => {
    setPatientToDelete(patientId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      const result = await deleteAppointment({ patientId: patientToDelete });
      if (result?.success) {
        setAppointmentsData(
          appointments_data.filter(
            (appointment) => appointment.ID !== patientToDelete
          )
        );
        toast.success("Appointment successfully deleted!");
      } else {
        toast.error("Failed to delete appointment. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("An error occurred while deleting the appointment.");
    } finally {
      setIsDeleteModalOpen(false);
      setPatientToDelete(null);
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
    // Buffer validation
    const [newH, newM] = updatedTime.split(':').map(Number);
    const newTotalMinutes = newH * 60 + newM;
    const formattedNewDate = formatDate(updatedDate);

    for (const appt of safeData) {
      if (appt._id === currentAppointment._id) continue;

      if (formatDate(appt.AppointmentDate) === formattedNewDate) {
        const [extH, extM] = appt.AppointmentTime.split(':').map(Number);
        const extTotalMinutes = extH * 60 + extM;

        const diff = Math.abs(newTotalMinutes - extTotalMinutes);
        if (diff < 30) {
          toast.error("Appointment must have at least a 30-minute buffer from existing appointments.");
          return;
        }
      }
    }

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

  const safeData = Array.isArray(appointments_data) ? appointments_data : [];
  const filteredAppointmentsData = safeData.filter((appointment) =>
    appointment?.ID?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
    appointment?.Name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredAppointmentsData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Numerical comparison for ID and DeviceID
        if (sortConfig.key === 'ID' || sortConfig.key === 'DeviceID') {
          aValue = parseInt(aValue, 10) || 0;
          bValue = parseInt(bValue, 10) || 0;
        }
        
        // Date comparison
        if (sortConfig.key === 'AppointmentDate') {
          aValue = new Date(aValue).getTime() || 0;
          bValue = new Date(bValue).getTime() || 0;
        }

        // Time comparison (simple string comparison for "HH:mm")
        if (sortConfig.key === 'AppointmentTime') {
          aValue = aValue || "";
          bValue = bValue || "";
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredAppointmentsData, sortConfig]);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredAppointmentsData.length / itemsPerPage);

  const handlePageChange = (pageNum) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  // Automatically adjust currentPage if it exceeds totalPages (e.g., after deletion)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    } else if (totalPages === 0 && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Sync pageInputValue with currentPage
  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  const handlePageInputBlur = () => {
    const pageNum = parseInt(pageInputValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    } else {
      setPageInputValue(currentPage.toString());
    }
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      handlePageInputBlur();
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
          placeholder="Search by Meeting ID"
          className="p-2 sm:p-3 w-full sm:w-1/2 md:w-1/3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>
      
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-indigo-50">
            <tr>
              <th 
                className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors"
                onClick={() => handleSort('ID')}
              >
                <div className="flex items-center space-x-1">
                  <span>Meeting ID</span>
                  {sortConfig.key === 'ID' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort className="text-gray-400" />}
                </div>
              </th>
              <th 
                className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors"
                onClick={() => handleSort('DeviceID')}
              >
                <div className="flex items-center space-x-1">
                  <span>Device ID</span>
                  {sortConfig.key === 'DeviceID' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort className="text-gray-400" />}
                </div>
              </th>
              <th 
                className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors"
                onClick={() => handleSort('AppointmentDate')}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {sortConfig.key === 'AppointmentDate' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort className="text-gray-400" />}
                </div>
              </th>
              <th 
                className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors"
                onClick={() => handleSort('AppointmentTime')}
              >
                <div className="flex items-center space-x-1">
                  <span>Time</span>
                  {sortConfig.key === 'AppointmentTime' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort className="text-gray-400" />}
                </div>
              </th>
              <th 
                className="px-4 py-3 sm:px-6 sm:py-4 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-indigo-100 transition-colors"
                onClick={() => handleSort('Checkup_Status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {sortConfig.key === 'Checkup_Status' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort className="text-gray-400" />}
                </div>
              </th>
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
                  <td className="px-4 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {appointment?.DeviceID ?? "----"}
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
                    {appointment?.meetingId && appointment?.Checkup_Status !== "Complete" ? (
                      <Link to={`/emr/${appointment?.ID}/${appointment?.meetingId}`}>
                        <button className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs sm:text-sm transition-colors">
                          <FaPhoneAlt className="mr-2" /> Join
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
                        className={`transition-colors ${
                          appointment?.Checkup_Status === "Complete" 
                            ? "text-gray-300 cursor-not-allowed" 
                            : "text-indigo-600 hover:text-indigo-800"
                        }`}
                        disabled={appointment?.Checkup_Status === "Complete"}
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
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
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
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center px-4 py-2 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#3b4fdf] text-white hover:bg-[#2f44c4]'} transition-colors w-full sm:w-auto justify-center`}
          >
            <FaChevronLeft className="mr-1" /> Previous
          </button>
          
          <div className="flex items-center gap-2 text-sm text-gray-700 order-3 sm:order-none">
            <span>Page</span>
            <input
              type="text"
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              className="w-12 p-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
              aria-label="Page number"
            />
            <span>of {totalPages}</span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center px-4 py-2 rounded-md ${currentPage === totalPages ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#3b4fdf] text-white hover:bg-[#2f44c4]'} transition-colors w-full sm:w-auto justify-center`}
          >
            Next <FaChevronRight className="ml-1" />
          </button>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6 font-medium">
              Are you sure you want to delete this appointment? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentTable;
