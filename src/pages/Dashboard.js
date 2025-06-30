import React, { useEffect, useState } from "react";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import { Link } from "react-router-dom";
import ReactApexChart from 'react-apexcharts';
import attended from "../assets/icon_attended.png";
import scheduled from "../assets/icon_scheduled.png";
import total from "../assets/icon_total.png"; 
import "../App.css";

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [attendedAppointments, setAttendedAppointments] = useState(0);
  const [scheduledAppointments, setScheduledAppointments] = useState(0);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const Doctor = localStorage.getItem("Doctor");
        const url = Doctor ? `${process.env.REACT_APP_BACKEND_URL}/api/appointments?Doctor=${Doctor}` : `${process.env.REACT_APP_BACKEND_URL}/api/appointments`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();

        setAppointments(data);
        setTotalAppointments(data.length);
        setAttendedAppointments(data.filter(a => a.Checkup_Status === "Complete").length);
        setScheduledAppointments(data.filter(a => a.Checkup_Status !== "Complete").length);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const formatTime = (time) => {
    if (!time) return '';
    const [hour, minute] = time.split(':') || [];
    const hourNum = parseInt(hour, 10);
    const isPM = hourNum >= 12;
    const formattedHour = hourNum % 12 || 12;
    const amPm = isPM ? 'PM' : 'AM';
    return `${formattedHour}:${minute} ${amPm}`;
  };

  const groupAndSortAppointments = () => {
    const grouped = { dateTime: [], dateOnly: [], timeOnly: [], noDateTime: [] };
    appointments.forEach(a => {
      const { AppointmentDate, AppointmentTime } = a;
      if (AppointmentDate && AppointmentTime) grouped.dateTime.push(a);
      else if (AppointmentDate) grouped.dateOnly.push(a);
      else if (AppointmentTime) grouped.timeOnly.push(a);
      else grouped.noDateTime.push(a);
    });

    grouped.dateTime.sort((a, b) => {
      const dateA = new Date(a.AppointmentDate), dateB = new Date(b.AppointmentDate);
      const timeA = new Date(`1970-01-01T${a.AppointmentTime}`), timeB = new Date(`1970-01-01T${b.AppointmentTime}`);
      return dateA - dateB || timeA - timeB;
    });

    grouped.dateOnly.sort((a, b) => new Date(a.AppointmentDate) - new Date(b.AppointmentDate));
    grouped.timeOnly.sort((a, b) => {
      const today = new Date().toISOString().split("T")[0];
      return new Date(`${today}T${a.AppointmentTime}`) - new Date(`${today}T${b.AppointmentTime}`);
    });

    return grouped;
  };

  const renderAppointments = () => {
    const grouped = groupAndSortAppointments();
    const displayed = [...grouped.dateTime, ...grouped.dateOnly, ...grouped.timeOnly, ...grouped.noDateTime]
      .filter(a => a.Checkup_Status !== "Complete")
      .slice(0, 4);

    return displayed.map((a) => {
      return (
        <div key={a.ID} className="w-full border border-gray-300 rounded-md mb-4 transition animate-fadeIn">
          <div className="bg-white p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4 rounded-md shadow-lg">
            <div className="text-black w-full sm:w-auto">
              <p className="text-xl sm:text-2xl font-bold">{a.AppointmentTime ? formatTime(a.AppointmentTime) : "N/A"}</p>
              <p className="text-lg sm:text-xl font-bold">{a.AppointmentDate ? new Date(a.AppointmentDate).toISOString().split("T")[0] : "N/A"}</p>
              <p className="text-base sm:text-lg text-gray-500 mt-2">Device ID: {a.DeviceID}</p>
            </div>
            {a.meetingId ? (
              <Link to={`/emr/${a.ID}/${a.meetingId}`} className="w-full sm:w-auto">
                <div className="bg-[#3b4fdf] text-white hover:bg-[#2f44c4] px-4 py-2 w-full sm:w-32 text-center rounded-md shadow-md">
                  Join
                </div>
              </Link>
            ) : (
              <div className="text-gray-500 w-full sm:w-auto text-center">No Meeting Available</div>
            )}
          </div>
        </div>
      );
    });
  };

  const ChartThree = () => {
    const series = [attendedAppointments, scheduledAppointments];
    const options = {
      chart: { fontFamily: 'Satoshi, sans-serif', type: 'donut' },
      colors: ['#3b4fdf', '#1c2434'],
      labels: ['Appointments Attended', 'Appointments Scheduled'],
      legend: { show: false },
      plotOptions: { pie: { donut: { size: '65%' } } },
      dataLabels: { enabled: false },
      responsive: [{ breakpoint: 640, options: { chart: { width: '100%' } } }],
    };

    return (
      <div className="w-full border border-gray-300 rounded-md bg-white shadow-md p-5">
        <h5 className="text-xl font-semibold text-black mb-4">Appointments Analytics</h5>
        <div className="flex justify-center">
          <ReactApexChart options={options} series={series} type="donut" width="100%" />
        </div>
        <div className="flex flex-col sm:flex-row justify-center items-center mt-4 gap-4">
          {[{ label: 'Appointments Scheduled', value: scheduledAppointments, color: 'bg-[#1c2434]' },
            { label: 'Appointments Attended', value: attendedAppointments, color: 'bg-[#3b4fdf]' }].map((item, i) => (
            <div key={i} className="flex items-center w-full max-w-xs justify-between text-sm">
              <span className={`inline-block w-4 h-4 mr-2 rounded-full ${item.color}`}></span>
              <span className="text-gray-700">{item.label}</span>
              <span className="font-bold">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <NavBar />
      <div className="flex flex-col sm:flex-row mb-28 pt-[60px] sm:pt-[80px]">

        <Sidebar page="DASHBOARD" />
        <main className="flex-1 sm:ml-[250px] p-4 sm:p-6 lg:p-10 space-y-6">
          {loading ? (
            <div className="text-center text-lg">Loading...</div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex flex-col w-full lg:w-1/4 gap-4">
                  <Link to="/meeting">
                    <button className="bg-[#3b4fdf] text-white px-5 py-3 rounded-md w-full hover:bg-[#2f44c4]">
                      Create a Meeting
                    </button>
                  </Link>
                  <Link to="/appointment">
                    <button className="bg-[#3b4fdf] text-white px-5 py-3 rounded-md w-full hover:bg-[#2f44c4]">
                      Schedule an Appointment
                    </button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  {[
                    { count: totalAppointments, label: "Total Appointments", img: total },
                    { count: attendedAppointments, label: "Appointments Attended", img: attended },
                    { count: scheduledAppointments, label: "Appointments Scheduled", img: scheduled },
                  ].map((tile, i) => (
                    <div key={i} className="relative flex flex-col justify-end items-end bg-white p-6 sm:p-8 h-[180px] sm:h-[200px] rounded-md shadow-md">
                      <img src={tile.img} alt={tile.label} className="absolute top-4 left-4 w-12 sm:w-16" />
                      <p className="text-4xl sm:text-5xl font-bold">{tile.count}</p>
                      <h2 className="text-sm sm:text-lg text-gray-500 mt-2 text-center w-full">{tile.label}</h2>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full bg-white p-4 sm:p-6 rounded-md shadow-md">
                  <h2 className="text-xl sm:text-2xl font-bold mb-4">Upcoming Appointments:</h2>
                  {renderAppointments()}
                </div>
                <div className="w-full lg:w-auto flex justify-center">
                  <ChartThree />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default Dashboard;
