import React, { useState } from "react";
import Button from "./Button";
const PatientForm = ({ savePatient , close}) => {
  const [patientData, setPatientData] = useState({
    Name: " ",
    Appointments_Time: "4:05",
    Duration: "30 mins",
    Checkup_Status: "Complete",
    Diagnosis: true,
  });
  const back=()=>{
    setPatientData({ ...patientData, Name: "" });
    setPatientData({...patientData,Appointments_Time: "",});
    setPatientData({...patientData,Duration: ""});
    setPatientData({...patientData,Checkup_Status: ""});
    close()  
  }
  return (
    <>
      <div className="flex flex-row justify-between mb-8">
        <p className="text-2xl font-semibold">Patients</p>
        <div className="flex flex-row gap-3">
        <Button onClick={()=>{back()}}>
          Back
        </Button>
        <Button onClick={() => { savePatient(patientData);}}>
          Save Patient
        </Button>
        </div>
        </div>
      <div className="flex flex-col gap-5  p-3 bg-[#F6F6F6]">               
        <div>                                                                
          <p className="font-bold text-lg">Add Patient's Information</p> 
          <p> Fill the Information with patient data</p> 
        </div>
        <div className="flex flex-row">
          <form className="flex flex-col gap-8" onSubmit={()=>savePatient(patientData)}>
            <div>
              <p className="mb-2 text-sm"> Name: </p>
              <input
                type="text"
                className="border"
                onChange={(event) => {
                  setPatientData({ ...patientData, Name: event.target.value });
                }}/>
            </div>
            <div>
              <p className="mb-2 text-sm"> Appointments Time: </p>
              <input
                type="text"
                className="border"
                onChange={(event) => {
                  setPatientData({
                    ...patientData,
                    Appointments_Time: event.target.value,
                  });
                }}
              />
            </div>
            <div>
              <p className="mb-2 text-sm"> Duration: </p>
              <input
                type="text"
                className="border "
                onChange={(event) => {
                  setPatientData({
                    ...patientData,
                    Duration: event.target.value,
                  });
                }}

              />
            </div>
            <div>
              <p className="mb-2 text-sm"> Checkup Status: </p>
              <select
                onChange={(event) => {
                  setPatientData({
                    ...patientData,
                    Checkup_Status: event.target.value,
                  });
                }}
              >
                <option value="Pending">Pending</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
            <div>
              <p className="mb-2 text-sm"> Diagnosis: </p>
              <input type="text" className="border " />
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default PatientForm;
