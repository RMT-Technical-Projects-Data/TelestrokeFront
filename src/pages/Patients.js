import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import NavBar from "../components/NavBar";
import PatientTable from "../components/PatientTable";
import PatientForm from "../components/PatientForm";
const PatientPage = () => {
  const [patients_data,setPatientData] = useState([
    {
      ID: "1",
      Name: "Mr Collins",
      Appointments_Time: "4:05",
      Duration: "30 mins",
      Checkup_Status: "Complete",
      Diagnosis: true,
    },
    {
      ID: "2",
      Name: "Mr. Daniel",
      Appointments_Time: "4:40",
      Duration: "15 mins",
      Checkup_Status: "Pending",
      Diagnosis: false,
    },
    {
      ID: "3",
      Name: "Mr. Hanry",
      Appointments_Time: "5:20",
      Duration: "10 mins",
      Checkup_Status: "Pending",
      Diagnosis: false,
    },
  ]);

  const [showForm,setShowForm]=useState(false)

  const addPatient=()=>{
    setShowForm(!showForm)
  }

  const savePatient=(patient)=>{
    console.log("savePatient: ")
    console.log(patient)
    setPatientData([...patients_data,patient])
    setShowForm(!showForm)
  }

  const close=()=>{
    setShowForm(!showForm)
  }
  const val= localStorage.getItem("id")

  return (
    <div>
      <NavBar />
      <div className="flex flex-row justify-between gap-2  mb-28">
        <div className="basis-[05%]">
        <Sidebar page="PATIENTS"/>
        </div>
        <div className="basis-[80%] flex flex-col h-fit w-[70%] gap-3 p-4 ">
          <div className={showForm===true?"hidden":""}>
            <PatientTable patients_data={patients_data} addPatient={addPatient} />
          </div>
          <div className={showForm===false?"hidden":""}>
            <PatientForm savePatient={savePatient} close={close}/>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientPage;
