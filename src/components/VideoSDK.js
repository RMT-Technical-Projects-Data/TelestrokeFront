/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "../App.css";
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  createCameraVideoTrack,
} from "@videosdk.live/react-sdk";
import { authToken } from "../API";
import { useNavigate, useParams } from 'react-router-dom';
import ReactPlayer from "react-player";
import Button from "./Button";
import loading from "../assets/btn_loading.gif";
import axios from "axios";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// function JoinScreen({ getMeetingAndToken }) {
//   const { meetingid } = useParams();
//   const [meetingId, setMeetingId] = useState(meetingid);

//   const onClick = async () => {
//     await getMeetingAndToken(meetingId);
//   };

//   return (
//     <div>
//       <button onClick={onClick}>Join</button>
//     </div>
//   );
// }

function ParticipantView(props) {
  const micRef = useRef(null);
  const { webcamStream, micStream, webcamOn, micOn, isLocal } =
    useParticipant(props.participantId);

  const videoStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);

        micRef.current.srcObject = mediaStream;
        micRef.current
          .play()
          .catch((error) =>
            console.error("videoElem.current.play() failed", error)
          );
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  return (
    <>
      {props.index > 0 ? (
        <div className="p-2">
          <audio ref={micRef} autoPlay playsInline muted={isLocal} />
          {webcamOn ? (
            <ReactPlayer
              playsinline
              pip={false}
              light={false}
              controls={false}
              muted={false}
              playing={true}
              url={videoStream}
              height="600px"
              width="800px"
              onError={(err) => {
                console.log(err, "participant video error");
              }}
            />
          ) : (
            <h1>Webcam off</h1>
          )}
        </div>
      ) : (
        <></>
      )}
    </>
  );
}

function onParticipantJoined(participant) {
  console.log(participant);
  participant.setQuality("high");
}


