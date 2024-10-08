import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import NavBar from "../components/NavBar";
import AppointmentTable from "../components/AppointmentTable";
import AppointmentForm from "../components/AppointmentForm";

const AppointmentsPage = () => {
  const [appointments_data, setAppointmentsData] = useState([
    {
      ID: "1",
      Name: "Mr Collins",
      Appointments_Date: "08/07/2024",
      Appointments_Time: "4:05",
      Duration: "30 mins",
      Checkup_Status: "Complete",
    },
    {
      ID: "2",
      Name: "Mr. Daniel",
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




// import React from "react";
// import NavBar from "../components/NavBar";
// import Sidebar from "../components/Sidebar";
// import pic from "../assets/appointmentPage.png";
// import { Link } from "react-router-dom";
// const Appointments = () => {
//   let patientArr = [
//     { patientID: "1", name: "Mr. Collins", time: "4:05 pm, 08/07/2024" },
//     { patientID: "2", name: "Mr. David", time: "4:15 pm, 08/07/2024" },
//     { patientID: "3", name: "Mr. Warner", time: "4:30 pm, 08/07/2024" },
//     { patientID: "4", name: "Mr. Tim Hoken", time: "4:45 pm, 08/07/2024" },
//     { patientID: "5", name: "Mr. Stive", time: "5:05 pm, 08/07/2024" },
//     { patientID: "6", name: "Mr. Willams", time: "5:15 pm, 08/07/2024" },
//     { patientID: "7", name: "Mr. Franklin", time: "5:30 pm, 08/07/2024" },
//     { patientID: "8", name: "Mr. Southe", time: "5:45 pm, 08/07/2024" },
//     { patientID: "9", name: "Mr. Ferguson", time: "5:55 pm, 08/07/2024" },
//     { patientID: "10", name: "Mr. Jesprit", time: "6:05 pm, 08/07/2024" },
//     { patientID: "11", name: "Mr. Etkinson", time: "6:15 pm, 08/07/2024" },
//   ];

//   const renderAppointments = () => {
//     return patientArr.map((info, index) => {
//       return (
//         <div
//           className="bg-gray-200 p-5 rounded-md shadow-lg w-fit flex justify-between items-center gap-20 transition ease-in-out  animate-fadeIn"
//           key={index}
//         >
//           <div>
//             <p className="text-lg">Patient Number: {info.patientID}</p>
//             <p className="text-lg">Patient Name: {info.name}</p>
//             <p className="text-lg">Appointment Time: {info.time}</p>
//           </div>
//           <Link to={`/emr/${info.patientID}/${"l036-n7zl-6txr"}`}>
//             <div className="bg-[#234ee8] text-white px-4 py-2 rounded-md shadow-lg">
//               Join
//             </div>
//           </Link>
//         </div>
//       );
//     });
//   };
//   return (
//     <>
//       <NavBar />
//       <div className="flex flex-row justify-between gap-2 mb-28 bg-slate-50">
//         <div className="basis-[5%]">
//           <Sidebar page="APPOINTMENT" />
//         </div>
//         <div className="basis-[80%] h-screen w-screen p-10">
//           <div className="flex justify-between items-center mb-6">
//             <h1 className="text-2xl font-bold">Appointments</h1>
//             <button className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg hover:bg-blue-700">
//               Add Appointment
//             </button>
//           </div>
//           <div className="grid grid-cols-1 gap-4">{renderAppointments()}</div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default Appointments;
