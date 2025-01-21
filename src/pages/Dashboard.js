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

// Register required chart components
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
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setAppointments(data);
        setTotalAppointments(data.length);

        const attendedCount = data.filter((appointment) => appointment.Checkup_Status === "Complete").length;
        setAttendedAppointments(attendedCount);

        const scheduledCount = data.filter((appointment) => appointment.Checkup_Status !== "Complete").length;
        setScheduledAppointments(scheduledCount);
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
    if (!hour || !minute) return '';
    const hourNum = parseInt(hour, 10);
    const isPM = hourNum >= 12;
    const formattedHour = hourNum % 12 || 12;
    const amPm = isPM ? 'PM' : 'AM';
    return `${formattedHour}:${minute} ${amPm}`;
  };

  const groupAndSortAppointments = () => {
    const groupedAppointments = {
      dateTime: [],
      dateOnly: [],
      timeOnly: [],
      noDateTime: [],
    };

    appointments.forEach((appointment) => {
      const { AppointmentDate, AppointmentTime } = appointment;

      if (AppointmentDate && AppointmentTime) {
        groupedAppointments.dateTime.push(appointment);
      } else if (AppointmentDate) {
        groupedAppointments.dateOnly.push(appointment);
      } else if (AppointmentTime) {
        groupedAppointments.timeOnly.push(appointment);
      } else {
        groupedAppointments.noDateTime.push(appointment);
      }
    });

    groupedAppointments.dateTime.sort((a, b) => {
      const dateA = new Date(a.AppointmentDate);
      const dateB = new Date(b.AppointmentDate);
      const timeA = new Date(`1970-01-01T${a.AppointmentTime}`);
      const timeB = new Date(`1970-01-01T${b.AppointmentTime}`);
      return dateA - dateB || timeA - timeB;
    });

    groupedAppointments.dateOnly.sort((a, b) => new Date(a.AppointmentDate) - new Date(b.AppointmentDate));
    groupedAppointments.timeOnly.sort((a, b) => {
      const today = new Date().toISOString().split("T")[0];
      const dateA = new Date(`${today}T${a.AppointmentTime}`);
      const dateB = new Date(`${today}T${b.AppointmentTime}`);
      return dateA - dateB;
    });

    return groupedAppointments;
  };

  const renderAppointments = () => {
    const groupedAppointments = groupAndSortAppointments();
    const displayedAppointments = [
      ...groupedAppointments.dateTime,
      ...groupedAppointments.dateOnly,
      ...groupedAppointments.timeOnly,
      ...groupedAppointments.noDateTime,
    ];

    const filteredAppointments = displayedAppointments.filter(
      (appointment) => appointment.Checkup_Status !== "Complete"
    );

    return filteredAppointments.slice(0, 4).map((appointment) => {
      const isMeetingAvailable = appointment.meetingId;

      const handleJoin = (appointmentId) => {
        // Handle join logic here
      };

      return (
        <div key={appointment.ID} className="flex items-center gap-4 w-full max-w-2xl transition ease-in-out animate-fadeIn border border-gray-300 rounded-md">
          <div className="bg-white p-8 pl-12 rounded-md shadow-lg flex-1 flex justify-between items-center gap-4">
            <div className="text-black">
              <p className="text-2xl font-bold">{appointment.AppointmentTime ? formatTime(appointment.AppointmentTime) : "N/A"}</p>
              <p className="text-xl font-bold">{appointment.AppointmentDate ? new Date(appointment.AppointmentDate).toISOString().split("T")[0] : "N/A"}</p>
              <p className="text-lg color-grey mt-4">Device ID: {appointment.DeviceID}</p>
            </div>
            {isMeetingAvailable ? (
              <Link to={`/emr/${appointment?.ID}/${appointment?.meetingId}`}>
                <div className="bg-[#3b4fdf] text-white hover:bg-[#2f44c4] px-4 py-2 w-32 rounded-md shadow-lg text-center mr-10" onClick={() => handleJoin(appointment)}>
                  Join
                </div>
              </Link>
            ) : (
              <div className="text-gray-500">No Meeting Available</div>
            )}
          </div>
        </div>
      );
    });
  };

  const ChartThree = () => {
    const series = [attendedAppointments, scheduledAppointments];
    const options = {
      chart: {
        fontFamily: 'Satoshi, sans-serif',
        type: 'donut',
      },
      colors: ['#3b4fdf', '#1c2434'],
      labels: ['Appointments Attended', 'Appointments Scheduled'],
      legend: {
        show: false,
        position: 'bottom',
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            background: 'transparent',
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      responsive: [
        {
          breakpoint: 2600,
          options: {
            chart: {
              width: 380,
            },
          },
        },
        {
          breakpoint: 640,
          options: {
            chart: {
              width: 200,
            },
          },
        },
      ],
    };

    return (
      <div className="sm:px-7.5 col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-5">
        <div className="mb-3 justify-between gap-4 sm:flex">
          <div>
            <h5 className="text-xl font-semibold text-black dark:text-white py-3">Appointments Analytics</h5>
          </div>
        </div>

        <div className="mb-2">
          <div id="chartThree" className="mx-auto flex justify-center">
            <ReactApexChart options={options} series={series} type="donut" />
          </div>
        </div>

        <div className="-mx-8 flex flex-wrap items-center justify-center gap-y-3">
          {[{ label: 'Appointments Scheduled', value: scheduledAppointments, color: 'bg-[#1c2434]' },
            { label: 'Appointments Attended', value: attendedAppointments, color: 'bg-[#3b4fdf]' },
          ].map((item, index) => (
            <div key={index} className="sm:w-1/2 w-full px-8">
              <div className="flex w-full items-center">
                <span className={`mr-2 block h-3 w-full max-w-3 rounded-full ${item.color}`}></span>
                <p className="flex w-full justify-between text-sm font-medium text-black dark:text-white">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <NavBar />
      <div className="flex flex-col sm:flex-row justify-between gap-2 mb-28">
        <div className="sm:basis-[2%]">
          <Sidebar page="DASHBOARD" className="z-10" />
        </div>
        <div className="basis-[100%] sm:basis-[90%] p-6 space-y-6 transition ease-in-out animate-fadeIn ml-[250px]">
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="flex flex-col gap-10 px-4 sm:px-6 md:px-10 lg:px-12 xl:px-16">
              <div className="flex flex-col sm:flex-row gap-6 mb-10">
                <div className="w-full sm:w-1/4 flex flex-col mt-[9%]">
                  <div className="flex flex-col gap-5">
                    <Link to="/meeting">
                      <button className="bg-[#3b4fdf] text-white px-5 py-3 rounded-md text-lg w-full hover:bg-[#2f44c4]">
                        Create a Meeting
                      </button>
                    </Link>
                    <Link to="/appointment">
                      <button className="bg-[#3b4fdf] text-white px-5 py-3 rounded-md text-lg w-full hover:bg-[#2f44c4]">
                        Schedule an Appointment
                      </button>
                    </Link>
                  </div>
                </div>
  
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-10 mt-[6%] w-full">
                  {/* Total Appointments Tile */}
                  <div className="flex flex-col bg-white text-black p-10 rounded-md shadow-lg justify-end items-end relative h-[200px]">
                    <img
                      src={total}
                      alt="Total Appointments"
                      className="text-[#3b4fdf] absolute top-6 left-6 w-16 h-16"
                    />
                    <p className="text-6xl font-bold text-center">{totalAppointments}</p>
                    <h2 className="text-xl text-center text-gray-500 mt-2">Total Appointments</h2>
                  </div>
  
                  {/* Appointments Attended Tile */}
                  <div className="flex flex-col bg-white text-black p-10 rounded-md shadow-lg justify-end items-end relative h-[200px]">
                    <img
                      src={attended}
                      alt="Appointments Attended"
                      className="text-[#3b4fdf] absolute top-6 left-6 w-16 h-16"
                    />
                    <p className="text-6xl font-bold text-center">{attendedAppointments}</p>
                    <h2 className="text-xl text-center text-gray-500 mt-2">Appointments Attended</h2>
                  </div>
  
                  {/* Appointments Scheduled Tile */}
                  <div className="flex flex-col bg-white text-black p-10 rounded-md shadow-lg justify-end items-end relative h-[200px]">
                    <img
                      src={scheduled}
                      alt="Appointments Scheduled"
                      className="text-[#3b4fdf] absolute top-6 left-6 w-16 h-16"
                    />
                    <p className="text-6xl font-bold text-center">{scheduledAppointments}</p>
                    <h2 className="text-xl text-center text-gray-500 mt-2">Appointments Scheduled</h2>
                  </div>
                </div>
              </div>
  
              <div className="flex flex-col sm:flex-row gap-6 items-start -mt-[5%]">
                <div className="w-full flex p-10 bg-white flex-col gap-7">
                  <h2 className="text-2xl font-bold">Upcoming Appointments:</h2>
                  {renderAppointments()}
                </div>
                <div className="w-full flex justify-center">
                  <ChartThree />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
  
}
export default Dashboard;
