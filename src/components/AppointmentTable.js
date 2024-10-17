import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import client from "../api/client"; // Import your axios client

const AppointmentTable = ({ addAppointment }) => {
  const [appointments_data, setAppointmentsData] = useState([]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await client.get('/api/appointments'); // Fetch appointments
        setAppointmentsData(response.data); // Update state with fetched data
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    fetchAppointments(); // Call the fetch function
  }, []); // Empty dependency array to run only on mount

  return (
    <div className="w-full">
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
            </tr>
          </thead>
          <tbody>
            {appointments_data.map((appointment) => (
              <tr key={appointment.PatientID}> {/* Use PatientID as the key */}
                <td className="border px-4 py-2 text-center">{appointment.PatientID}</td>
                <td className="border px-4 py-2 text-center">{appointment.PatientName}</td>
                <td className="border px-4 py-2 text-center">{appointment.AppointmentDate}</td>
                <td className="border px-4 py-2 text-center">{appointment.AppointmentTime}</td>
                <td className="border px-4 py-2 text-center">{appointment.Duration}</td>
                <td className="border px-4 py-2 text-center">
                  <Link to={`/emr/${appointment.PatientID}/${"l036-n7zl-6txr"}`}>
                    <div className="bg-[#234ee8] text-white px-4 py-2 w-20 rounded-md shadow-lg mx-auto">
                      Join
                    </div>
                  </Link>
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
