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
import loading from "../assets/loading.gif";

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

function Controls({ customTrack, handleLeave }) {
  const { toggleMic, toggleWebcam, localMicOn } = useMeeting({ onParticipantJoined });

  const handleToggleWebcam = () => {
    if (customTrack) {
      toggleWebcam(customTrack);
    } else {
      console.error("Custom track is not available");
    }
  };

  return (
    <div className="controls-bar"> {/* Add a div with a class */}
      <Button onClick={handleLeave}>End Appointment</Button>
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
          <Controls customTrack={props.customTrack} handleLeave={handleLeaveAndNavigate} />
        </div>
      ) : joined && joined === "JOINING" ? (
        <div className="ml-[50%] mt-[25%]"><img src={loading} width={50} height={50}></img></div>
      ) : (
        <Button onClick={joinMeeting} className="ml-[45%] mt-[25%]">Start Appointment</Button>
      )}
    </div>
  );
}

function VIDEOSDK(props) {
  const { meetingid } = useParams();
  const [customTrack, setCustomTrack] = useState(null);
  const [meetingId, setMeetingId] = useState(meetingid);
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
      <MeetingView meetingId={meetingId} onMeetingLeave={onMeetingLeave} customTrack={customTrack} setMeetingJoined={props.setMeetingJoined} />
    </MeetingProvider>
  ) : (
    <></>
  );
}

export default VIDEOSDK;
