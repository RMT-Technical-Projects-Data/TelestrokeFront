import React, { useEffect, useState } from "react";
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
                    <div className="basis-[80%] bg-[#F0F0F0]">
                      <VIDEOSDK setMeetingJoined={setMeetingJoined} />
                    </div>
                    {meetingJoined && (
                      <div className="bg-slate-200 p-5 rounded-md">
                        <div className="basis-[30%] flex flex-col gap-3 justify-evenly items-left">
                          <h3 className="font-bold text-2xl text-center">
                            Video Control Panel
                          </h3>
                          <h3 className="font-bold text-lg">Eye Camera Controls</h3>
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
                                updateSetting("eye_camera_control", "left");
                              }}
                            />
                            <label htmlFor="right" className="mr-6 text-lg">
                              Left
                            </label>



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
                            <label htmlFor="left" className=" text-lg">
                              Right
                            </label>
                           
                          </div>
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
                            checked={centerFocus === true} // Only check when explicitly true
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
                            checked={centerFocus === false} // Only check when explicitly false
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
                    className="scale-110 rounded-lg px-6 py-3" // Increased size, rounded, and added padding
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
  
  
  
}
    
export default EMRpage;
