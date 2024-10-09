import React from "react";
import diagnosis from "../assets/btn_diagnosis.svg";
import Button from "./Button";

const PatientTable = ({ patients_data, addPatient }) => {
  return (
    <>
      <div className="flex flex-row justify-between mb-8">
        <p className="text-2xl font-semibold">Patients</p>
        <Button onClick={addPatient}>Add Patient</Button>
      </div>


      {/* <div className="flex flex-row items-center mb-8 gap-2">
  <p className="text-2xl font-semibold">Patients</p>
  <Button onClick={addPatient} className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-blue-700">
    Add Patient
  </Button>
</div> */}



      <div style={{ overflowX: 'auto' }}>
        <table style={{ minWidth: '1300px' }} className="bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="py-2 px-4 border-b font-bold">ID</th>
              <th className="py-2 px-4 border-b font-bold">Name</th>
              <th className="py-2 px-4 border-b font-bold">Appointments Time</th>
              <th className="py-2 px-4 border-b font-bold">Duration</th>
              <th className="py-2 px-4 border-b font-bold">Checkup Status</th>
              <th className="py-2 px-4 border-b font-bold">Diagnosis</th>
            </tr>
          </thead>
          <tbody>
            {patients_data.map((patient) => (
              <tr key={patient.ID} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{patient.ID}</td>
                <td className="py-2 px-4 border-b">{patient.Name}</td>
                <td className="py-2 px-4 border-b">{patient.Appointments_Time}</td>
                <td className="py-2 px-4 border-b">{patient.Duration}</td>
                <td className={`py-2 px-4 border-b ${patient.Checkup_Status === "Pending" ? "text-yellow-600" : "text-green-600"}`}>
                  {patient.Checkup_Status}
                </td>
                <td className="py-2 px-4 border-b">
                  {patient.Diagnosis ? <img className="w-8 h-8" src={diagnosis} alt="Diagnosis Icon" /> : <div></div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default PatientTable;
