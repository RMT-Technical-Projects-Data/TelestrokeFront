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
  const { toggleMic, toggleWebcam, localMicOn } = useMeeting({
    onParticipantJoined,
  });
  

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
                  `${process.env.REACT_APP_BACKEND_URL}/api/appointments`,
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

  const handleToggleMic = async () => {
  try {
    // Try to get mic access to trigger permission prompt
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // If the user clicked "Allow", we got access
    stream.getTracks().forEach(track => track.stop()); // Stop test stream
    toggleMic(); // This will turn mic ON in VideoSDK
    console.log(" Mic permission granted. Mic toggled ON.");
  } catch (error) {
    console.error("Mic access denied or error:", error);

    // If permission is blocked or user clicked "Block"
    if (
      error.name === "NotAllowedError" ||
      error.name === "PermissionDeniedError"
    ) {
      alert(
        "Microphone permission is blocked.\n\nTo enable it:\n1. Click the 🔒 padlock icon in your browser's address bar.\n2. Go to 'Site settings'.\n3. Set Microphone permission to 'Allow'.\n\nThen reload the page and try again."
      );
    } else {
      alert("An unexpected error occurred while accessing microphone.");
    }
  }
};


  // const handleToggleMic = () => {
  //   // Toggling Mic
  //   // console.log(toggleMic());

  //   toggleMic();
  // };

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
  <img
    src={
      localMicOn
        ? "https://img.icons8.com/ios-glyphs/50/FFFFFF/microphone.png"
        : "https://img.icons8.com/ios-glyphs/50/FFFFFF/no-microphone.png"
    }
    width={25}
    height={25}
    alt={localMicOn ? "Microphone on" : "Microphone off"}
  />
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
  const { join, participants, leave, localParticipant} = useMeeting({
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
          <div className="flex flex-row gap-4 flex justify-center">
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

  const getTrack = async () => {
    const track = await createCameraVideoTrack({
      optimizationMode: "motion",
      encoderConfig: "h1440p_w1920p",
      facingMode: "environment",
    });
    setCustomTrack(track);
  };

  useEffect(() => {
    // Fetch the authToken when the component mounts
    const fetchToken = async () => {
      const token = await getAuthToken(); // Get the authToken from the API
      setAuthToken(token); // Update state with the fetched token
    };
    fetchToken();
    getTrack();
  }, []);

  const onMeetingLeave = () => {
    props.setMeetingJoined(false);
    setMeetingId(null);
    setPatientId(null);
    navigate("/dashboard"); // Navigate to the dashboard on meeting leave
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
// import React, {
//   useEffect,
//   useMemo,
//   useRef,
//   useState,
//   useCallback,
// } from "react";
// import "../App.css";
// import {
//   MeetingProvider,
//   useMeeting,
//   useParticipant,
//   createCameraVideoTrack,
// } from "@videosdk.live/react-sdk";
// import { getAuthToken } from "../API"; // Import getAuthToken instead of authToken
// import { useNavigate, useParams } from "react-router-dom";
// import ReactPlayer from "react-player";
// import Button from "./Button";
// import loading from "../assets/btn_loading.gif";
// import axios from "axios";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// // function JoinScreen({ getMeetingAndToken }) {
// //   const { meetingid } = useParams();
// //   const [meetingId, setMeetingId] = useState(meetingid);

// //   const onClick = async () => {
// //     await getMeetingAndToken(meetingId);
// //   };

// //   return (
// //     <div>
// //       <button onClick={onClick}>Join</button>
// //     </div>
// //   );
// // }

// function ParticipantView(props) {
//   const micRef = useRef(null);
//   const { webcamStream, micStream, webcamOn, micOn, isLocal } = useParticipant(
//     props.participantId
//   );

//   const videoStream = useMemo(() => {
//     if (webcamOn && webcamStream) {
//       const mediaStream = new MediaStream();
//       mediaStream.addTrack(webcamStream.track);
//       return mediaStream;
//     }
//   }, [webcamStream, webcamOn]);

//   useEffect(() => {
//     console.log("MicStream Debug — Participant:", props.participantId);
//     console.log("micOn:", micOn);
//     console.log("micStream:", micStream);
//     if (micRef.current) {
//       if (micOn && micStream) {
//         const mediaStream = new MediaStream();
//         mediaStream.addTrack(micStream.track);

//         micRef.current.srcObject = mediaStream;
//         micRef.current
//           .play()
//           .catch((error) =>
//             console.error("videoElem.current.play() failed", error)
//           );
//       } else {
//         micRef.current.srcObject = null;
//       }
//     }
//   }, [micStream, micOn]);

//   return (
//     <>
//       {props.index > 0 ? (
//         <div className="p-2">
//           <audio ref={micRef} autoPlay playsInline muted={isLocal} />
//           {webcamOn ? (
//             <ReactPlayer
//               playsinline
//               pip={false}
//               light={false}
//               controls={false}
//               muted={false}
//               playing={true}
//               url={videoStream}
//               height="580px"
//               width="800px"
//               onError={(err) => {
//                 console.log(err, "participant video error");
//               }}
//             />
//           ) : (
//             <h1>Webcam off</h1>
//           )}
//         </div>
//       ) : (
//         <></>
//       )}
//     </>
//   );
// }

// function onParticipantJoined(participant) {
//   console.log(participant);
//   participant.setQuality("high");
// }

// function Controls({ customTrack, handleLeave, meetingId, patientId }) {
//   const { toggleMic, toggleWebcam, localMicOn } = useMeeting({
//     onParticipantJoined,
//   });
  

//   const handleToggleWebcam = () => {
//     if (customTrack) {
//       toggleWebcam(customTrack);
//     } else {
//       console.error("Custom track is not available");
//     }
//   };

//   const handleEndAppointment = async (shouldReload = false) => {
//     const confirmToast = toast(
//       <div>
//         <p className="mb-4 text-lg font-semibold">
//           Are you sure you want to end the appointment?
//         </p>
//         <div className="flex space-x-4">
//           <button
//             className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
//             onClick={async () => {
//               localStorage.setItem(
//                 "Ended",
//                 JSON.stringify({ meetingId, patientId })
//               );

//               try {
//                 const response = await axios.put(
//                   `${process.env.REACT_APP_BACKEND_URL}/api/appointments`,
//                   {
//                     meetingId,
//                     ID: patientId,
//                   }
//                 );

//                 if (response.data.success) {
//                   console.log("Appointment status updated to 'Complete'.");
//                 } else {
//                   console.log(
//                     "No changes made: Appointment is already 'Complete'."
//                   );
//                 }
//               } catch (error) {
//                 console.error(
//                   "Error updating appointment status:",
//                   error.message
//                 );
//               }

//               setTimeout(() => {
//                 handleLeave();
//               }, 500);

//               localStorage.removeItem("Ended");
//               toast.dismiss(confirmToast);

//               if (shouldReload) {
//                 window.location.reload();
//               }
//             }}
//           >
//             Yes
//           </button>
//           <button
//             className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
//             onClick={() => {
//               toast.dismiss(confirmToast);
//             }}
//           >
//             No
//           </button>
//         </div>
//       </div>,
//       {
//         position: "top-center",
//         autoClose: false,
//         closeOnClick: false,
//         draggable: false,
//         theme: "light",
//       }
//     );
//   };

//   const handleBeforeUnload = (event) => {
//     event.preventDefault();
//     event.returnValue = "";
//   };

//   const handlePopState = useCallback(
//     (event) => {
//       event.preventDefault();

//       const confirmToast = toast(
//         <div>
//           <p className="text-sm text-gray-600">
//             Any unsaved changes will be lost.
//           </p>
//           <div className="flex space-x-4 mt-4">
//             <button
//               className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
//               onClick={() => {
//                 toast.dismiss(confirmToast);
//                 setTimeout(() => {
//                   handleLeave();
//                 }, 500); // Trigger end appointment logic if user confirms
//               }}
//             >
//               Yes
//             </button>
//             <button
//               className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
//               onClick={() => {
//                 toast.dismiss(confirmToast);
//                 // Push the current state back to history to prevent navigation
//                 window.history.pushState(null, "", window.location.href);
//               }}
//             >
//               No
//             </button>
//           </div>
//         </div>,
//         {
//           position: "top-center",
//           autoClose: false,
//           closeOnClick: false,
//           draggable: false,
//           theme: "light",
//         }
//       );
//     },
//     [handleLeave]
//   );

//   useEffect(() => {
//     // Add event listeners for beforeunload and popstate
//     window.addEventListener("beforeunload", handleBeforeUnload);
//     window.addEventListener("popstate", handlePopState);

//     // Push the current state to history to track it
//     window.history.pushState(null, "", window.location.href);

//     return () => {
//       // Cleanup event listeners on unmount
//       window.removeEventListener("beforeunload", handleBeforeUnload);
//       window.removeEventListener("popstate", handlePopState);
//     };
//   }, [handlePopState]); // useCallback ensures handlePopState is stable

//   const handleToggleMic = () => {
//     // Toggling Mic
//     console.log(toggleMic());

//     toggleMic();
//   };

//   return (
//     <div
//       className="controls-bar -mt-1 flex flex-row gap-4 sm:gap-5 sm:top-[110px] sm:transform-none sm:z-0 sm:mt-0 sm:w-auto"
//       style={{
//         flexDirection: "row",
//         zIndex: 0,
//         transform: "translateX(-100%)",
//         borderRadius: "20px",
//         gap: "20px",
//         top: "85px",
//       }}
//     >
//       <Button
//         onClick={() => handleEndAppointment(false)}
//         className="bg-red-500 text-white p-2 rounded-md hover:bg-red-600 text-xs sm:text-base"
//       >
//         End Appointment
//       </Button>
//       <Button onClick={handleToggleMic} className="text-xs sm:text-base">
//         <img
//           src={
//             localMicOn
//               ? "https://img.icons8.com/ios-glyphs/50/FFFFFF/microphone.png"
//               : "https://img.icons8.com/ios-glyphs/50/FFFFFF/no-microphone.png"
//           }
//           width={25}
//           height={25}
//           alt={localMicOn ? "Microphone on" : "Microphone off"}
//         />
//       </Button>
//       <Button
//         onClick={() => handleToggleWebcam()}
//         className="text-xs sm:text-base"
//       >
//         Web Cam
//       </Button>
//     </div>
//   );
// }

// function MeetingView(props) {
//   const [joined, setJoined] = useState(null);
//   const { join, participants, leave, localParticipant} = useMeeting({
//     onMeetingJoined: () => {
//       props.setMeetingJoined(true);
//       setJoined("JOINED");
      
//     },
//     onMeetingLeft: () => {
//       props.onMeetingLeave();
//     },
//     onParticipantJoined,
//   });



//   const joinMeeting = () => {
//     setJoined("JOINING");
//     join();
//   };

//   const handleLeaveAndNavigate = () => {
//     leave(); // Call the leave function from useMeeting
//     props.onMeetingLeave(); // Call the prop function to handle leaving
//   };

//   // Detect navigation and leave the meeting
//   useEffect(() => {
//     return () => {
//       handleLeaveAndNavigate();
//     };
//   }, []);

//   return (
//     <div className="container">
//       {joined && joined === "JOINED" ? (
//         <div>
//           <div className="flex flex-row gap-4 flex justify-center">
//             {[...participants.keys()].map((participantId, index) => (
//               <ParticipantView
//                 index={index}
//                 participantId={participantId}
//                 key={participantId}
//               />
//             ))}
//           </div>
//           <Controls
//             customTrack={props.customTrack}
//             handleLeave={handleLeaveAndNavigate}
//             meetingId={props.meetingId}
//             patientId={props.patientId}
//           />
//         </div>
//       ) : joined && joined === "JOINING" ? (
//         <div className="ml-[50%] mt-[25%]">
//           <img
//             src={loading}
//             width={50}
//             height={50}
//             alt="Loading..." // Added alt text for accessibility
//           />
//         </div>
//       ) : (
//         <div className="fixed inset-0 flex justify-center items-center bg-white z-50">
//           <Button 
//             onClick={joinMeeting} 
//             className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl text-3xl font-extrabold shadow-2xl transition-transform transform hover:scale-110 duration-300"
//           >
//             Join Meeting
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// }

// function VIDEOSDK(props) {
//   const { meetingid, patientid } = useParams(); // Extract patient ID from the URL
//   const [customTrack, setCustomTrack] = useState(null);
//   const [meetingId, setMeetingId] = useState(meetingid);
//   const [patientId, setPatientId] = useState(patientid);
//   const [authToken, setAuthToken] = useState(null); // Store the authToken in the state
//   const navigate = useNavigate(); // Create a navigate instance

//   const getTrack = async () => {
//     const track = await createCameraVideoTrack({
//       optimizationMode: "motion",
//       encoderConfig: "h1440p_w1920p",
//       facingMode: "environment",
//     });
//     setCustomTrack(track);
//   };

//   useEffect(() => {
//     // Fetch the authToken when the component mounts
//     const fetchToken = async () => {
//       const token = await getAuthToken(); // Get the authToken from the API
//       setAuthToken(token); // Update state with the fetched token
//     };
//     fetchToken();
//     getTrack();
//   }, []);

//   const onMeetingLeave = () => {
//     props.setMeetingJoined(false);
//     setMeetingId(null);
//     setPatientId(null);
//     navigate("/dashboard"); // Navigate to the dashboard on meeting leave
//   };

//   return authToken && meetingId ? (
//     <MeetingProvider
//       config={{
//         meetingId,
//         micEnabled: true,
//         webcamEnabled: false,
//         name: "Web-App",
//         customCameraVideoTrack: customTrack,
//       }}
//       token={authToken} // Use the token from the state
//     >
//       <MeetingView
//         meetingId={meetingId}
//         patientId={patientId} // Pass patientId to MeetingView
//         onMeetingLeave={onMeetingLeave}
//         customTrack={customTrack}
//         setMeetingJoined={props.setMeetingJoined}
//       />
//     </MeetingProvider>
//   ) : (
//     <></>
//   );
// }

// export default VIDEOSDK;

