import React, { useEffect, useState } from "react"; // Import useEffect and useState
import diagnosis from "../assets/btn_diagnosis.svg";
import Button from "./Button";
import client from "../api/client"; // Import your axios client

const PatientTable = ({ addPatient }) => {
  const [patients_data, setPatientsData] = useState([]); // State to hold patient data

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

    // // Helper function to format date
    // const formatDate = (dateString) => {
    //   const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    //   const date = new Date(dateString);
    //   return date.toLocaleDateString(undefined, options); // Adjust options as needed
    // };

  return (
    <>
      <div className="flex flex-row justify-between mb-2 mr-48">
        <p className="text-2xl font-bold">Patients</p>
        <Button onClick={addPatient}>Add Patient</Button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: '1270px' }} className="bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Date of Birth</th>             
              <th className="px-4 py-2">Gender</th>
              {/* <th className="py-2 px-4 border-b font-bold">Diagnosis</th> */}
            </tr>
          </thead>
          <tbody>
            {patients_data.map((patients) => (
              <tr key={patients.ID} className="hover:bg-gray-50">
                <td className="border px-4 py-2 text-left">{patients.ID}</td>
                <td className="border px-4 py-2 text-left">{patients.Name}</td>
                <td className="border px-4 py-2 text-left">{patients.DOB}</td>
                <td className="border px-4 py-2 text-left">{patients.Gender}</td>
                
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
