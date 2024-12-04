import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import axios from "axios";
// import client from "../api/client"; // Import your axios client
import VIDEOSDK from "../components/VideoSDK";
import { useParams } from "react-router-dom";
import EMR_PatientInfo from "../components/EMR_PatientInfo";
import EMR_BedSide from "../components/EMR_BedSide";
import EMR_TelestrokeExam from "../components/EMR_TelestrokeExam";
import QuadrantTracking from "../components/QuadrantTracking";
import StimulusVideoController from "../components/StimulusVideoController";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// Import the saveData function from utils/auth.js to send data to the backend
import { submitExamData } from "../utils/auth";

const EMRpage = () => {
  const { patientid, meetingid } = useParams();
  // const [name, setName] = useState("");
  const [selectedEye, setSelectedEye] = useState("left");
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [centerFocus, setCenterFocus] = useState(true);
  const [settings, setSettings] = useState({
    eye_camera_control: "",
    exam_mode: "",
    stimulus_type: "",
    speed: "",
    stop: "",
    coordinates: ""
  });


  
  

  // the below useEffects are for resetting the local storage

  // useEffect(() => {
  //   // Clear patient info from local storage on component mount
  //   localStorage.removeItem("patientEMR");
  // }, []);


  // useEffect(() => {
  //   // Clear patient info from local storage on component mount
  //   localStorage.removeItem("emrBedSideData");
  // }, []);


  // useEffect(() => {
  //   // Clear patient info from local storage on component mount
  //   localStorage.removeItem("emrTelestrokeExam");
  // }, []);




  const [tab, setTab] = useState(0);
  const videoSpeedArr = ["Slow", "Medium", "High"];

  const handleRadioChange = (event) => {
    setSelectedEye(event.target.value);
    updateSetting("eye_camera_control", event.target.value);
  };



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
  
      const patientData = {
        patientid: patientid,
        Name: patientEMR.Name,
        patientDOB: patientEMR.PatientDOB,
        patientSex: patientEMR.PatientSex,
        examDate: patientEMR.ExamDate,
        visualActivityOD: patientEMR.VisualActivityOD,
        visualActivityOS: patientEMR.VisualActivityOS,
        neuroFindings: patientEMR.RelNeurologicalFinds,
        hasAphasia: patientEMR.HasAphasia ? 'Yes' : 'No',
        aphasiaDescription: patientEMR.AphasiaText,
      };
  
      const bedsideExamData = {
        smoothPursuitAndSaccadesResult: emrBedSideData.smoothPursuitAndSaccadesResult,
        smoothPursuitAndSaccadesDescription: emrBedSideData.smoothPursuitAndSaccadesDescription,
        hasNystagmus: emrBedSideData.hasNystagmus ? 'Yes' : 'No',
        gazeType: emrBedSideData.gazeType,
        visualFieldsODRUQ: emrBedSideData.od.ruq === 'pass' ? 'Pass' : (emrBedSideData.od.ruq ? 'Fail' : null),
        visualFieldsODRLQ: emrBedSideData.od.rlq === 'pass' ? 'Pass' : (emrBedSideData.od.rlq ? 'Fail' : null),
        visualFieldsODLUQ: emrBedSideData.od.luq === 'pass' ? 'Pass' : (emrBedSideData.od.luq ? 'Fail' : null),
        visualFieldsODLLQ: emrBedSideData.od.llq === 'pass' ? 'Pass' : (emrBedSideData.od.llq ? 'Fail' : null),
        extraocularMovementResult: emrBedSideData.extraocularMovementResult,
        extraocularMovementDescription: emrBedSideData.extraocularMovementDescription,
        nystagmusDegree: emrBedSideData.nystagmusDegree,
        examTolerated: emrBedSideData.examTolerated ? 'Yes' : 'No',
        visualFieldsOSRUQ: emrBedSideData.os.ruq === 'pass' ? 'Pass' : (emrBedSideData.os.ruq ? 'Fail' : null),
        visualFieldsOSRLQ: emrBedSideData.os.rlq === 'pass' ? 'Pass' : (emrBedSideData.os.rlq ? 'Fail' : null),
        visualFieldsOSLUQ: emrBedSideData.os.luq === 'pass' ? 'Pass' : (emrBedSideData.os.luq ? 'Fail' : null),
        visualFieldsOSLLQ: emrBedSideData.os.llq === 'pass' ? 'Pass' : (emrBedSideData.os.llq ? 'Fail' : null),
      };
      
      const teleStrokeExamData = {
        tele_smoothPursuitAndSaccadesResult: emrTelestrokeExam.smoothPursuitAndSaccadesResult,
        tele_smoothPursuitAndSaccadesDescription: emrTelestrokeExam.smoothPursuitAndSaccadesDescription,
        tele_hasNystagmus: emrTelestrokeExam.hasNystagmus ? 'Yes' : 'No',
        tele_gazeType: emrTelestrokeExam.gazeType,
        tele_visualFieldsODRUQ: emrBedSideData.od.ruq === 'pass' ? 'Pass' : (emrBedSideData.od.ruq ? 'Fail' : null),
        tele_visualFieldsODRLQ: emrBedSideData.od.rlq === 'pass' ? 'Pass' : (emrBedSideData.od.rlq ? 'Fail' : null),
        tele_visualFieldsODLUQ: emrBedSideData.od.luq === 'pass' ? 'Pass' : (emrBedSideData.od.luq ? 'Fail' : null),
        tele_visualFieldsODLLQ: emrBedSideData.od.llq === 'pass' ? 'Pass' : (emrBedSideData.od.llq ? 'Fail' : null),
        tele_extraocularMovementResult: emrTelestrokeExam.extraocularMovementResult,
        tele_extraocularMovementDescription: emrTelestrokeExam.extraocularMovementDescription,
        tele_nystagmusDegree: emrTelestrokeExam.nystagmusDegree,
        tele_examTolerated: emrTelestrokeExam.examTolerated ? 'Yes' : 'No',
        tele_visualFieldsOSRUQ: emrBedSideData.os.ruq === 'pass' ? 'Pass' : (emrBedSideData.os.ruq ? 'Fail' : null),
        tele_visualFieldsOSRLQ: emrBedSideData.os.rlq === 'pass' ? 'Pass' : (emrBedSideData.os.rlq ? 'Fail' : null),
        tele_visualFieldsOSLUQ: emrBedSideData.os.luq === 'pass' ? 'Pass' : (emrBedSideData.os.luq ? 'Fail' : null),
        tele_visualFieldsOSLLQ: emrBedSideData.os.llq === 'pass' ? 'Pass' : (emrBedSideData.os.llq ? 'Fail' : null),
      };
      
      const dataToSend = { patientData, bedsideExamData, teleStrokeExamData };
  
      // Log data to confirm structure before sending
      console.log("Data being sent to backend:", dataToSend);
  
      // Send data to backend
      const response = await submitExamData(dataToSend); // Update this function to accept nested objects
      console.log("Data saved successfully:", response);
  
      // Show confirmation
      toast.success("Data saved successfully!");
  
      // Clear 'patientName' from localStorage after successful save
      localStorage.removeItem("patientName");
      localStorage.removeItem("patientEMR");
      localStorage.removeItem("emrBedSideData");
      localStorage.removeItem("emrTelestrokeExam");
    

  
    } catch (error) {
      toast.error("Error submitting exam data:", error);
      toast.error("Error response data:", error.response?.data);
  
      // Show error message
      toast.error("There was an error saving the data. Please try again.");
    }
  };
  
  
  
  
  useEffect(() => {
    console.log(settings);
    axios
      .post("http://localhost:5000/videoController-webhook", settings)
      .then((response) => {
        console.log("Command sent:", response.data);
      })
      .catch((error) => {
        toast.error("There was an error sending the command!", error);
      });
  }, [settings]);

  return (
    <>
      <NavBar />
  
      <div className="flex flex-row justify-between gap-2 mb-28 bg-slate-50">
  <div className="basis-[5%]">
    <Sidebar page="EMR" />
  </div>
 
          <div className="flex flex-col h-fit basis-[85%] mt-6 gap-6 p-2">
            {meetingid ? (
              <>
                <div className="flex flex-row justify-between h-[720px] gap-8 py-5 px-3">
                  <div className="basis-[80%] bg-[#F0F0F0]">
                    <VIDEOSDK setMeetingJoined={setMeetingJoined} />
                  </div>
                  {meetingJoined && (
                    <div className="bg-slate-200 p-5 rounded-md ">
                      <div className="basis-[30%] flex flex-col gap-3 justify-evenly items-left">
                        <h3 className="font-bold text-2xl text-center ">
                          Video Control Panel
                        </h3>
                        <h3 className="font-bold text-lg ">Eye Camera Controls</h3>
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
                              updateSetting("eye_camera_control", "right");
                            }}
                          />
                          <label htmlFor="left" className="mr-6 text-lg">
                            Right
                          </label>
                          <input
                            type="radio"
                            id="right"
                            name="eye"
                            value="right"
                            className="mr-2"
                            checked={selectedEye === "right"}
                            onChange={() => {
                              setSelectedEye("right");
                              updateSetting("eye_camera_control", "left");
                            }}
                          />
                          <label htmlFor="right" className="text-lg">
                            Left
                          </label>
                        </div>
                        <label
                          htmlFor="examMode"
                          className="text-lg font-semibold mr-4"
                        >
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
                            checked={centerFocus}
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
                            checked={!centerFocus}
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
                        )}
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
                <div className="flex flex-row gap-1">
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
  
                {tab === 0 && <EMR_PatientInfo />}
                {tab === 1 && <EMR_BedSide />}
                {tab === 2 && <EMR_TelestrokeExam />}
              </>
            )}
  
            {/* Conditionally render buttons based on meetingJoined state */}
            {meetingJoined && (
              <div className="flex flex-row-reverse gap-8 mx-8 ">
                <Button onClick={handleSave}>Save</Button>
                {/* <Button onClick={() => {}}>Start New Test</Button> */}
                {/* <Button onClick={() => {}}>End Exam</Button> */}
              </div>
            )}
          </div>
        
      </div>
    </>
  );
}

export default EMRpage;
