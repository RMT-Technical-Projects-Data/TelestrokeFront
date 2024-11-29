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

  // Clear specific local storage items on component mount
  useEffect(() => {
    localStorage.removeItem("patientEMR");
    localStorage.removeItem("emrBedSideData");
    localStorage.removeItem("emrTelestrokeExam");
    localStorage.removeItem("patientName");
  }, []);

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

    fetchAppointments(); // Fetch appointments
  }, []); // Dependency array

  // Function to sort and group appointments by date and time
  const groupAndSortAppointments = () => {
    // Group appointments by date and time
    const groupedAppointments = {
      dateTime: [],
      dateOnly: [],
      timeOnly: [],
      noDateTime: [],  // New group for appointments with no date or time
    };
  
    appointments.forEach(appointment => {
      const { AppointmentDate, AppointmentTime } = appointment;
  
      if (AppointmentDate && AppointmentTime) {
        groupedAppointments.dateTime.push(appointment);
      } else if (AppointmentDate) {
        groupedAppointments.dateOnly.push(appointment);
      } else if (AppointmentTime) {
        groupedAppointments.timeOnly.push(appointment);
      } else {
        groupedAppointments.noDateTime.push(appointment); // Add to noDateTime group if no date or time
      }
    });
  
    // Sort each group by their respective date/time
    groupedAppointments.dateTime.sort((a, b) => {
      const dateA = new Date(a.AppointmentDate);
      const dateB = new Date(b.AppointmentDate);
      const timeA = new Date(`1970-01-01T${a.AppointmentTime}`);
      const timeB = new Date(`1970-01-01T${b.AppointmentTime}`);
      return dateA - dateB || timeA - timeB;
    });
  
    groupedAppointments.dateOnly.sort((a, b) => new Date(a.AppointmentDate) - new Date(b.AppointmentDate));
  
    // Sort appointments with only time: treat them as today's date, sorted by time
    groupedAppointments.timeOnly.sort((a, b) => {
      const today = new Date().toISOString().split('T')[0]; // Get today's date in yyyy-mm-dd format
      const dateA = new Date(`${today}T${a.AppointmentTime}`);
      const dateB = new Date(`${today}T${b.AppointmentTime}`);
      return dateA - dateB;
    });
  
    // No need to sort noDateTime as they will come last
    return groupedAppointments;
  };
  
  
  // Render the grouped and sorted appointments
  const renderAppointments = () => {
    const groupedAppointments = groupAndSortAppointments();
  
    const displayedAppointments = [
      ...groupedAppointments.dateTime,
      ...groupedAppointments.dateOnly,
      ...groupedAppointments.timeOnly,
      ...groupedAppointments.noDateTime,  // Add the noDateTime group at the end
    ];
  
    return displayedAppointments.slice(0, 3).map((appointment) => {
      const isMeetingAvailable = appointment.meetingId; // Check if meetingId exists
  
      const handleJoin = (appointmentId, patientName) => {
        // Store the patient name in local storage
        localStorage.setItem('patientName', patientName);
      };
  
      return (
        <div
          key={appointment.ID}
          className="bg-gray-200 p-5 rounded-md shadow-lg w-full max-w-lg flex justify-between items-center gap-4 transition ease-in-out animate-fadeIn"
        >
          <div>
            <p className="text-lg">Patient ID: {appointment.ID}</p>
            <p className="text-lg">Patient Name: {appointment.Name}</p>
            <p className="text-lg">
              Appointment Time: {appointment.AppointmentTime ? appointment.AppointmentTime : "N/A"}
            </p>
  
            <p className="text-lg">
              Appointment Date: {appointment.AppointmentDate 
                ? new Date(appointment.AppointmentDate).toISOString().split('T')[0] 
                : "N/A"
              }
            </p>
          </div>
          {isMeetingAvailable ? (
            <Link to={`/emr/${appointment?.ID}/${appointment?.meetingId}`}>
              <div
                className="bg-[#234ee8] text-white px-4 py-2 w-20 rounded-md shadow-lg mx-auto"
                onClick={() => handleJoin(appointment.ID, appointment.Name)} // Store name on join button click
              >
                Join
              </div>
            </Link>
          ) : (
            <div className="text-gray-500">No Meeting Available</div>
          )}
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 p-10 -ml-10">
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



