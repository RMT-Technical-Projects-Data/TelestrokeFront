import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import NavBar from "../components/NavBar";
import AppointmentTable from "../components/AppointmentTable";
import AppointmentForm from "../components/AppointmentForm";

const AppointmentsPage = () => {
  const [appointments_data, setAppointmentsData] = useState([
    {
      ID: "1",
      Patient_Name: "Mr Collins",
      Appointments_Date: "08/07/2024",
      Appointments_Time: "4:05",
      Duration: "30 mins",
      Checkup_Status: "Complete",
    },
    {
      ID: "2",
      Patient_Name: "Mr. Daniel",
      Appointments_Date: "08/07/2024",
      Appointments_Time: "4:40",
      Duration: "15 mins",
      Checkup_Status: "Pending",
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const addAppointment = () => {
    setShowForm(!showForm);
  };

  const saveAppointment = (appointment) => {
    setAppointmentsData([...appointments_data, appointment]);
    setShowForm(false);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  return (
    <div>
      <NavBar />
      <div className="flex flex-row justify-between gap-2 mb-28">
        <div className="basis-[5%]">
          <Sidebar page="APPOINTMENTS" />
        </div>
        <div className="basis-[80%] flex flex-col h-fit w-[70%] gap-3 p-4">
          {!showForm && (
            <AppointmentTable
              appointments_data={appointments_data}
              addAppointment={addAppointment}
            />
          )}
          {showForm && (
            <AppointmentForm saveAppointment={saveAppointment} close={closeForm} appointments_data={appointments_data} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsPage;