function Controls({ customTrack, handleLeave, meetingId, patientId }) {
  const { toggleMic, toggleWebcam, localMicOn } = useMeeting({ onParticipantJoined });

  const handleToggleWebcam = () => {
    if (customTrack) {
      toggleWebcam(customTrack);
    } else {
      console.error("Custom track is not available");
    }
  };

  const handleEndAppointment = async (shouldReload = false) => {
    const confirmToast = toast(
      <div>
        <p className="mb-4 text-lg font-semibold">Are you sure you want to end the appointment?</p>
        <div className="flex space-x-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            onClick={async () => {
              localStorage.setItem("Ended", JSON.stringify({ meetingId, patientId }));

              try {
                const response = await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/appointments`, {
                  meetingId,
                  ID: patientId,
                });

                if (response.data.success) {
                  console.log("Appointment status updated to 'Complete'.");
                } else {
                  console.log("No changes made: Appointment is already 'Complete'.");
                }
              } catch (error) {
                console.error("Error updating appointment status:", error.message);
              }

              setTimeout(() => {
                handleLeave();
              }, 500);

              localStorage.removeItem("Ended");
              toast.dismiss(confirmToast);

              if (shouldReload) {
                window.location.reload();
              }
            }}
          >
            Yes
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            onClick={() => {
              toast.dismiss(confirmToast);
            }}
          >
            No
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        theme: "light",
      }
    );
  };

  const handleBeforeUnload = (event) => {
    event.preventDefault();
    event.returnValue = '';
  };

  const handlePopState = useCallback((event) => {
    event.preventDefault();
  
    const confirmToast = toast(
      <div>
        <p className="text-sm text-gray-600">Any unsaved changes will be lost.</p>
        <div className="flex space-x-4 mt-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            onClick={() => {
              toast.dismiss(confirmToast);
              setTimeout(() => {
                handleLeave();
              }, 500); // Trigger end appointment logic if user confirms
            }}
          >
            Yes
          </button>
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            onClick={() => {
              toast.dismiss(confirmToast);
              // Push the current state back to history to prevent navigation
              window.history.pushState(null, '', window.location.href);
            }}
          >
            No
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        theme: "light",
      }
    );
  }, [handleLeave]); 
  

  useEffect(() => {
    // Add event listeners for beforeunload and popstate
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
  
    // Push the current state to history to track it
    window.history.pushState(null, '', window.location.href);
  
    return () => {
      // Cleanup event listeners on unmount
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [handlePopState]); // useCallback ensures handlePopState is stable
  

  return (
    <div className="controls-bar -mt-10">
      <Button onClick={() => handleEndAppointment(false)} className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600">
        End Appointment
      </Button>
      <Button onClick={() => toggleMic()}>
        <img
          src={localMicOn ? "https://img.icons8.com/ios-glyphs/50/FFFFFF/microphone.png" : "https://img.icons8.com/ios-glyphs/50/FFFFFF/no-microphone.png"}
          width={25}
          height={25}
          alt={localMicOn ? "Microphone on" : "Microphone off"} // Added alt text for accessibility
        />
      </Button>
      <Button onClick={() => handleToggleWebcam()}>Web Cam</Button>
    </div>
  );
}  

function MeetingView(props) {
  const [joined, setJoined] = useState(null);
  const { join, participants, leave } = useMeeting({
    onMeetingJoined: () => {
      props.setMeetingJoined(true);
      setJoined("JOINED");
    },
    onMeetingLeft: () => {
      props.onMeetingLeave();
    },
    onParticipantJoined,
  });

  const joinMeeting = () => {
    setJoined("JOINING");
    join();
  };

  const handleLeaveAndNavigate = () => {
    leave(); // Call the leave function from useMeeting
    props.onMeetingLeave(); // Call the prop function to handle leaving
  };

  // Detect navigation and leave the meeting
  useEffect(() => {
    return () => {
      handleLeaveAndNavigate();
    };
  }, []);
  

  return (
    <div className="container">
      {joined && joined === "JOINED" ? (
        <div>
          <div className="flex flex-row gap-4">
            {[...participants.keys()].map((participantId, index) => (
              <ParticipantView
                index={index}
                participantId={participantId}
                key={participantId}
              />
            ))}
          </div>
          <Controls
            customTrack={props.customTrack}
            handleLeave={handleLeaveAndNavigate}
            meetingId={props.meetingId}
            patientId={props.patientId}
          />
        </div>
      ) : joined && joined === "JOINING" ? (
        <div className="ml-[50%] mt-[25%]">
          <img 
            src={loading} 
            width={50} 
            height={50} 
            alt="Loading..." // Added alt text for accessibility
          />
        </div>
      ) : (
        <Button onClick={joinMeeting} className="ml-[47%] mt-[20%]">Join</Button>
      )}
    </div>
  );
}  

function VIDEOSDK(props) {
  const { meetingid, patientid } = useParams(); // Extract patient ID from the URL
  const [customTrack, setCustomTrack] = useState(null);
  const [meetingId, setMeetingId] = useState(meetingid);
  const [patientId, setPatientId] = useState(patientid);
  const navigate = useNavigate(); // Create a navigate instance

  const getTrack = async () => {
    const track = await createCameraVideoTrack({
      optimizationMode: "motion",
      encoderConfig: "h1440p_w1920p",
      facingMode: "environment",
    });
    setCustomTrack(track);
  };

  useEffect(() => {
    getTrack();
  }, []);

  const onMeetingLeave = () => {
    props.setMeetingJoined(false);
    setMeetingId(null);
    setPatientId(null);
    navigate('/dashboard'); // Navigate to the dashboard on meeting leave
  };

  return authToken && meetingId ? (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: true,
        webcamEnabled: false,
        name: "Web-App",
        customCameraVideoTrack: customTrack,
      }}
      token={authToken}
    >
      <MeetingView
        meetingId={meetingId}
        patientId={patientId}  // Pass patientId to MeetingView
        onMeetingLeave={onMeetingLeave}
        customTrack={customTrack}
        setMeetingJoined={props.setMeetingJoined}
      />
    </MeetingProvider>
  ) : (
    <></>
  );
}

export default VIDEOSDK;
