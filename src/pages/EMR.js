import React, { useEffect, useState, useRef } from "react";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import axios from "axios";
// import client from "../api/client"; // Import your axios client
import VIDEOSDK from "../components/VideoSDK";
import { useParams } from "react-router-dom";
import EMRPatientInfo from "../components/EMR_PatientInfo";
import EMRBedSide from "../components/EMR_BedSide";
import EMRTelestrokeExam from "../components/EMR_TelestrokeExam";
import QuadrantTracking from "../components/QuadrantTracking";
import StimulusVideoController from "../components/StimulusVideoController";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";


// Import the saveData function from utils/auth.js to send data to the backend
import { submitExamData } from "../utils/auth";

const EMRpage = () => {
  const { patientid, meetingid } = useParams();
  // const [name, setName] = useState("");
  const [selectedEye, setSelectedEye] = useState(null);
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [centerFocus, setCenterFocus] = useState(null);
  const [settings, setSettings] = useState({
    eye_camera_control: "",
    exam_mode: "",
    stimulus_type: "",
    speed: "",
    stop: "",
    coordinates: ""
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        
        label: "",
        borderColor: "#36a2eb",
        backgroundColor: "#36a2eb",
        fill: false,
        data: [],
      },
      {
        label: "",
        borderColor: "#ff6384",
        backgroundColor: "#ff6384",
        fill: false,
        data: [],
      },
    ],
  });

  const chartRef = useRef(null);
  const MAX_POINTS = 30;

  useEffect(() => {
    const socket = new WebSocket("ws://65.2.78.181:3002");
    // const socket = new WebSocket("ws://localhost:3001");
    socket.onopen = () => console.log("WebSocket connected");

    const rawData = [];
    let frameIndex = 0;
    const MAX_POINTS = 2000;      // Keep more history for smoother visualization
    const SMOOTH_WINDOW = 5;      // Moving average window size

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("sdsad",data)
        if (data.type === "eye_data") {
          rawData.push({
            frame: frameIndex++,
            angle_x: data?.angle_x || 0,
            angle_y: data?.angle_y || 0,
            coords_x: data?.coords_x || 0,
            coords_y: data?.coords_y || 0
          });
          console.log("Raw Data Length:", rawData);

          // Limit the data to MAX_POINTS (ring buffer style)
          if (rawData.length > MAX_POINTS) {
            rawData.shift();
          }
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

const interval = setInterval(() => {
  if (rawData.length > SMOOTH_WINDOW) {
    const smoothedAngleX = [];
    const smoothedAngleY = [];
    const smoothedCoordsX = [];
    const smoothedCoordsY = [];
    const labels = [];

    for (let i = SMOOTH_WINDOW; i < rawData.length; i++) {
      const window = rawData.slice(i - SMOOTH_WINDOW, i);

      const avgAngleX = window.reduce((sum, p) => sum + p.angle_x, 0) / SMOOTH_WINDOW;
      const avgAngleY = window.reduce((sum, p) => sum + p.angle_y, 0) / SMOOTH_WINDOW;
      const avgCoordsX = window.reduce((sum, p) => sum + p.coords_x, 0) / SMOOTH_WINDOW;
      const avgCoordsY = window.reduce((sum, p) => sum + p.coords_y, 0) / SMOOTH_WINDOW;

      smoothedAngleX.push(avgAngleX);
      smoothedAngleY.push(avgAngleY);
      smoothedCoordsX.push(avgCoordsX);
      // smoothedCoordsX.push(avgCoordsX/100);
      // smoothedCoordsY.push(avgCoordsY/100);
      smoothedCoordsY.push(avgCoordsY);

      labels.push(rawData[i].frame);
    }

    setChartData({
      labels,
      datasets: [
        {
          label: "Eye Angle X",
          data: smoothedAngleX,
          borderColor: "#1e40af", // blue
          fill: false,
          pointRadius: 0,
          tension: 0.3,
        },
        {
          label: "Stimulus X",
          data: smoothedCoordsX,
          borderColor: "#10b981", // green
          fill: false,
          pointRadius: 0,
          tension: 0.3,
        },
        {
          label: "Eye Angle Y",
          data: smoothedAngleY,
          borderColor: "#9d174d", // pink
          fill: false,
          pointRadius: 0,
          tension: 0.3,
        },
        {
          label: "Stimulus Y",
          data: smoothedCoordsY,
          borderColor: "#f97316", // orange
          fill: false,
          pointRadius: 0,
          tension: 0.3,
        },
      ],
    });
  }
}, 100);


    return () => {
      socket.close();
      clearInterval(interval);
    };
  }, []);

  const [tab, setTab] = useState(0);
  // const videoSpeedArr = ["Slow", "Medium", "High"];

  // const handleRadioChange = (event) => {
  //   setSelectedEye(event.target.value);
  //   updateSetting("eye_camera_control", event.target.value);
  // };

  const updateSetting = (key, value) => {
    setSettings((prevSettings) => ({ ...prevSettings, [key]: value }));
  };

  const handleSave = async () => {
    try {
      console.log("patientEMR from localStorage:", localStorage.getItem("patientEMR"));
      console.log("emrBedSideData from localStorage:", localStorage.getItem("emrBedSideData"));
      console.log("emrTelestrokeExam from localStorage:", localStorage.getItem("emrTelestrokeExam"));
      
      const patientEMR = JSON.parse(localStorage.getItem("patientEMR")) || {};
      const emrBedSideData = JSON.parse(localStorage.getItem("emrBedSideData")) || {};
      const emrTelestrokeExam = JSON.parse(localStorage.getItem("emrTelestrokeExam")) || {};
  
      // Construct patient data with Doctor field included
      const patientData = {
        patientid: patientid,
        Name: patientEMR.Name,
        Doctor: patientEMR.Doctor,
        patientDOB: patientEMR.PatientDOB,
        patientSex: patientEMR.PatientSex,
        examDate: patientEMR.ExamDate,
        visualActivityOD: patientEMR.VisualActivityOD,
        visualActivityOS: patientEMR.VisualActivityOS,
        neuroFindings: patientEMR.RelNeurologicalFinds,
        hasAphasia: patientEMR.HasAphasia ? 'Yes' : 'No',
        aphasiaDescription: patientEMR.AphasiaText || null,  // This allows "" or null
      };
  
      const bedsideExamData = {
        smoothPursuitAndSaccadesResult: emrBedSideData.smoothPursuitAndSaccadesResult,
        smoothPursuitAndSaccadesDescription: emrBedSideData.smoothPursuitAndSaccadesDescription,
        hasNystagmus: emrBedSideData.hasNystagmus ? 'Yes' : 'No',
        gazeType: emrBedSideData.gazeType,
        visualFieldsODRUQ: emrBedSideData.od?.ruq === 'pass' ? 'Pass' : (emrBedSideData.od?.ruq ? 'Fail' : null),
        visualFieldsODRLQ: emrBedSideData.od?.rlq === 'pass' ? 'Pass' : (emrBedSideData.od?.rlq ? 'Fail' : null),
        visualFieldsODLUQ: emrBedSideData.od?.luq === 'pass' ? 'Pass' : (emrBedSideData.od?.luq ? 'Fail' : null),
        visualFieldsODLLQ: emrBedSideData.od?.llq === 'pass' ? 'Pass' : (emrBedSideData.od?.llq ? 'Fail' : null),
        extraocularMovementResult: emrBedSideData.extraocularMovementResult,
        extraocularMovementDescription: emrBedSideData.extraocularMovementDescription,
        nystagmusDegree: emrBedSideData.nystagmusDegree,
        examTolerated: emrBedSideData.examTolerated ? 'Yes' : 'No',
        visualFieldsOSRUQ: emrBedSideData.os?.ruq === 'pass' ? 'Pass' : (emrBedSideData.os?.ruq ? 'Fail' : null),
        visualFieldsOSRLQ: emrBedSideData.os?.rlq === 'pass' ? 'Pass' : (emrBedSideData.os?.rlq ? 'Fail' : null),
        visualFieldsOSLUQ: emrBedSideData.os?.luq === 'pass' ? 'Pass' : (emrBedSideData.os?.luq ? 'Fail' : null),
        visualFieldsOSLLQ: emrBedSideData.os?.llq === 'pass' ? 'Pass' : (emrBedSideData.os?.llq ? 'Fail' : null),
      };
  
      const teleStrokeExamData = {
        tele_smoothPursuitAndSaccadesResult: emrTelestrokeExam.smoothPursuitAndSaccadesResult,
        tele_smoothPursuitAndSaccadesDescription: emrTelestrokeExam.smoothPursuitAndSaccadesDescription,
        tele_hasNystagmus: emrTelestrokeExam.hasNystagmus ? 'Yes' : 'No',
        tele_gazeType: emrTelestrokeExam.gazeType,
        tele_visualFieldsODRUQ: emrTelestrokeExam.od?.ruq === 'pass' ? 'Pass' : (emrTelestrokeExam.od?.ruq ? 'Fail' : null),
        tele_visualFieldsODRLQ: emrTelestrokeExam.od?.rlq === 'pass' ? 'Pass' : (emrTelestrokeExam.od?.rlq ? 'Fail' : null),
        tele_visualFieldsODLUQ: emrTelestrokeExam.od?.luq === 'pass' ? 'Pass' : (emrTelestrokeExam.od?.luq ? 'Fail' : null),
        tele_visualFieldsODLLQ: emrTelestrokeExam.od?.llq === 'pass' ? 'Pass' : (emrTelestrokeExam.od?.llq ? 'Fail' : null),
        tele_extraocularMovementResult: emrTelestrokeExam.extraocularMovementResult,
        tele_extraocularMovementDescription: emrTelestrokeExam.extraocularMovementDescription,
        tele_nystagmusDegree: emrTelestrokeExam.nystagmusDegree,
        tele_examTolerated: emrTelestrokeExam.examTolerated ? 'Yes' : 'No',
        tele_visualFieldsOSRUQ: emrTelestrokeExam.os?.ruq === 'pass' ? 'Pass' : (emrTelestrokeExam.os?.ruq ? 'Fail' : null),
        tele_visualFieldsOSRLQ: emrTelestrokeExam.os?.rlq === 'pass' ? 'Pass' : (emrTelestrokeExam.os?.rlq ? 'Fail' : null),
        tele_visualFieldsOSLUQ: emrTelestrokeExam.os?.luq === 'pass' ? 'Pass' : (emrTelestrokeExam.os?.luq ? 'Fail' : null),
        tele_visualFieldsOSLLQ: emrTelestrokeExam.os?.llq === 'pass' ? 'Pass' : (emrTelestrokeExam.os?.llq ? 'Fail' : null),
      };
  
      const dataToSend = { patientData, bedsideExamData, teleStrokeExamData };
  
      // Log data to confirm structure before sending
      console.log("Data being sent to backend:", dataToSend);
  
      // Send data to backend
      const response = await submitExamData(dataToSend); // Update this function to accept nested objects
      console.log("Data saved successfully:", response);
  
      // Check the response for errors or success
      if (response.error) {
        // If the response contains an error, show an error toast
        toast.error(response.error);
      } else {
        // If the response is successful, show a success toast
        toast.success("Data saved successfully!");
        localStorage.removeItem("patientEMR");
        localStorage.removeItem("emrBedSideData");
        localStorage.removeItem("emrTelestrokeExam");
      }
    } catch (error) {
      console.error("Error submitting exam data:", error);
      toast.error("There was an error saving the data. Please try again.");
    }
  };

  useEffect(() => {
    console.log(settings);
    axios
      .post(`${process.env.REACT_APP_BACKEND_URL}/videoController-webhook`, settings)
      .then((response) => {
        console.log("Command sent:", response.data);
      })
      .catch((error) => {
        toast.error("There was an error sending the command!", error);
      });
  }, [settings]);

  return (
    <>
      <div className="overflow-x-hidden overflow-y-hidden">
        <NavBar disableDashboardLink={true} />
        {/* Main Content Container */}
        <div className="flex flex-col h-screen pt-6 mx-10 mt-10 overflow-hidden">
          {/* Main Content Area */}
          <div className="flex flex-col gap-2 ml-3 h-full w-full overflow-hidden">
            {meetingid ? (
              <>
                <div className="flex flex-row justify-between gap-8 pt-5 px-3 h-[620px]">
                  {/* Video SDK - Reduced width to make space for graph */}
                  <div className="basis-[50%] bg-[#F0F0F0]">
                    <VIDEOSDK setMeetingJoined={setMeetingJoined} />
                  </div>

                  {/* Eye Tracking Graph */}
                  {meetingJoined && (
                    <div className="basis-[40%] p-2 rounded-md bg-white shadow-lg">
                      {/* <h3 className="text-center font-bold text-xl text-blue-800">
                        Live Eye Tracking
                      </h3> */}
                      <div className="w-full h-[500px] flex flex-col gap-5">
                        {/* Horizontal (X-axis) movement chart */}
                      <div className="h-1/2 bg-white p-2 rounded-md shadow-sm">
                          <h4 className="text-center font-semibold text-black mb-1">
                            Horizontal Eye Movement (X-axis)
                          </h4>
                          <Line
                            data={{
                              labels: chartData.labels.map((_, index) => index),
                              datasets: [
                                {
                                  ...chartData.datasets[0], // Eye Angle X
                                  label: 'Eye Angle X',
                                  borderColor: '#1e40af', // Blue
                                  borderWidth: 2,
                                  pointRadius: 0,
                                },
                                {
                                  ...chartData.datasets[1], // Stimulus X
                                  label: 'Stimulus X',
                                  borderColor: '#10b981', // Green
                                  borderWidth: 2,
                                  pointRadius: 0,
                                },
                              ],
                            }}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              animation: { duration: 0 },
                              hover: { animationDuration: 0 },
                              responsiveAnimationDuration: 0,
                              plugins: {
                                legend: {
                                  display: true,
                                  position: 'top',
                                  labels: {
                                    color: '#000',
                                    boxWidth: 12,
                                    padding: 15,
                                  },
                                },
                              },
                              scales: {
                                x: {
                                  grid: {
                                    color: 'rgba(0, 0, 0, 0.15)',
                                    drawBorder: true,
                                  },
                                  title: {
                                    display: true,
                                    text: 'Time (frames)',
                                  },
                                  ticks: {
                                    callback: (value) => (value % 10 === 0 ? `${value / 10}s` : ''),
                                  },
                                },
                                y: {
                                  grid: {
                                    color: 'rgba(0, 0, 0, 0.15)',
                                    drawBorder: true,
                                  },
                                  min: -300,
                                  max: 1000, // increase range to accommodate stimulus x values
                                  title: {
                                    display: true,
                                    text: 'Angle / Stimulus (X)',
                                  },
                                },
                              },
                            }}
                          />
                        </div>
                        
                        {/* Vertical (Y-axis) movement chart */}
                      <div className="h-1/2 bg-white p-2 rounded-md shadow-sm">
                        <h4 className="text-center font-semibold text-black mb-1">Vertical Eye Movement (Y-axis)</h4>
                        <Line 
                          data={{
                            labels: chartData.labels.map((_, index) => index),
                            datasets: [
                              {
                                ...chartData.datasets[2], // Eye Angle Y
                                label: 'Eye Angle Y',
                                borderColor: '#9d174d', // Pink
                                borderWidth: 2,
                                pointRadius: 0,
                              },
                              {
                                ...chartData.datasets[3], // Stimulus Y
                                label: 'Stimulus Y',
                                borderColor: '#f97316', // Orange
                                borderWidth: 2,
                                pointRadius: 0,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            animation: { duration: 0 },
                            hover: { animationDuration: 0 },
                            responsiveAnimationDuration: 0,
                            plugins: {
                              legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                  color: '#000',
                                  boxWidth: 12,
                                  padding: 15,
                                },
                              },
                            },
                            scales: {
                              x: {
                                grid: {
                                  color: 'rgba(0, 0, 0, 0.15)',
                                  drawBorder: true,
                                },
                                title: {
                                  display: true,
                                  text: 'Time (frames)',
                                },
                                ticks: {
                                  callback: (value) => (value % 10 === 0 ? `${value / 10}s` : ''),
                                },
                              },
                              y: {
                                grid: {
                                  color: 'rgba(0, 0, 0, 0.15)',
                                  drawBorder: true,
                                },
                                min: -300,
                                max: 1000, // Increased for coords_y range
                                title: {
                                  display: true,
                                  text: 'Angle / Stimulus (Y)',
                                },
                              },
                            },
                          }}
                        />
                      </div>

                      </div>
                    </div>
                  )}

                  {/* Video Control Panel */}
                  {meetingJoined && (
                    // <div className="w-[300px] bg-slate-200 p-5 rounded-md">
                    <div className="w-full max-w-[280px] bg-slate-200 p-5 rounded-md">

                      <div className="flex flex-col gap-3 justify-evenly items-left">
                        <h3 className="font-bold text-2xl text-center">
                          Video Control Panel
                        </h3>
                        <h3 className="font-bold text-lg">Eye Camera Controls</h3>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="left"
                              name="eye"
                              value="left"
                              className="mr-2"
                              checked={selectedEye === "left"}
                              onChange={() => {
                                setSelectedEye("left");
                                updateSetting("eye_camera_control", "left");
                              }}
                            />
                            <label htmlFor="left" className="text-lg">Left</label>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="right"
                              name="eye"
                              value="right"
                              className="mr-2"
                              checked={selectedEye === "right"}
                              onChange={() => {
                                setSelectedEye("right");
                                updateSetting("eye_camera_control", "right");
                              }}
                            />
                            <label htmlFor="right" className="text-lg">Right</label>
                          </div>

                          <div className="flex items-center">
                            <input
                              type="radio"
                              id="both"
                              name="eye"
                              value="both"
                              className="mr-2"
                              checked={selectedEye === "both"}
                              onChange={() => {
                                setSelectedEye("both");
                                updateSetting("eye_camera_control", "both");
                              }}
                            />
                            <label htmlFor="both" className="text-lg">Both</label>
                          </div>
                        </div>


                            {!(selectedEye == 'both') &&  <>
                            <label htmlFor="examMode" className="text-lg font-semibold mr-4">
                          Exam Mode
                        </label>
                        <div className="flex items-center">
                          <input
                            onChange={() => {
                              updateSetting("exam_mode", "CenterFocus");
                              setCenterFocus(true);
                            }}
                            type="radio"
                            id="centerFocus"
                            name="examMode"
                            value="centerFocus"
                            className="mr-2"
                            checked={centerFocus === true}
                          />
                          <label htmlFor="centerFocus" className="mr-6 text-lg">
                            Center Focus
                          </label>
                          <input
                            onChange={() => {
                              updateSetting("exam_mode", "Quadrant");
                              setCenterFocus(false);
                            }}
                            type="radio"
                            id="quadrant"
                            name="examMode"
                            value="quadrant"
                            className="mr-2"
                            checked={centerFocus === false}
                          />
                          <label htmlFor="quadrant" className="text-lg">
                            Quadrant
                          </label>
                        </div>
                        {centerFocus ? (
                          <StimulusVideoController
                            settings={settings}
                            updateSetting={updateSetting}
                          />
                        ) : (
                          <QuadrantTracking
                            settings={settings}
                            updateSetting={updateSetting}
                          />
                        )}</>}
                        
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Button>Join Meeting</Button>
            )}
    
            {meetingJoined && (
              <>
                <div className="flex flex-row gap-1 ml-2">
                  <button
                    className={`rounded-b-none rounded-t-md border-b-0 text-sm ${
                      tab === 0 ? "bg-[rgb(5,60,212)] text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setTab(0)}
                  >
                    Patient Info
                  </button>
                  <button
                    className={`rounded-b-none rounded-t-md border-b-0 text-sm ${
                      tab === 1 ? "bg-[rgb(5,60,212)] text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setTab(1)}
                  >
                    Bedside Exam
                  </button>
                  <button
                    className={`rounded-b-none rounded-t-md border-b-0 text-sm ${
                      tab === 2 ? "bg-[rgb(5,60,212)] text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setTab(2)}
                  >
                    Telestroke Exam
                  </button>
                </div>
    
                {tab === 0 && <EMRPatientInfo />}
                {tab === 1 && <EMRBedSide />}
                {tab === 2 && <EMRTelestrokeExam />}
              </>
            )}
    
            {/* Conditionally render buttons based on meetingJoined state */}
            {meetingJoined && (
              <div className="flex flex-row-reverse gap-8 mx-8">
                <Button
                  onClick={handleSave}
                  className="scale-110 rounded-lg px-6 py-3"
                >
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default EMRpage;
