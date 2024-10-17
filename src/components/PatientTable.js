import React, { useEffect, useState } from "react"; // Import useEffect and useState
import diagnosis from "../assets/btn_diagnosis.svg";
import Button from "./Button";
import client from "../api/client"; // Import your axios client

const PatientTable = ({ addPatient }) => {
  const [patientsData, setPatientsData] = useState([]); // State to hold patient data

  useEffect(() => {
    const fetchPatientsData = async () => {
      try {
        const response = await client.get('/api/patients'); // Adjust the URL according to your API
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
            {patientsData.map((patient) => (
              <tr key={patient.ID} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{patient.ID}</td>
                <td className="py-2 px-4 border-b">{patient.Name}</td>
                <td className="py-2 px-4 border-b">{patient.Appointments_Time}</td>
                <td className="py-2 px-4 border-b">{patient.Appointments_Date}</td>
                <td className="py-2 px-4 border-b">{patient.Duration} Minutes</td>
                <td className={`py-2 px-4 border-b ${patient.Checkup_Status === "Pending" ? "text-yellow-600" : "text-green-600"}`}>
                  {patient.Checkup_Status}
                </td>
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
