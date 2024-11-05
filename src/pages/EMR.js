import React, { useEffect, useState } from "react";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import axios from "axios";
import VIDEOSDK from "../components/VideoSDK";
import { useParams } from "react-router-dom";
import EMR_PatientInfo from "../components/EMR_PatientInfo";
import EMR_BedSide from "../components/EMR_BedSide";
import QuadrantTracking from "../components/QuadrantTracking";
import StimulusVideoController from "../components/StimulusVideoController";

const EMRpage = () => {
  const { pateintid, meetingid } = useParams();
  const [name, setName] = useState("");
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
  const [tab, setTab] = useState(0);
  const videoSpeedArr = ["Slow", "Medium", "High"];

  const handleRadioChange = (event) => {
    setSelectedEye(event.target.value);
    updateSetting("eye_camera_control", event.target.value);
  };

  const updateSetting = (key, value) => {
    setSettings((prevSettings) => ({ ...prevSettings, [key]: value }));
  };

  useEffect(() => {
    console.log(settings);
    debugger;
    axios
      .post("http://localhost:5000/videoController-webhook", settings)
      .then((response) => {
        console.log("Command sent:", response.data);
      })
      .catch((error) => {
        console.error("There was an error sending the command!", error);
      });
  }, [settings]);

  return (
    <>
      <NavBar />
      <div className="flex flex-row justify-between gap-2 mb-28 bg-slate-50">
        <div className="basis-[5%]">
          <Sidebar page="EMR" />
        </div>
        {!pateintid ? (
          // Patient Id is not present in the address
          <div className="basis-[80%] flex flex-row gap-5 h-2/6 ">
            <input
              type="text"
              className="shadow-sm rounded-lg w-2/3 mx-auto h-2/4 p-1 pl-4 mt-6"
              placeholder=" Search for a patient "
            />
            <Button onClick={() => {}} className="mx-auto h-2/4 mt-4">
              Search
            </Button>
          </div>
        ) : (
          <div className="flex flex-col h-fit basis-[85%] mt-6 gap-6 p-2">
            <div className="flex flex-row gap-14">
              <p className="text-2xl font-semibold">Patient Details:</p>
              <p>
                <span className="text-[rgb(5,60,212)]">Patient ID:</span> 19222
              </p>
              <p>
                <span className="text-[rgb(5,60,212)]">Name:</span> Mr. Ahmed Ali
              </p>
              <p>
                <span className="text-[rgb(5,60,212)]">Age:</span> 52
              </p>
              <p>
                <span className="text-[rgb(5,60,212)]">Gender:</span> Male
              </p>
            </div>

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
                              updateSetting("eye_camera_control", "left");
                            }}
                          />
                          <label htmlFor="left" className="mr-6 text-lg">
                            Left
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
                              updateSetting("eye_camera_control", "right");
                            }}
                          />
                          <label htmlFor="right" className="text-lg">
                            Right
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
                {tab === 2 && <EMR_BedSide />}
              </>
            )}

            {/* Conditionally render buttons based on meetingJoined state */}
            {meetingJoined && (
              <div className="flex flex-row-reverse gap-8">
                <Button onClick={() => {}}>Save</Button>
                <Button onClick={() => {}}>Start New Test</Button>
                <Button onClick={() => {}}>End Exam</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default EMRpage;
