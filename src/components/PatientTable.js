import React, { useEffect, useState } from "react"; // Import useEffect and useState
import diagnosis from "../assets/btn_diagnosis.svg";
import Button from "./Button";
import client from "../api/client"; // Import your axios client

const PatientTable = ({ addPatient }) => {
  const [appointments_data, setPatientsData] = useState([]); // State to hold patient data

  useEffect(() => {
    const fetchPatientsData = async () => {
      try {
        const response = await client.get('/api/appointments'); // Adjust the URL according to your API
        setPatientsData(response.data); // Update state with fetched data
      } catch (error) {
        console.error("Error fetching patients data:", error);
      }
    };

    fetchPatientsData(); // Call the fetch function
  }, []); // Empty dependency array to run once on mount

  return (
    <>
      <div className="flex flex-row justify-between mb-2 mr-48">
        <p className="text-2xl font-semibold">Patients</p>
        <Button onClick={addPatient}>Add Patient</Button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: '1270px' }} className="bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-4 border-b font-bold">ID</th>
              <th className="py-2 px-4 border-b font-bold">Name</th>
              <th className="py-2 px-4 border-b font-bold">Appointments Time</th>
              <th className="py-2 px-4 border-b font-bold">Date</th>
              <th className="py-2 px-4 border-b font-bold">Duration</th>
              <th className="py-2 px-4 border-b font-bold">Status</th>
              {/* <th className="py-2 px-4 border-b font-bold">Diagnosis</th> */}
            </tr>
          </thead>
          <tbody>
            {appointments_data.map((appointments) => (
              <tr key={appointments.ID} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{appointments.PatientID}</td>
                <td className="py-2 px-4 border-b">{appointments.PatientName}</td>
                <td className="py-2 px-4 border-b">{appointments.AppointmentTime}</td>
                <td className="py-2 px-4 border-b">{appointments.AppointmentDate}</td>
                <td className="py-2 px-4 border-b">{appointments.Duration} Minutes</td>
                <td className="py-2 px-4 border-b">{appointments.Checkup_Status}</td>
                
                {/* <td className="py-2 px-4 border-b">
                  {patient.Diagnosis ? <img className="w-8 h-8" src={diagnosis} alt="Diagnosis Icon" /> : <div></div>}
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PatientTable;
