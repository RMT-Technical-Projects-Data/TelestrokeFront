import React from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import { Link } from "react-router-dom";

// Register required chart components
ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  // need to be fetched from backend
  let patientArr = [
    { patientID: "1", name: "Mr. Collins", time: "4:05 pm, 08/07/2024" },
    { patientID: "2", name: "Mr. David", time: "4:15 pm, 08/07/2024" },
    { patientID: "3", name: "Mr. Warner", time: "4:30 pm, 08/07/2024" },
    { patientID: "4", name: "Mr. Tim Hoken", time: "4:45 pm, 08/07/2024" },
    { patientID: "5", name: "Mr. Stive", time: "5:05 pm, 08/07/2024" },
    { patientID: "6", name: "Mr. Willams", time: "5:15 pm, 08/07/2024" },
    { patientID: "7", name: "Mr. Franklin", time: "5:30 pm, 08/07/2024" },
    { patientID: "8", name: "Mr. Southe", time: "5:45 pm, 08/07/2024" },
    { patientID: "9", name: "Mr. Ferguson", time: "5:55 pm, 08/07/2024" },
    { patientID: "10", name: "Mr. Jesprit", time: "6:05 pm, 08/07/2024" },
    { patientID: "11", name: "Mr. Etkinson", time: "6:15 pm, 08/07/2024" },
  ];

  const renderAppointments = () => {
    patientArr = patientArr.slice(0, 3);
    return patientArr.map((info) => {
      return (
        <div
          key={info.patientID}
          className="bg-gray-200 p-5 rounded-md shadow-lg w-fit flex justify-between items-center gap-20 transition ease-in-out animate-fadeIn"
        >
          <div>
            <p className="text-lg">Patient Number: {info.patientID}</p>
            <p className="text-lg">Patient Name: {info.name}</p>
            <p className="text-lg">Appointment Time: {info.time}</p>
          </div>
          <Link to={`/emr/${info.patientID}/${"l036-n7zl-6txr"}`}>
            <div className="bg-[#234ee8] text-white px-4 py-2 rounded-md shadow-lg">
              Join
            </div>
          </Link>
        </div>
      );
    });
  };

  // Data for the pie chart
  const pieData = {
    labels: ["Appointments Attended", "Appointments Scheduled", "Remaining"],
    datasets: [
      {
        label: "Appointment Stats",
        data: [14, 16, 30 - (14 + 16)], // Attended, Scheduled, Remaining
        backgroundColor: ["#36A2EB", "#FFCE56", "#4CAF50"], // Custom colors with green for 'Remaining' (Today's Appointments)
        hoverBackgroundColor: ["#36A2EB", "#FFCE56", "#4CAF50"],
      },
    ],
  };

  return (
    <>
      <NavBar />
      <div className="flex flex-row justify-between gap-2 mb-28">
        <div className="basis-[2%]">
          <Sidebar page="DASHBOARD" />
        </div>
        <div className="basis-[90%] p-6 space-y-6 transition ease-in-out animate-fadeIn">
  {/* Add a new div with a negative margin */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-10 p-10 -ml-10"> {/* Adjusting margin-left to move it left */}
    <div className="flex flex-col gap-8 bg-green-500 text-white p-4 rounded-md shadow-lg h-36">
      <h2 className="text-3xl">Today's Appointments</h2>
      <p className="text-3xl font-bold text-right">30</p>
    </div>
    <div className="flex flex-col gap-8 bg-blue-500 text-white p-4 rounded-md shadow-lg h-36">
      <h2 className="text-3xl">Appointments Attended</h2>
      <p className="text-3xl font-bold text-right">14</p>
    </div>
    <div className="flex flex-col gap-8 bg-[#ECBA00] text-white p-4 rounded-md shadow-lg h-36">
      <h2 className="text-3xl">Appointments Scheduled</h2>
      <p className="text-3xl font-bold text-right">16</p>
    </div>
  </div>



          {/* Flex container for the Upcoming Appointments and Pie Chart */}
          <div className="flex flex-row gap-9 justify-between">
            {/* Left Side: Upcoming Appointments */}
            <div className="flex flex-col gap-7 w-1/2">
              <h2 className="text-2xl font-bold">Upcoming Appointments:</h2>
              {renderAppointments()}
            </div>
            
            {/* Right Side: Pie Chart */}
            <div className="flex justify-center w-1/2">
              <div className="w-[500px] h-[500px]"> {/* Doubled size (200% larger) */}
                <Pie data={pieData} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
