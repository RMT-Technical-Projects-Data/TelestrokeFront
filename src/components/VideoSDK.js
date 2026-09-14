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
import loading from "../assets/btn_loading.gif";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Mic, MicOff, Video } from "lucide-react";
import ConfirmModal from "./ConfirmModal";

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
        <div className="ts-exam-participant">
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
              height="100%"
              width="100%"
              onError={(err) => {
                console.log(err, "participant video error");
              }}
            />
          ) : (
            null
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
  const [endOpen, setEndOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

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

  const confirmLeaveMeeting = () => {
    setEndOpen(false);
    setLeaveOpen(false);
    setTimeout(() => {
      handleLeave();
    }, 200);
  };

  const handleEndAppointment = () => {
    setEndOpen(true);
  };

  const handleBeforeUnload = (event) => {
    event.preventDefault();
    event.returnValue = "";
  };

  const handlePopState = useCallback(
    (event) => {
      event.preventDefault();
      setLeaveOpen(true);
      window.history.pushState(null, "", window.location.href);
    },
    []
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
    <div className="ts-exam-controls-bar">
      <button
        type="button"
        onClick={handleEndAppointment}
        className="ts-btn ts-btn-danger"
      >
        End Appointment
      </button>
      <button type="button" onClick={handleToggleMic} className="ts-btn ts-btn-ghost">
        {localMicState ? <Mic size={16} /> : <MicOff size={16} />}
        {localMicState ? "Mute" : "Unmute"}
      </button>
      <ConfirmModal
        isOpen={endOpen}
        onClose={() => setEndOpen(false)}
        onConfirm={confirmLeaveMeeting}
        title="End appointment?"
        message="This will leave the live exam. Unsaved exam data may be lost."
        confirmLabel="End Appointment"
        danger
      />
      <ConfirmModal
        isOpen={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={confirmLeaveMeeting}
        title="Leave this exam?"
        message="Any unsaved changes will be lost if you leave now."
        confirmLabel="Leave"
        danger
      />

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
    <div className="ts-exam-video-inner">
      {joined && joined === "JOINED" ? (
        <>
          <div className="ts-exam-player">
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
        </>
      ) : joined && joined === "JOINING" ? (
        <div className="ts-exam-join">
          <img src={loading} width={48} height={48} alt="" />
          <h3>Connecting</h3>
          <p>Joining meeting {props.meetingId || ""}…</p>
        </div>
      ) : (
        <div className="ts-exam-join">
          <div className="ts-exam-join-icon">
            <Video size={28} />
          </div>
          <h3>Join live exam</h3>
          <p>Meeting ID {props.meetingId || "—"}{props.patientId ? ` · Patient ${props.patientId}` : ""}</p>
          <button type="button" onClick={joinMeeting} className="ts-btn ts-btn-primary">
            Join exam
          </button>
        </div>
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


