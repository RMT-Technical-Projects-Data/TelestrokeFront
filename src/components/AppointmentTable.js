import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify"; 
import "react-toastify/dist/ReactToastify.css";
import { FaTrash, FaEdit, FaChevronLeft, FaChevronRight, FaSort, FaSortUp, FaSortDown, FaPhoneAlt } from "react-icons/fa"; 
import { Search } from "lucide-react"; 
import { deleteAppointment, UpdateAppointment, getAllAppointments } from "../utils/auth"; 

const AppointmentTable = ({ addAppointment, hideHeader = false }) => {
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

  const handleDelete = (appointment) => {
    setPatientToDelete(appointment);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!patientToDelete) return;
    const targetID = typeof patientToDelete === 'object' ? patientToDelete.ID : patientToDelete;
    const targetMongoId = typeof patientToDelete === 'object' ? patientToDelete._id : null;

    try {
      const result = await deleteAppointment({ patientId: targetID, _id: targetMongoId });
      if (result?.success) {
        console.log("Meeting deleted successfully and removed from backend:", { patientId: targetID, _id: targetMongoId });
        setAppointmentsData(
          appointments_data.filter((appointment) => {
            if (targetMongoId && appointment._id) {
              return appointment._id !== targetMongoId;
            }
            return appointment.ID !== targetID;
          })
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
    <div className="ts-panel">
      {errorMessage && <div className="ts-alert ts-alert-err" style={{ margin: "0.85rem 1.1rem 0" }}>{errorMessage}</div>}

      {!hideHeader && (
        <div className="ts-panel-head">
          <h3 className="ts-panel-title">Appointments</h3>
          <button type="button" onClick={addAppointment} className="ts-btn ts-btn-primary">
            Add Appointment
          </button>
        </div>
      )}

      <div className="ts-toolbar">
        <div className="ts-search-wrap">
          <Search size={16} />
          <input
            type="search"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by Meeting ID"
            className="ts-search"
          />
        </div>
        <span className="ts-panel-meta">{filteredAppointmentsData.length} shown</span>
      </div>

      <div className="ts-table-wrap">
        <table className="ts-table">
          <thead>
            <tr>
              <th
                className="cursor-pointer"
                onClick={() => handleSort('ID')}
              >
                <div className="flex items-center space-x-1">
                  <span>Meeting ID</span>
                  {sortConfig.key === 'ID' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort className="text-gray-400" />}
                </div>
              </th>
              <th className="cursor-pointer" onClick={() => handleSort('DeviceID')}>
                <div className="flex items-center space-x-1">
                  <span>Device ID</span>
                  {sortConfig.key === 'DeviceID' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort className="text-gray-400" />}
                </div>
              </th>
              <th className="cursor-pointer" onClick={() => handleSort('AppointmentDate')}>
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  {sortConfig.key === 'AppointmentDate' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort className="text-gray-400" />}
                </div>
              </th>
              <th className="cursor-pointer" onClick={() => handleSort('AppointmentTime')}>
                <div className="flex items-center space-x-1">
                  <span>Time</span>
                  {sortConfig.key === 'AppointmentTime' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort className="text-gray-400" />}
                </div>
              </th>
              <th className="cursor-pointer" onClick={() => handleSort('Checkup_Status')}>
                <div className="flex items-center space-x-1">
                  <span>Status</span>
                  {sortConfig.key === 'Checkup_Status' ? (
                    sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />
                  ) : <FaSort className="text-gray-400" />}
                </div>
              </th>
              <th className="ts-col-center">Join</th>
              <th className="ts-col-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((appointment) => (
                <tr key={appointment?.ID ?? Math.random()}>
                  <td>
                    <div className="ts-user-cell">
                      <div className="ts-avatar">{String(appointment?.ID ?? "?").slice(-2)}</div>
                      <div><strong>{String(appointment?.ID ?? '00000').padStart(5, '0')}</strong></div>
                    </div>
                  </td>
                  <td className="ts-muted">{appointment?.DeviceID ?? "----"}</td>
                  <td>{formatDate(appointment?.AppointmentDate)}</td>
                  <td>{formatTime(appointment?.AppointmentTime)}</td>
                  <td>
                    <span className={`ts-badge ${appointment?.Checkup_Status === "Complete" ? "ts-badge-ok" : "ts-badge-warn"}`}>
                      {appointment?.Checkup_Status}
                    </span>
                  </td>
                  <td className="ts-col-center">
                    {appointment?.meetingId && appointment?.Checkup_Status !== "Complete" ? (
                      <Link to={`/emr/${appointment?.ID}/${appointment?.meetingId}`} className="ts-btn ts-btn-primary">
                        <FaPhoneAlt /> Join
                      </Link>
                    ) : (
                      <span className="ts-muted">N/A</span>
                    )}
                  </td>
                  <td className="ts-col-center">
                    <div className="ts-actions">
                      <button
                        onClick={() => openEditModal(appointment)}
                        className="ts-btn-icon"
                        disabled={appointment?.Checkup_Status === "Complete"}
                        aria-label="Edit"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(appointment)}
                        className="ts-btn-icon"
                        aria-label="Delete"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="ts-empty">
                  No appointments found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <div className="ts-modal-backdrop">
          <div className="ts-modal">
            <div className="ts-modal-head">
              <h2>Update appointment</h2>
              <button type="button" className="ts-btn-icon" onClick={() => setIsEditing(false)}>×</button>
            </div>
            <div className="ts-modal-body">
              <div className="ts-field">
                <label>Date</label>
                <input
                  type="date"
                  value={updatedDate.split('T')[0]}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setUpdatedDate(e.target.value)}
                  className="ts-input"
                />
              </div>
              <div className="ts-field">
                <label>Time</label>
                <input
                  type="time"
                  value={updatedTime}
                  onChange={(e) => setUpdatedTime(e.target.value)}
                  className="ts-input"
                />
              </div>
              <div className="ts-modal-actions">
                <button type="button" onClick={() => setIsEditing(false)} className="ts-btn ts-btn-ghost">
                  Cancel
                </button>
                <button type="button" onClick={handleUpdate} className="ts-btn ts-btn-primary">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {filteredAppointmentsData.length > itemsPerPage && (
        <div className="ts-toolbar" style={{ borderTop: "1px solid var(--ts-border)", borderBottom: "none" }}>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="ts-btn ts-btn-ghost"
          >
            <FaChevronLeft /> Previous
          </button>
          <div className="flex items-center gap-2 text-sm ts-muted">
            <span>Page</span>
            <input
              type="text"
              value={pageInputValue}
              onChange={(e) => setPageInputValue(e.target.value)}
              onBlur={handlePageInputBlur}
              onKeyDown={handlePageInputKeyDown}
              className="ts-input"
              style={{ width: "3.5rem", textAlign: "center" }}
              aria-label="Page number"
            />
            <span>of {totalPages}</span>
          </div>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="ts-btn ts-btn-ghost"
          >
            Next <FaChevronRight />
          </button>
        </div>
      )}
      {isDeleteModalOpen && (
        <div className="ts-modal-backdrop">
          <div className="ts-modal">
            <div className="ts-modal-head">
              <h2>Confirm deletion</h2>
              <button type="button" className="ts-btn-icon" onClick={() => setIsDeleteModalOpen(false)}>×</button>
            </div>
            <div className="ts-modal-body">
              <p className="ts-muted" style={{ margin: 0 }}>
                Are you sure you want to delete this appointment? This action cannot be undone.
              </p>
              <div className="ts-modal-actions">
                <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="ts-btn ts-btn-ghost">
                  Cancel
                </button>
                <button type="button" onClick={confirmDelete} className="ts-btn ts-btn-danger">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentTable;
