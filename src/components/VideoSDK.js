/* eslint-disable react-hooks/exhaustive-deps */
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import "../App.css";
import {
  MeetingProvider,
  useMeeting,
  useParticipant,
  createCameraVideoTrack,
} from "@videosdk.live/react-sdk";
import { getAuthToken } from "../API"; // Import getAuthToken instead of authToken
import { useNavigate, useParams } from "react-router-dom";
import ReactPlayer from "react-player";
import Button from "./Button";
import loading from "../assets/btn_loading.gif";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Mic, MicOff } from "lucide-react";

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
  const { webcamStream, micStream, webcamOn, micOn, isLocal } = useParticipant(
    props.participantId
  );

  const videoStream = useMemo(() => {
    if (webcamOn && webcamStream) {
      const mediaStream = new MediaStream();
      mediaStream.addTrack(webcamStream.track);
      return mediaStream;
    }
  }, [webcamStream, webcamOn]);

  useEffect(() => {
    console.log("MicStream Debug — Participant:", props.participantId);
    console.log("micOn:", micOn);
    console.log("micStream:", micStream);
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
              height="580px"
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
  const meeting = useMeeting({
    onParticipantJoined,
  });

  const toggleMic = meeting?.toggleMic;
  const toggleWebcam = meeting?.toggleWebcam;
  const localMicState =
    meeting?.localMicOn ?? meeting?.micOn ?? meeting?.localParticipant?.micOn;

  // Log meeting state on mount and changes
  useEffect(() => {
    console.log("🎛️ Controls component - Meeting object:", meeting);
    console.log("🎤 Controls component - toggleMic function:", typeof toggleMic);
    console.log("🎤 Controls component - localMicState:", localMicState);
    console.log("🎤 Controls component - meeting.localMicOn:", meeting?.localMicOn);
    console.log("🎤 Controls component - meeting.micOn:", meeting?.micOn);
    console.log("🎤 Controls component - meeting.localParticipant:", meeting?.localParticipant);
  }, [meeting, toggleMic, localMicState]);

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
        <p className="mb-4 text-lg font-semibold">
          Are you sure you want to end the appointment?
        </p>
        <div className="flex space-x-4">
          <button
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
            onClick={async () => {
              localStorage.setItem(
                "Ended",
                JSON.stringify({ meetingId, patientId })
              );

              try {
                const response = await axios.put(
                  `${process.env.REACT_APP_BACKEND_URL}/appointments`,
                  {
                    meetingId,
                    ID: patientId,
                  }
                );

                if (response.data.success) {
                  console.log("Appointment status updated to 'Complete'.");
                } else {
                  console.log(
                    "No changes made: Appointment is already 'Complete'."
                  );
                }
              } catch (error) {
                console.error(
                  "Error updating appointment status:",
                  error.message
                );
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
    event.returnValue = "";
  };

  const handlePopState = useCallback(
    (event) => {
      event.preventDefault();

      const confirmToast = toast(
        <div>
          <p className="text-sm text-gray-600">
            Any unsaved changes will be lost.
          </p>
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
                window.history.pushState(null, "", window.location.href);
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
    },
    [handleLeave]
  );

  useEffect(() => {
    // Add event listeners for beforeunload and popstate
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    // Push the current state to history to track it
    window.history.pushState(null, "", window.location.href);

    return () => {
      // Cleanup event listeners on unmount
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [handlePopState]); // useCallback ensures handlePopState is stable

  const handleToggleMic = () => {
    console.log("🎤 handleToggleMic called");
    console.log("🎤 Current localMicState:", localMicState);
    console.log("🎤 toggleMic function type:", typeof toggleMic);
    console.log("🎤 Meeting object:", meeting);

    if (typeof toggleMic === "function") {
      console.log("🎤 Calling toggleMic()...");
      try {
        toggleMic();
        console.log("✅ toggleMic() called successfully");
        // Log state after a short delay to see the change
        setTimeout(() => {
          console.log("🎤 Mic state after toggle:", meeting?.localMicOn);
        }, 100);
      } catch (error) {
        console.error("❌ Error calling toggleMic():", error);
      }
    } else {
      console.error("❌ toggleMic is not available on meeting object", meeting);
      console.error("❌ Available meeting properties:", Object.keys(meeting || {}));
    }
  };

  return (
    <div
      className="controls-bar -mt-1 flex flex-row gap-4 sm:gap-5 sm:top-[110px] sm:transform-none sm:z-0 sm:mt-0 sm:w-auto"
      style={{
        flexDirection: "row",
        left: "32%",
        zIndex: 0,
        transform: "translateX(-100%)",
        borderRadius: "20px",
        gap: "20px",
        top: "85px",
      }}
    >
      <Button
        onClick={() => handleEndAppointment(false)}
        className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 text-xs sm:text-base"
      >
        End Appointment
      </Button>
      <Button onClick={handleToggleMic} className="text-xs sm:text-base">
        {localMicState ? <Mic size={20} /> : <MicOff size={20} />}
      </Button>

      {/* <Button
        onClick={() => handleToggleWebcam()}
        className="text-xs sm:text-base"
      >
        Web Cam
      </Button> */}
    </div>
  );
}

function MeetingView(props) {
  const [joined, setJoined] = useState(null);
  const { join, participants, leave, localParticipant } = useMeeting({
    onMeetingJoined: () => {
      console.log("✅ Meeting joined successfully");
      console.log("👥 Local participant:", localParticipant);
      props.setMeetingJoined(true);
      setJoined("JOINED");

    },
    onMeetingLeft: () => {
      console.log("👋 Meeting left");
      props.onMeetingLeave();
    },
    onParticipantJoined,
  });

  // Log participants whenever they change
  useEffect(() => {
    console.log("👥 Participants updated:", participants.size);
    console.log("👥 Participant IDs:", [...participants.keys()]);
  }, [participants]);

  const joinMeeting = () => {
    console.log("🚪 Joining meeting...");
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
          <div className="flex flex-row gap-4 justify-center">
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
        <Button onClick={joinMeeting} className="ml-[47%] mt-[20%]">
          Join
        </Button>
      )}
    </div>
  );
}

function VIDEOSDK(props) {
  const { meetingid, patientid } = useParams(); // Extract patient ID from the URL
  const [customTrack, setCustomTrack] = useState(null);
  const [meetingId, setMeetingId] = useState(meetingid);
  const [patientId, setPatientId] = useState(patientid);
  const [authToken, setAuthToken] = useState(null); // Store the authToken in the state
  const navigate = useNavigate(); // Create a navigate instance

  // Request notification permissions
  const requestNotificationPermission = async () => {
    console.log("🔔 Requesting notification permission...");
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      console.log("🔔 Notification permission status:", permission);
      if (permission === "granted") {
        console.log("✅ Notification permission granted");
      } else if (permission === "denied") {
        console.warn("❌ Notification permission denied");
      } else {
        console.warn("⚠️ Notification permission dismissed");
      }
    } else {
      console.warn("⚠️ Notifications not supported in this browser");
    }
  };

  // Check and log microphone permissions
  const checkMicrophonePermissions = async () => {
    console.log("🎤 Checking microphone permissions...");
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const micPermission = await navigator.permissions.query({ name: 'microphone' });
        console.log("🎤 Microphone permission state:", micPermission.state);

        micPermission.onchange = () => {
          console.log("🎤 Microphone permission changed to:", micPermission.state);
        };
      } else {
        console.warn("⚠️ Permissions API not supported");
      }
    } catch (error) {
      console.error("❌ Error checking microphone permissions:", error);
    }
  };

  // Request microphone access with detailed logging
  const requestMicrophoneAccess = async () => {
    console.log("🎤 Requesting microphone access...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("✅ Microphone access granted");
      console.log("🎤 Audio tracks:", stream.getAudioTracks());
      stream.getTracks().forEach(track => {
        console.log(`🎤 Track: ${track.kind}, enabled: ${track.enabled}, muted: ${track.muted}, readyState: ${track.readyState}`);
        track.stop(); // Stop the track after checking
      });
      return true;
    } catch (error) {
      console.error("❌ Error accessing microphone:", error);
      console.error("❌ Error name:", error.name);
      console.error("❌ Error message:", error.message);

      if (error.name === "NotAllowedError") {
        console.error("❌ Microphone permission denied by user");
        toast.error("Microphone permission denied. Please allow microphone access in your browser settings.");
      } else if (error.name === "NotFoundError") {
        console.error("❌ No microphone device found");
        toast.error("No microphone device found. Please connect a microphone.");
      } else if (error.name === "NotReadableError") {
        console.error("❌ Microphone is already in use by another application");
        toast.error("Microphone is already in use. Please close other applications using the microphone.");
      } else {
        toast.error(`Microphone error: ${error.message}`);
      }
      return false;
    }
  };

  // List available media devices
  const listMediaDevices = async () => {
    console.log("📱 Listing available media devices...");
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(device => device.kind === 'audioinput');
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      const videoInputs = devices.filter(device => device.kind === 'videoinput');

      console.log("📱 Audio input devices:", audioInputs.length);
      audioInputs.forEach((device, index) => {
        console.log(`  ${index + 1}. ${device.label || 'Unnamed device'} (${device.deviceId})`);
      });

      console.log("📱 Audio output devices:", audioOutputs.length);
      audioOutputs.forEach((device, index) => {
        console.log(`  ${index + 1}. ${device.label || 'Unnamed device'} (${device.deviceId})`);
      });

      console.log("📱 Video input devices:", videoInputs.length);
      videoInputs.forEach((device, index) => {
        console.log(`  ${index + 1}. ${device.label || 'Unnamed device'} (${device.deviceId})`);
      });
    } catch (error) {
      console.error("❌ Error listing media devices:", error);
    }
  };

  const getTrack = async () => {
    console.log("📹 Creating custom camera video track...");
    try {
      const track = await createCameraVideoTrack({
        optimizationMode: "motion",
        encoderConfig: "h1440p_w1920p",
        facingMode: "environment",
      });
      console.log("✅ Custom camera video track created:", track);
      setCustomTrack(track);
    } catch (error) {
      console.error("❌ Error creating custom camera video track:", error);
    }
  };

  useEffect(() => {
    console.log("🚀 VideoSDK component mounted");
    console.log("🔗 Meeting ID:", meetingid);
    console.log("👤 Patient ID:", patientid);

    // Fetch the authToken when the component mounts
    const fetchToken = async () => {
      console.log("🔑 Fetching auth token...");
      const token = await getAuthToken(); // Get the authToken from the API
      console.log("✅ Auth token fetched:", token ? "Token received" : "No token");
      setAuthToken(token); // Update state with the fetched token
    };

    const initializeMedia = async () => {
      await requestNotificationPermission();
      await checkMicrophonePermissions();
      await listMediaDevices();
      const micAccess = await requestMicrophoneAccess();
      console.log("🎤 Microphone access result:", micAccess);
    };

    fetchToken();
    getTrack();
    initializeMedia();
  }, []);

  const onMeetingLeave = () => {
    console.log("🚪 onMeetingLeave called");
    props.setMeetingJoined(false);
    setMeetingId(null);
    setPatientId(null);
    navigate("/dashboard"); // Navigate to the dashboard on meeting leave
  };

  // Log MeetingProvider configuration
  useEffect(() => {
    if (authToken && meetingId) {
      console.log("🎬 MeetingProvider configuration:");
      console.log("  - meetingId:", meetingId);
      console.log("  - micEnabled:", true);
      console.log("  - webcamEnabled:", false);
      console.log("  - customCameraVideoTrack:", customTrack ? "Available" : "Not available");
      console.log("  - authToken:", authToken ? "Available" : "Not available");
    }
  }, [authToken, meetingId, customTrack]);

  return authToken && meetingId ? (
    <MeetingProvider
      config={{
        meetingId,
        micEnabled: true,
        webcamEnabled: false,
        name: "Web-App",
        customCameraVideoTrack: customTrack,
      }}
      token={authToken} // Use the token from the state
    >
      <MeetingView
        meetingId={meetingId}
        patientId={patientId} // Pass patientId to MeetingView
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


