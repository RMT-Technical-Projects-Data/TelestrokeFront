import React, { useEffect, useMemo, useRef, useState } from "react";
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


function JoinScreen({ getMeetingAndToken }) {
  const { meetingid } = useParams();
  const [meetingId, setMeetingId] = useState(meetingid);

  const onClick = async () => {
    await getMeetingAndToken(meetingId);
  };

  return (
    <div>
      <button onClick={onClick}>Join</button>
    </div>
  );
}

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
    // Show a confirmation toast
    const confirmToast = toast(
      <div>
        <p className="mb-4 text-lg font-semibold">Are you sure you want to end the appointment?</p>
        <div className="flex space-x-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            onClick={async () => {
              // Proceed with the logic if the user confirms
              localStorage.setItem("Ended", JSON.stringify({ meetingId, patientId }));

              try {
                // Make API call to update the appointment status
                console.log("Making API request to update appointment...");
                const response = await axios.put("http://localhost:5000/api/appointments", {
                  meetingId,
                  ID: patientId, // Pass patientId as ID
                });

                // Log the response to see the result from the backend
                console.log("Response from API:", response.data);

                if (response.data.success) {
                  console.log("Appointment status updated to 'Complete'.");
                } else {
                  console.log("No changes made: Appointment is already 'Complete'.");
                }
              } catch (error) {
                console.error("Error updating appointment status:", error.message);
              }

              // Delay calling handleLeave to ensure the status update completes
              setTimeout(() => {
                console.log("Calling leave handler...");
                handleLeave();
              }, 500); // Delay to ensure status update is done (adjust time as needed)

              // Remove "Ended" from localStorage
              localStorage.removeItem("Ended");

              // Close the toast after the operation is completed
              toast.dismiss(confirmToast);

              // Reload if the user confirms and it's required
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
              // Close the toast if the user cancels
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

  // Function to handle page reload or navigation
  const handleBeforeUnload = (event) => {
    // Prevent the default reload behavior
    event.preventDefault();

    // Call handleEndAppointment to ask the user for confirmation
    handleEndAppointment(true);

    // Modern browsers may ignore custom messages in `event.returnValue`
    // So instead of a custom message, we can rely on the handleEndAppointment flow
    event.returnValue = ''; // Optional: Can be kept to trigger the default browser reload warning (may be ignored in some browsers)
  };

  // Add event listener for beforeunload
  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup the event listener when component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Empty dependency array to run once on mount

  return (
    <div className="controls-bar -mt-12.1">
      <Button onClick={() => handleEndAppointment(false)} className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600">
        End Appointment
      </Button>
      <Button onClick={() => toggleMic()}>
        <img
          src={localMicOn ? "https://img.icons8.com/ios-glyphs/50/FFFFFF/microphone.png" : "https://img.icons8.com/ios-glyphs/50/FFFFFF/no-microphone.png"}
          width={25}
          height={25}
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
        <div className="ml-[50%] mt-[25%]"><img src={loading} width={50} height={50}></img></div>
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
