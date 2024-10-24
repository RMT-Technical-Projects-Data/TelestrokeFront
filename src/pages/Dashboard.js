import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import { Link } from "react-router-dom";

// Register required chart components
ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true); // State to manage loading

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/appointments'); // Adjust the URL as needed
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setAppointments(data);
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchAppointments();
  }, []); // Empty dependency array means this runs once when the component mounts

  const renderAppointments = () => {
    // Only render the first three appointments
    const displayedAppointments = appointments.slice(0, 3);
    return displayedAppointments.map((appointment) => {
      return (
        <div
          key={appointment.ID} // Make sure your API returns patientID
          className="bg-gray-200 p-5 rounded-md shadow-lg w-fit flex justify-between items-center gap-20 transition ease-in-out animate-fadeIn"
        >
          <div>
            <p className="text-lg">Patient Number: {appointment.ID}</p>
            <p className="text-lg">Patient Name: {appointment.Name}</p>
            <p className="text-lg">Appointment Time: {appointment.AppointmentTime}</p>
          </div>
          <Link to={`/emr/${appointment.ID}/${appointment.meetingId}`}>
                    {/* Dynamically using the appointment.MeetingID */}
                    <div className="bg-[#234ee8] text-white px-4 py-2 w-20 rounded-md shadow-lg mx-auto">
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
        backgroundColor: ["#36A2EB", "#FFCE56", "#4CAF50"], // Custom colors
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
          {/* Loading Indicator */}
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 p-10">
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
                  <div className="w-[500px] h-[500px]">
                    <Pie data={pieData} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
