import React from "react";
import { Link } from "react-router-dom";

const AppointmentTable = ({ appointments_data, addAppointment }) => {
  return (
    <div className="w-full">
  <div className="flex justify-between items-center mb-6">
  <h1 className="text-2xl font-bold">Appointments</h1>
  <button
    onClick={addAppointment}
    className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-blue-700"
  >
    Add Appointment
  </button>
</div>
      <div style={{ overflowX: 'auto' }}>
      <table style={{ minWidth: '1300px' }} className="bg-white border border-gray-200">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2">ID</th>
            <th className="px-4 py-2">Patient Name</th> 
            <th className="px-4 py-2">Appointment Date</th>
            <th className="px-4 py-2">Appointment Time</th>
            <th className="px-4 py-2">Duration</th>
            <th className="px-4 py-2">Join</th> 
          </tr>
        </thead>
        <tbody>
          {appointments_data.map((appointment) => (
            <tr key={appointment.ID}>
              <td className="border px-4 py-2 text-center">{appointment.ID}</td>
              <td className="border px-4 py-2 text-center">{appointment.Patient_Name}</td> 
              <td className="border px-4 py-2 text-center">{appointment.Appointments_Date}</td>
              <td className="border px-4 py-2 text-center">{appointment.Appointments_Time}</td>
              <td className="border px-4 py-2 text-center">{appointment.Duration}</td>
              <td className="border px-4 py-2 text-center">
                <Link to={`/emr/${appointment.ID}/${"l036-n7zl-6txr"}`}>
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
