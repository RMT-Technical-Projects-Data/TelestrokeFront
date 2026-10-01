// import React, { useEffect, useRef, useState, useCallback } from "react";
// import { useNavigate, useParams } from "react-router-dom";
// import { toast } from "react-toastify";
// import "react-toastify/ReactToastify.css";
// import { Mic, MicOff, Video, VideoOff } from "lucide-react";
// import ConfirmModal from "./ConfirmModal";
// import "../App.css";

// const SIGNALING_URL =
//   process.env.REACT_APP_SIGNALING_URL || "ws://localhost:3002";

// const ICE_SERVERS = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     { urls: "stun:stun1.l.google.com:19302" },
//     {
//       urls: "turn:openrelay.metered.ca:80",
//       username: "openrelayproject",
//       credential: "openrelayproject",
//     },
//     {
//       urls: "turn:openrelay.metered.ca:443",
//       username: "openrelayproject",
//       credential: "openrelayproject",
//     },
//   ],
// };

// const MIC_TEST_DURATION = 10; // seconds

// function VideoCall({
//   meetingId: propMeetingId,
//   patientId: propPatientId,
//   onMeetingLeave,
//   setMeetingJoined,
//   role = "patient",
//   autoJoin = false,
// }) {
//   const isDoctor = role === "doctor";

//   const { meetingid, patientid } = useParams();
//   const meetingId = propMeetingId || meetingid;
//   const patientId = propPatientId || patientid;
//   const navigate = useNavigate();

//   // ---------- State ----------
//   const [joined, setJoined] = useState(false);
//   const [joining, setJoining] = useState(false);
//   const [micOn, setMicOn] = useState(true);
//   const [camOn, setCamOn] = useState(!isDoctor);
//   const [peerIds, setPeerIds] = useState([]);
//   const [endOpen, setEndOpen] = useState(false);
//   const [leaveOpen, setLeaveOpen] = useState(false);

//   // Device picker
//   const [audioDevices, setAudioDevices] = useState([]);
//   const [selectedAudioId, setSelectedAudioId] = useState("");
//   const [devicesLoaded, setDevicesLoaded] = useState(false);
//   const [showDevicePicker, setShowDevicePicker] = useState(false);

//   // Mic testing
//   const [isTesting, setIsTesting] = useState(false);
//   const [timeLeft, setTimeLeft] = useState(MIC_TEST_DURATION);

//   // ---------- Refs ----------
//   const wsRef = useRef(null);
//   const localStreamRef = useRef(null);
//   const localVideoRef = useRef(null);
//   const peersRef = useRef(new Map());
//   const remoteVideosRef = useRef(new Map());
//   const userIdRef = useRef(
//     `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
//   );

//   // Mic test refs
//   const testStreamRef = useRef(null);
//   const audioContextRef = useRef(null);
//   const analyserRef = useRef(null);
//   const animationFrameRef = useRef(null);
//   const canvasRef = useRef(null);
//   const countdownTimerRef = useRef(null);
//   const testStartTimeRef = useRef(null);

//   // ============================================================
//   // PEER MANAGEMENT
//   // ============================================================
//   const removePeer = useCallback((remoteUserId) => {
//     const peer = peersRef.current.get(remoteUserId);
//     if (peer) {
//       peer.pc.close();
//       peersRef.current.delete(remoteUserId);
//     }
//     remoteVideosRef.current.delete(remoteUserId);
//     setPeerIds((prev) => prev.filter((id) => id !== remoteUserId));
//   }, []);

//   const createPeer = useCallback(
//     (remoteUserId, initiator, stream) => {
//       if (peersRef.current.has(remoteUserId)) {
//         return peersRef.current.get(remoteUserId).pc;
//       }

//       const pc = new RTCPeerConnection(ICE_SERVERS);
//       const remoteStream = new MediaStream();

//       if (stream) {
//         stream.getTracks().forEach((track) => pc.addTrack(track, stream));
//       }

//       pc.ontrack = (event) => {
//         console.log("Remote track received from", remoteUserId, ":", event.track.kind);

//         if (event.track && !remoteStream.getTracks().includes(event.track)) {
//           remoteStream.addTrack(event.track);
//         }

//         const videoEl = remoteVideosRef.current.get(remoteUserId);
//         if (videoEl && videoEl.srcObject !== remoteStream) {
//           videoEl.srcObject = remoteStream;
//           videoEl.play().catch((e) => {
//             if (e.name !== "AbortError") console.error("Play error:", e);
//           });
//         }
//       };

//       pc.onicecandidate = (event) => {
//         if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
//           wsRef.current.send(
//             JSON.stringify({
//               type: "ice-candidate",
//               target: remoteUserId,
//               candidate: event.candidate,
//             })
//           );
//         }
//       };

//       pc.onconnectionstatechange = () => {
//         console.log(`Peer ${remoteUserId}:`, pc.connectionState);
//         if (["failed", "closed"].includes(pc.connectionState)) {
//           removePeer(remoteUserId);
//         }
//       };

//       peersRef.current.set(remoteUserId, { pc, remoteStream });

//       if (initiator) {
//         pc.onnegotiationneeded = async () => {
//           try {
//             const offer = await pc.createOffer();
//             await pc.setLocalDescription(offer);
//             if (wsRef.current?.readyState === WebSocket.OPEN) {
//               wsRef.current.send(
//                 JSON.stringify({
//                   type: "offer",
//                   target: remoteUserId,
//                   sdp: pc.localDescription,
//                 })
//               );
//             }
//           } catch (e) {
//             console.error("Offer creation error:", e);
//           }
//         };
//       }

//       return pc;
//     },
//     [removePeer]
//   );

//   // ============================================================
//   // DEVICE LOADING
//   // ============================================================
//   const loadDevices = useCallback(async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       await new Promise((r) => setTimeout(r, 150));

//       const devices = await navigator.mediaDevices.enumerateDevices();
//       const allMics = devices.filter((d) => d.kind === "audioinput");

//       const mics = allMics.filter((d) => {
//         const deviceId = (d.deviceId || "").toLowerCase();
//         return deviceId !== "default" && deviceId !== "communications";
//       });

//       setAudioDevices(mics);

//       setSelectedAudioId((prev) => {
//         if (prev && mics.some((m) => m.deviceId === prev)) return prev;
//         return mics[0]?.deviceId || "";
//       });

//       setDevicesLoaded(true);
//       stream.getTracks().forEach((t) => t.stop());
//     } catch (err) {
//       console.error("Microphone access error:", err);
//       toast.error("Microphone permission denied");
//     }
//   }, []);

//   useEffect(() => {
//     if (!joined) {
//       loadDevices();
//     }
//   }, [joined, loadDevices]);

//   useEffect(() => {
//     const handleDeviceChange = () => loadDevices();
//     navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
//     return () => {
//       navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
//     };
//   }, [loadDevices]);

//   useEffect(() => {
//     if (showDevicePicker) loadDevices();
//   }, [showDevicePicker, loadDevices]);

//   // ============================================================
//   // WAVEFORM DRAWING
//   // ============================================================
//   // const drawWaveform = useCallback(() => {
//   //   if (!canvasRef.current || !analyserRef.current) return;

//   //   const canvas = canvasRef.current;
//   //   const ctx = canvas.getContext("2d");
//   //   const analyser = analyserRef.current;

//   //   const bufferLength = analyser.frequencyBinCount;
//   //   const dataArray = new Uint8Array(bufferLength);

//   //   const draw = () => {
//   //     if (!analyserRef.current) return;

//   //     animationFrameRef.current = requestAnimationFrame(draw);

//   //     analyser.getByteTimeDomainData(dataArray);

//   //     // Canvas setup — high DPI
//   //     const dpr = window.devicePixelRatio || 1;
//   //     const rect = canvas.getBoundingClientRect();
//   //     canvas.width = rect.width * dpr;
//   //     canvas.height = rect.height * dpr;
//   //     ctx.scale(dpr, dpr);

//   //     const width = rect.width;
//   //     const height = rect.height;

//   //     // Background
//   //     ctx.fillStyle = "#f8fafc";
//   //     ctx.fillRect(0, 0, width, height);

//   //     // Center line (baseline)
//   //     ctx.strokeStyle = "#cbd5e1";
//   //     ctx.lineWidth = 1;
//   //     ctx.setLineDash([4, 4]);
//   //     ctx.beginPath();
//   //     ctx.moveTo(0, height / 2);
//   //     ctx.lineTo(width, height / 2);
//   //     ctx.stroke();
//   //     ctx.setLineDash([]);

//   //     // Waveform
//   //     ctx.lineWidth = 2;
//   //     ctx.strokeStyle = "#3b4fdf";
//   //     ctx.beginPath();

//   //     const sliceWidth = width / bufferLength;
//   //     let x = 0;

//   //     for (let i = 0; i < bufferLength; i++) {
//   //       const v = dataArray[i] / 128.0; // 0 to 2, center at 1
//   //       const y = (v * height) / 2;

//   //       if (i === 0) {
//   //         ctx.moveTo(x, y);
//   //       } else {
//   //         ctx.lineTo(x, y);
//   //       }

//   //       x += sliceWidth;
//   //     }

//   //     ctx.lineTo(width, height / 2);
//   //     ctx.stroke();

//   //     // Update countdown
//   //     if (testStartTimeRef.current) {
//   //       const elapsed = (Date.now() - testStartTimeRef.current) / 1000;
//   //       const remaining = Math.max(0, MIC_TEST_DURATION - elapsed);
//   //       setTimeLeft(Math.ceil(remaining));
//   //     }
//   //   };

//   //   draw();
//   // }, []);

// const drawWaveform = useCallback(() => {
//   if (!canvasRef.current || !analyserRef.current) return;

//   const canvas = canvasRef.current;
//   const ctx = canvas.getContext("2d");
//   const analyser = analyserRef.current;

//   const bufferLength = analyser.frequencyBinCount;
//   const dataArray = new Uint8Array(bufferLength);

//   const draw = () => {
//     if (!analyserRef.current) return;

//     animationFrameRef.current = requestAnimationFrame(draw);

//     analyser.getByteTimeDomainData(dataArray);

//     // Canvas setup — high DPI
//     const dpr = window.devicePixelRatio || 1;
//     const rect = canvas.getBoundingClientRect();
//     canvas.width = rect.width * dpr;
//     canvas.height = rect.height * dpr;
//     ctx.scale(dpr, dpr);

//     const width = rect.width;
//     const height = rect.height;

//     // ✅ Read theme colors from CSS variables
//     const styles = getComputedStyle(document.documentElement);
//     const bgColor = styles.getPropertyValue("--ts-surface").trim() || "#fff";
//     const borderColor = styles.getPropertyValue("--ts-border").trim() || "#cbd5e1";
//     const accentColor = styles.getPropertyValue("--ts-accent").trim() || "#3b4fdf";

//     // Background
//     ctx.fillStyle = bgColor;
//     ctx.fillRect(0, 0, width, height);

//     // Center line (baseline)
//     ctx.strokeStyle = borderColor;
//     ctx.lineWidth = 1;
//     ctx.setLineDash([4, 4]);
//     ctx.beginPath();
//     ctx.moveTo(0, height / 2);
//     ctx.lineTo(width, height / 2);
//     ctx.stroke();
//     ctx.setLineDash([]);

//     // Waveform
//     ctx.lineWidth = 2;
//     ctx.strokeStyle = accentColor;
//     ctx.beginPath();

//     const sliceWidth = width / bufferLength;
//     let x = 0;

//     for (let i = 0; i < bufferLength; i++) {
//       const v = dataArray[i] / 128.0;
//       const y = (v * height) / 2;

//       if (i === 0) {
//         ctx.moveTo(x, y);
//       } else {
//         ctx.lineTo(x, y);
//       }

//       x += sliceWidth;
//     }

//     ctx.lineTo(width, height / 2);
//     ctx.stroke();

//     // Update countdown
//     if (testStartTimeRef.current) {
//       const elapsed = (Date.now() - testStartTimeRef.current) / 1000;
//       const remaining = Math.max(0, MIC_TEST_DURATION - elapsed);
//       setTimeLeft(Math.ceil(remaining));
//     }
//   };

//   draw();
// }, []);
  
//   // ============================================================
//   // MIC TESTING
//   // ============================================================
//   const stopMicTest = useCallback(() => {
//     // Cancel animation
//     if (animationFrameRef.current) {
//       cancelAnimationFrame(animationFrameRef.current);
//       animationFrameRef.current = null;
//     }

//     // Clear countdown
//     if (countdownTimerRef.current) {
//       clearInterval(countdownTimerRef.current);
//       countdownTimerRef.current = null;
//     }

//     // Close audio context
//     if (audioContextRef.current) {
//       audioContextRef.current.close().catch(() => {});
//       audioContextRef.current = null;
//     }

//     analyserRef.current = null;

//     // Stop stream
//     if (testStreamRef.current) {
//       testStreamRef.current.getTracks().forEach((t) => t.stop());
//       testStreamRef.current = null;
//     }

//     testStartTimeRef.current = null;
//     setIsTesting(false);
//     setTimeLeft(MIC_TEST_DURATION);
//   }, []);

//   const startMicTest = useCallback(async () => {
//     stopMicTest();

//     if (!selectedAudioId) {
//       toast.error("Please select a microphone first");
//       return;
//     }

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         audio: { deviceId: { exact: selectedAudioId } },
//       });

//       testStreamRef.current = stream;

//       const audioContext = new (window.AudioContext ||
//         window.webkitAudioContext)();
//       audioContextRef.current = audioContext;

//       const source = audioContext.createMediaStreamSource(stream);
//       const analyser = audioContext.createAnalyser();
//       analyser.fftSize = 2048;
//       analyser.smoothingTimeConstant = 0.8;
//       analyserRef.current = analyser;

//       source.connect(analyser);

//       testStartTimeRef.current = Date.now();
//       setTimeLeft(MIC_TEST_DURATION);
//       setIsTesting(true);

//       // Draw waveform
//       drawWaveform();

//       // Countdown timer
//       countdownTimerRef.current = setInterval(() => {
//         if (!testStartTimeRef.current) return;
//         const elapsed = (Date.now() - testStartTimeRef.current) / 1000;
//         const remaining = MIC_TEST_DURATION - elapsed;

//         if (remaining <= 0) {
//           stopMicTest();
//           toast.success("✅ Mic test complete");
//         } else {
//           setTimeLeft(Math.ceil(remaining));
//         }
//       }, 200);
//     } catch (err) {
//       console.error("🎤 Mic test error:", err);
//       toast.error("Could not test microphone");
//       stopMicTest();
//     }
//   }, [selectedAudioId, stopMicTest, drawWaveform]);

//   // Cleanup on unmount
//   useEffect(() => {
//     return () => {
//       stopMicTest();
//     };
//   }, [stopMicTest]);

//   // Stop test when modal closes
//   useEffect(() => {
//     if (!showDevicePicker && isTesting) {
//       stopMicTest();
//     }
//   }, [showDevicePicker, isTesting, stopMicTest]);

//   // Restart test on device change
//   useEffect(() => {
//     if (isTesting) {
//       startMicTest();
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedAudioId]);

//   // ============================================================
//   // SIGNALING
//   // ============================================================
//   const handleSignalMessage = useCallback(
//     async (msg) => {
//       const { type, from, sdp, candidate, peers } = msg;

//       if (type === "joined") {
//         const stream = localStreamRef.current;
//         setPeerIds(peers || []);
//         for (const peerId of peers || []) {
//           createPeer(peerId, true, stream);
//         }
//       } else if (type === "user-joined") {
//         setPeerIds((prev) => (prev.includes(from) ? prev : [...prev, from]));
//       } else if (type === "offer") {
//         setPeerIds((prev) => (prev.includes(from) ? prev : [...prev, from]));
//         const stream = localStreamRef.current;
//         const pc = createPeer(from, false, stream);
//         try {
//           await pc.setRemoteDescription(new RTCSessionDescription(sdp));
//           const answer = await pc.createAnswer();
//           await pc.setLocalDescription(answer);
//           if (wsRef.current?.readyState === WebSocket.OPEN) {
//             wsRef.current.send(
//               JSON.stringify({ type: "answer", target: from, sdp: pc.localDescription })
//             );
//           }
//         } catch (err) {
//           console.error("Error answering offer from", from, ":", err);
//         }
//       } else if (type === "answer") {
//         const peer = peersRef.current.get(from);
//         if (peer)
//           await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
//       } else if (type === "ice-candidate") {
//         const peer = peersRef.current.get(from);
//         if (peer) {
//           try {
//             await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
//           } catch (e) {
//             console.error("ICE add error:", e);
//           }
//         }
//       } else if (type === "user-left") {
//         removePeer(from);
//       }
//     },
//     [createPeer, removePeer]
//   );

//   // ============================================================
//   // JOIN CALL
//   // ============================================================
//   const joinCall = useCallback(async () => {
//     stopMicTest();
//     setJoining(true);

//     let stream = null;
//     try {
//       const constraints = isDoctor
//         ? {
//             video: false,
//             audio: selectedAudioId
//               ? { deviceId: { exact: selectedAudioId } }
//               : true,
//           }
//         : { video: true, audio: true };

//       stream = await navigator.mediaDevices.getUserMedia(constraints);
//       localStreamRef.current = stream;

//       if (!isDoctor && localVideoRef.current) {
//         localVideoRef.current.srcObject = stream;
//       }
//     } catch (err) {
//       console.error("Media error:", err);
//       toast.error(
//         isDoctor
//           ? "Microphone permission denied"
//           : "Camera/mic permission denied"
//       );
//       setJoining(false);
//       return;
//     }

//     const ws = new WebSocket(SIGNALING_URL);
//     wsRef.current = ws;

//     ws.onopen = () => {
//       ws.send(
//         JSON.stringify({
//           type: "join",
//           roomId: meetingId,
//           userId: userIdRef.current,
//           role,
//         })
//       );
//       setJoined(true);
//       setJoining(false);
//       setMeetingJoined?.(true);
//     };

//     ws.onmessage = (event) => {
//       try {
//         handleSignalMessage(JSON.parse(event.data));
//       } catch (e) {
//         console.error("WS parse error:", e);
//       }
//     };

//     ws.onerror = (err) => {
//       console.error("WS error:", err);
//       toast.error("Signaling server error");
//     };
//   }, [
//     isDoctor,
//     meetingId,
//     role,
//     handleSignalMessage,
//     setMeetingJoined,
//     selectedAudioId,
//     stopMicTest,
//   ]);

//   useEffect(() => {
//     if (autoJoin && !joined && !joining && meetingId) {
//       joinCall();
//     }
//   }, [autoJoin, joined, joining, meetingId, joinCall]);

//   // ============================================================
//   // LEAVE CALL
//   // ============================================================
//   const leaveCall = useCallback(() => {
//     if (wsRef.current?.readyState === WebSocket.OPEN) {
//       wsRef.current.send(JSON.stringify({ type: "leave" }));
//       wsRef.current.close();
//     }
//     peersRef.current.forEach(({ pc }) => pc.close());
//     peersRef.current.clear();
//     remoteVideosRef.current.clear();
//     localStreamRef.current?.getTracks().forEach((t) => t.stop());
//     setJoined(false);
//     setMeetingJoined?.(false);
//     onMeetingLeave?.();
//     if (!autoJoin) navigate("/dashboard");
//   }, [navigate, onMeetingLeave, setMeetingJoined, autoJoin]);

//   useEffect(() => {
//     return () => {
//       if (wsRef.current?.readyState === WebSocket.OPEN) {
//         wsRef.current.send(JSON.stringify({ type: "leave" }));
//         wsRef.current.close();
//       }
//       peersRef.current.forEach(({ pc }) => pc.close());
//       localStreamRef.current?.getTracks().forEach((t) => t.stop());
//     };
//   }, []);

//   // ============================================================
//   // CONTROLS
//   // ============================================================
//   const toggleMic = () => {
//     const t = localStreamRef.current?.getAudioTracks()[0];
//     if (t) {
//       t.enabled = !t.enabled;
//       setMicOn(t.enabled);
//     }
//   };

//   const toggleCam = () => {
//     const t = localStreamRef.current?.getVideoTracks()[0];
//     if (t) {
//       t.enabled = !t.enabled;
//       setCamOn(t.enabled);
//     }
//   };

//   const setRemoteVideoRef = (userId, el) => {
//     if (!el) {
//       remoteVideosRef.current.delete(userId);
//       return;
//     }
//     remoteVideosRef.current.set(userId, el);

//     const peer = peersRef.current.get(userId);
//     if (peer && peer.remoteStream && el.srcObject !== peer.remoteStream) {
//       el.srcObject = peer.remoteStream;
//       el.play().catch((e) => {
//         if (e.name !== "AbortError") console.error("Play error:", e);
//       });
//     }
//   };

//   const confirmLeave = () => {
//     setEndOpen(false);
//     setLeaveOpen(false);
//     setTimeout(() => leaveCall(), 200);
//   };

//   // ============================================================
//   // DEVICE PICKER MODAL
//   // ============================================================
//   // const DevicePickerModal = showDevicePicker ? (
//   //   <div
//   //     style={{
//   //       position: "fixed",
//   //       inset: 0,
//   //       background: "rgba(15, 23, 42, 0.6)",
//   //       display: "flex",
//   //       alignItems: "center",
//   //       justifyContent: "center",
//   //       zIndex: 9999,
//   //       padding: 20,
//   //     }}
//   //     onClick={() => {
//   //       stopMicTest();
//   //       setShowDevicePicker(false);
//   //     }}
//   //   >
//   //     <div
//   //       style={{
//   //         background: "#fff",
//   //         borderRadius: 12,
//   //         padding: 24,
//   //         maxWidth: 500,
//   //         width: "100%",
//   //         boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
//   //       }}
//   //       onClick={(e) => e.stopPropagation()}
//   //     >
//   //       <h3
//   //         style={{
//   //           margin: "0 0 4px",
//   //           fontSize: 18,
//   //           fontWeight: 700,
//   //           color: "#0f172a",
//   //         }}
//   //       >
//   //          Select Microphone
//   //       </h3>
//   //       <p style={{ margin: "0 0 20px", fontSize: 13, color: "#64748b" }}>
//   //         Choose which microphone to use for this call
//   //         <span
//   //           style={{
//   //             display: "block",
//   //             fontSize: 11,
//   //             color: "#94a3b8",
//   //             marginTop: 4,
//   //           }}
//   //         >
//   //           {audioDevices.length} microphone
//   //           {audioDevices.length !== 1 ? "s" : ""} detected
//   //         </span>
//   //       </p>

//   //       {/* Device list */}
//   //       <div style={{ marginBottom: 16, maxHeight: 200, overflowY: "auto" }}>
//   //         {audioDevices.length === 0 ? (
//   //           <p
//   //             style={{
//   //               fontSize: 13,
//   //               color: "#94a3b8",
//   //               textAlign: "center",
//   //               padding: 20,
//   //             }}
//   //           >
//   //             No microphones found
//   //           </p>
//   //         ) : (
//   //           audioDevices.map((device, i) => (
//   //             <div
//   //               key={device.deviceId || i}
//   //               onClick={() => setSelectedAudioId(device.deviceId)}
//   //               style={{
//   //                 padding: "12px 14px",
//   //                 border:
//   //                   selectedAudioId === device.deviceId
//   //                     ? "2px solid #3b4fdf"
//   //                     : "1px solid #e2e8f0",
//   //                 background:
//   //                   selectedAudioId === device.deviceId ? "#eef2ff" : "#fff",
//   //                 borderRadius: 8,
//   //                 marginBottom: 8,
//   //                 cursor: "pointer",
//   //                 display: "flex",
//   //                 alignItems: "center",
//   //                 gap: 10,
//   //                 transition: "all 0.15s",
//   //               }}
//   //             >
//   //               <input
//   //                 type="radio"
//   //                 checked={selectedAudioId === device.deviceId}
//   //                 onChange={() => setSelectedAudioId(device.deviceId)}
//   //                 style={{ cursor: "pointer" }}
//   //               />
//   //               <span
//   //                 style={{
//   //                   fontSize: 13,
//   //                   fontWeight: 500,
//   //                   color: "#0f172a",
//   //                   flex: 1,
//   //                 }}
//   //               >
//   //                 {device.label || `Microphone ${i + 1}`}
//   //               </span>
//   //             </div>
//   //           ))
//   //         )}
//   //       </div>

//   //       {/* ============ MIC TEST WITH WAVEFORM ============ */}
//   //       <div
//   //         style={{
//   //           background: "#f8fafc",
//   //           border: "1px solid #e2e8f0",
//   //           borderRadius: 8,
//   //           padding: 14,
//   //           marginBottom: 16,
//   //         }}
//   //       >
//   //         <div
//   //           style={{
//   //             display: "flex",
//   //             alignItems: "center",
//   //             justifyContent: "space-between",
//   //             marginBottom: 10,
//   //           }}
//   //         >
//   //           <span
//   //             style={{
//   //               fontSize: 13,
//   //               fontWeight: 600,
//   //               color: "#0f172a",
//   //             }}
//   //           >
//   //              Test Microphone
//   //             {isTesting && (
//   //               <span
//   //                 style={{
//   //                   marginLeft: 8,
//   //                   fontSize: 12,
//   //                   color: "#3b4fdf",
//   //                   fontWeight: 700,
//   //                 }}
//   //               >
//   //                 ({timeLeft}s)
//   //               </span>
//   //             )}
//   //           </span>
//   //           <button
//   //             type="button"
//   //             onClick={isTesting ? stopMicTest : startMicTest}
//   //             disabled={!selectedAudioId}
//   //             style={{
//   //               padding: "6px 14px",
//   //               fontSize: 12,
//   //               fontWeight: 600,
//   //               borderRadius: 6,
//   //               border: "1px solid",
//   //               borderColor: isTesting ? "#dc2626" : "#3b4fdf",
//   //               background: isTesting ? "#fee2e2" : "#eef2ff",
//   //               color: isTesting ? "#dc2626" : "#3b4fdf",
//   //               cursor: selectedAudioId ? "pointer" : "not-allowed",
//   //               opacity: selectedAudioId ? 1 : 0.5,
//   //             }}
//   //           >
//   //             {isTesting ? "⏹ Stop Test" : "▶ Start Test"}
//   //           </button>
//   //         </div>

//   //         {/* Waveform Canvas */}
//   //         <canvas
//   //           ref={canvasRef}
//   //           style={{
//   //             width: "100%",
//   //             height: 80,
//   //             borderRadius: 6,
//   //             border: "1px solid #e2e8f0",
//   //             background: "#f8fafc",
//   //             display: "block",
//   //           }}
//   //         />

//   //         {/* Info text */}
//   //         <p
//   //           style={{
//   //             fontSize: 11,
//   //             color: "#64748b",
//   //             margin: "8px 0 0",
//   //             textAlign: "center",
//   //           }}
//   //         >
//   //           {isTesting
//   //             ? "🎤 Speak into the mic — waves will appear above"
//   //             : 'Click "Start Test" — 10 second mic check'}
//   //         </p>
//   //       </div>

//   //       {/* Buttons */}
//   //       <div style={{ display: "flex", gap: 10 }}>
//   //         <button
//   //           type="button"
//   //           onClick={() => {
//   //             stopMicTest();
//   //             setShowDevicePicker(false);
//   //           }}
//   //           className="ts-btn ts-btn-ghost"
//   //           style={{ flex: 1 }}
//   //         >
//   //           Cancel
//   //         </button>
//   //         <button
//   //           type="button"
//   //           onClick={() => {
//   //             setShowDevicePicker(false);
//   //             joinCall();
//   //           }}
//   //           className="ts-btn ts-btn-primary"
//   //           style={{ flex: 1 }}
//   //           disabled={!selectedAudioId}
//   //         >
//   //           Join Call
//   //         </button>
//   //       </div>
//   //     </div>
//   //   </div>
//   // ) : null;

// const DevicePickerModal = showDevicePicker ? (
//   <div
//     style={{
//       position: "fixed",
//       inset: 0,
//       background: "rgba(15, 23, 42, 0.6)",
//       display: "flex",
//       alignItems: "center",
//       justifyContent: "center",
//       zIndex: 9999,
//       padding: 20,
//     }}
//     onClick={() => {
//       stopMicTest();
//       setShowDevicePicker(false);
//     }}
//   >
//     <div
//       style={{
//         background: "var(--ts-surface)",
//         borderRadius: 12,
//         padding: 24,
//         maxWidth: 500,
//         width: "100%",
//         boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
//         color: "var(--ts-text)",
//         border: "1px solid var(--ts-border)",
//       }}
//       onClick={(e) => e.stopPropagation()}
//     >
//       <h3
//         style={{
//           margin: "0 0 4px",
//           fontSize: 18,
//           fontWeight: 700,
//           color: "var(--ts-text)",
//         }}
//       >
//         🎤 Select Microphone
//       </h3>
//       <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ts-text-muted)" }}>
//         Choose which microphone to use for this call
//         <span
//           style={{
//             display: "block",
//             fontSize: 11,
//             color: "var(--ts-text-faint)",
//             marginTop: 4,
//           }}
//         >
//           {audioDevices.length} microphone
//           {audioDevices.length !== 1 ? "s" : ""} detected
//         </span>
//       </p>

//       {/* Device list */}
//       <div style={{ marginBottom: 16, maxHeight: 200, overflowY: "auto" }}>
//         {audioDevices.length === 0 ? (
//           <p
//             style={{
//               fontSize: 13,
//               color: "var(--ts-text-faint)",
//               textAlign: "center",
//               padding: 20,
//             }}
//           >
//             No microphones found
//           </p>
//         ) : (
//           audioDevices.map((device, i) => (
//             <div
//               key={device.deviceId || i}
//               onClick={() => setSelectedAudioId(device.deviceId)}
//               style={{
//                 padding: "12px 14px",
//                 border:
//                   selectedAudioId === device.deviceId
//                     ? "2px solid var(--ts-accent)"
//                     : "1px solid var(--ts-border)",
//                 background:
//                   selectedAudioId === device.deviceId
//                     ? "var(--ts-active)"
//                     : "var(--ts-surface)",
//                 borderRadius: 8,
//                 marginBottom: 8,
//                 cursor: "pointer",
//                 display: "flex",
//                 alignItems: "center",
//                 gap: 10,
//                 transition: "all 0.15s",
//               }}
//             >
//               <input
//                 type="radio"
//                 checked={selectedAudioId === device.deviceId}
//                 onChange={() => setSelectedAudioId(device.deviceId)}
//                 style={{ cursor: "pointer", accentColor: "var(--ts-accent)" }}
//               />
//               <span
//                 style={{
//                   fontSize: 13,
//                   fontWeight: 500,
//                   color: "var(--ts-text)",
//                   flex: 1,
//                 }}
//               >
//                 {device.label || `Microphone ${i + 1}`}
//               </span>
//             </div>
//           ))
//         )}
//       </div>

//       {/* ============ MIC TEST WITH WAVEFORM ============ */}
//       <div
//         style={{
//           background: "var(--ts-surface-muted)",
//           border: "1px solid var(--ts-border)",
//           borderRadius: 8,
//           padding: 14,
//           marginBottom: 16,
//         }}
//       >
//         <div
//           style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             marginBottom: 10,
//           }}
//         >
//           <span
//             style={{
//               fontSize: 13,
//               fontWeight: 600,
//               color: "var(--ts-text)",
//             }}
//           >
//             🎙️ Test Microphone
//             {isTesting && (
//               <span
//                 style={{
//                   marginLeft: 8,
//                   fontSize: 12,
//                   color: "var(--ts-accent)",
//                   fontWeight: 700,
//                 }}
//               >
//                 ({timeLeft}s)
//               </span>
//             )}
//           </span>
//           <button
//             type="button"
//             onClick={isTesting ? stopMicTest : startMicTest}
//             disabled={!selectedAudioId}
//             style={{
//               padding: "6px 14px",
//               fontSize: 12,
//               fontWeight: 600,
//               borderRadius: 6,
//               border: "1px solid",
//               borderColor: isTesting ? "#dc2626" : "var(--ts-accent)",
//               background: isTesting ? "rgba(220, 38, 38, 0.15)" : "var(--ts-hover)",
//               color: isTesting ? "#dc2626" : "var(--ts-accent)",
//               cursor: selectedAudioId ? "pointer" : "not-allowed",
//               opacity: selectedAudioId ? 1 : 0.5,
//             }}
//           >
//             {isTesting ? "⏹ Stop Test" : "▶ Start Test"}
//           </button>
//         </div>

//         {/* Waveform Canvas */}
//         <canvas
//           ref={canvasRef}
//           style={{
//             width: "100%",
//             height: 80,
//             borderRadius: 6,
//             border: "1px solid var(--ts-border)",
//             background: "var(--ts-surface)",
//             display: "block",
//           }}
//         />

//         <p
//           style={{
//             fontSize: 11,
//             color: "var(--ts-text-muted)",
//             margin: "8px 0 0",
//             textAlign: "center",
//           }}
//         >
//           {isTesting
//             ? "🎤 Speak into the mic — waves will appear above"
//             : 'Click "Start Test" — 10 second mic check'}
//         </p>
//       </div>

//       {/* Buttons */}
//       <div style={{ display: "flex", gap: 10 }}>
//         <button
//           type="button"
//           onClick={() => {
//             stopMicTest();
//             setShowDevicePicker(false);
//           }}
//           className="ts-btn ts-btn-ghost"
//           style={{ flex: 1 }}
//         >
//           Cancel
//         </button>
//         <button
//           type="button"
//           onClick={() => {
//             setShowDevicePicker(false);
//             joinCall();
//           }}
//           className="ts-btn ts-btn-primary"
//           style={{ flex: 1 }}
//           disabled={!selectedAudioId}
//         >
//           Join Call
//         </button>
//       </div>
//     </div>
//   </div>
// ) : null;


//   // ============================================================
//   // RENDER: PRE-JOIN
//   // ============================================================
//   if (!joined) {
//     return (
//       <div className="ts-exam-video-inner">
//         <div className="ts-exam-join">
//           <div className="ts-exam-join-icon">
//             <Video size={28} />
//           </div>
//           <h3>{isDoctor ? "Join live exam" : "Connecting to device…"}</h3>
//           <p>
//             Meeting ID {meetingId || "—"}
//             {patientId ? ` · Patient ${patientId}` : ""}
//           </p>

//           <button
//             type="button"
//             onClick={() => {
//               if (isDoctor) {
//                 setShowDevicePicker(true);
//               } else {
//                 joinCall();
//               }
//             }}
//             className="ts-btn ts-btn-primary"
//             disabled={joining || (isDoctor && !devicesLoaded)}
//           >
//             {joining
//               ? "Connecting…"
//               : isDoctor && !devicesLoaded
//               ? "Loading devices…"
//               : isDoctor
//               ? "Join exam"
//               : "Start Streaming"}
//           </button>
//         </div>

//         {DevicePickerModal}
//       </div>
//     );
//   }

//   // ============================================================
//   // RENDER: DOCTOR VIEW
//   // ============================================================
//   if (isDoctor) {
//     return (
//       <div className="ts-exam-video-inner">
//         <div className="ts-exam-player">
//           {peerIds.length === 0 ? (
//             <div
//               className="ts-exam-participant"
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 color: "#94a3b8",
//                 fontSize: 14,
//               }}
//             >
//               Waiting for patient to connect…
//             </div>
//           ) : (
//             peerIds.map((peerId) => (
//               <div className="ts-exam-participant" key={peerId}>
//                 <video
//                   ref={(el) => setRemoteVideoRef(peerId, el)}
//                   autoPlay
//                   playsInline
//                   style={{
//                     width: "100%",
//                     height: "100%",
//                     objectFit: "cover",
//                     background: "#000",
//                   }}
//                 />
//               </div>
//             ))
//           )}
//         </div>

//         <div className="ts-exam-controls-bar">
//           <button
//             type="button"
//             onClick={() => setEndOpen(true)}
//             className="ts-btn ts-btn-danger"
//           >
//             End Appointment
//           </button>
//           <button
//             type="button"
//             onClick={toggleMic}
//             className="ts-btn ts-btn-ghost"
//           >
//             {micOn ? <Mic size={16} /> : <MicOff size={16} />}
//             {micOn ? "Mute" : "Unmute"}
//           </button>
//         </div>

//         <ConfirmModal
//           isOpen={endOpen}
//           onClose={() => setEndOpen(false)}
//           onConfirm={confirmLeave}
//           title="End appointment?"
//           message="This will leave the live exam. Unsaved exam data may be lost."
//           confirmLabel="End Appointment"
//           danger
//         />
//       </div>
//     );
//   }

//   // ============================================================
//   // RENDER: PATIENT VIEW
//   // ============================================================
//   return (
//     <div className="ts-exam-video-inner">
//       <div className="ts-exam-player">
//         <div className="ts-exam-participant">
//           <video
//             ref={localVideoRef}
//             autoPlay
//             playsInline
//             muted
//             style={{ width: "100%", height: "100%", background: "#000" }}
//           />
//         </div>
//       </div>

//       <div className="ts-exam-controls-bar">
//         <span style={{ fontSize: 12, color: "#64748b" }}>
//           🔴 Streaming to doctor
//         </span>
//         {!autoJoin && (
//           <button
//             type="button"
//             onClick={() => setEndOpen(true)}
//             className="ts-btn ts-btn-danger"
//           >
//             Leave
//           </button>
//         )}
//       </div>

//       <ConfirmModal
//         isOpen={endOpen}
//         onClose={() => setEndOpen(false)}
//         onConfirm={confirmLeave}
//         title="Leave this exam?"
//         message="Any unsaved changes will be lost if you leave now."
//         confirmLabel="Leave"
//         danger
//       />
//     </div>
//   );
// }

// export default VideoCall;




import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/ReactToastify.css";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import "../App.css";

const SIGNALING_URL =
  process.env.REACT_APP_SIGNALING_URL || "ws://localhost:3002";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

// ============================================================
// MEETING TIMER CONSTANTS
// ============================================================
// 🔧 PRODUCTION: 30 minutes
// 🧪 TESTING: 1 minute
const MEETING_DURATION = 60;   // 1 minute
const WARNING_AT = 30;         // 30 sec pe warning
const CRITICAL_AT = 15;        // 15 sec pe red

// 🧪 TESTING: 1 minute (comment out for production)
// const MEETING_DURATION = 60;
// const WARNING_AT = 30;
// const CRITICAL_AT = 15;

// MIC TEST CONSTANT
const MIC_TEST_DURATION = 10;

function VideoCall({
  meetingId: propMeetingId,
  patientId: propPatientId,
  onMeetingLeave,
  setMeetingJoined,
  role = "patient",
  autoJoin = false,
  onTimerUpdate,   // ✅ NEW: callback to parent (EMR.js) for topbar timer
}) {
  const isDoctor = role === "doctor";

  const { meetingid, patientid } = useParams();
  const meetingId = propMeetingId || meetingid;
  const patientId = propPatientId || patientid;
  const navigate = useNavigate();

  // ---------- State ----------
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(!isDoctor);
  const [peerIds, setPeerIds] = useState([]);
  const [endOpen, setEndOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  // Device picker
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedAudioId, setSelectedAudioId] = useState("");
  const [devicesLoaded, setDevicesLoaded] = useState(false);
  const [showDevicePicker, setShowDevicePicker] = useState(false);

  // Mic testing
  const [isTesting, setIsTesting] = useState(false);
  const [testTimeLeft, setTestTimeLeft] = useState(MIC_TEST_DURATION);

  // Meeting timer
  const [meetingTimeLeft, setMeetingTimeLeft] = useState(MEETING_DURATION);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [meetingEnded, setMeetingEnded] = useState(false);

  // ---------- Refs ----------
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const peersRef = useRef(new Map());
  const remoteVideosRef = useRef(new Map());
  const userIdRef = useRef(
    `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  // Mic test refs
  const testStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const testStartTimeRef = useRef(null);

  // Leave call ref to avoid dependency ordering
  const leaveCallRef = useRef(null);

  // ============================================================
  // PEER MANAGEMENT
  // ============================================================
  const removePeer = useCallback((remoteUserId) => {
    const peer = peersRef.current.get(remoteUserId);
    if (peer) {
      peer.pc.close();
      peersRef.current.delete(remoteUserId);
    }
    remoteVideosRef.current.delete(remoteUserId);
    setPeerIds((prev) => prev.filter((id) => id !== remoteUserId));
  }, []);

  const createPeer = useCallback(
    (remoteUserId, initiator, stream) => {
      if (peersRef.current.has(remoteUserId)) {
        return peersRef.current.get(remoteUserId).pc;
      }

      const pc = new RTCPeerConnection(ICE_SERVERS);
      const remoteStream = new MediaStream();

      if (stream) {
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      }

      pc.ontrack = (event) => {
        console.log("Remote track received from", remoteUserId, ":", event.track.kind);

        if (event.track && !remoteStream.getTracks().includes(event.track)) {
          remoteStream.addTrack(event.track);
        }

        const videoEl = remoteVideosRef.current.get(remoteUserId);
        if (videoEl && videoEl.srcObject !== remoteStream) {
          videoEl.srcObject = remoteStream;
          videoEl.play().catch((e) => {
            if (e.name !== "AbortError") console.error("Play error:", e);
          });
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: "ice-candidate",
              target: remoteUserId,
              candidate: event.candidate,
            })
          );
        }
      };

      pc.onconnectionstatechange = () => {
        console.log(`Peer ${remoteUserId}:`, pc.connectionState);
        if (["failed", "closed"].includes(pc.connectionState)) {
          removePeer(remoteUserId);
        }
      };

      peersRef.current.set(remoteUserId, { pc, remoteStream });

      if (initiator) {
        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  type: "offer",
                  target: remoteUserId,
                  sdp: pc.localDescription,
                })
              );
            }
          } catch (e) {
            console.error("Offer creation error:", e);
          }
        };
      }

      return pc;
    },
    [removePeer]
  );

  // ============================================================
  // DEVICE LOADING
  // ============================================================
  const loadDevices = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await new Promise((r) => setTimeout(r, 150));

      const devices = await navigator.mediaDevices.enumerateDevices();
      const allMics = devices.filter((d) => d.kind === "audioinput");

      const mics = allMics.filter((d) => {
        const deviceId = (d.deviceId || "").toLowerCase();
        return deviceId !== "default" && deviceId !== "communications";
      });

      setAudioDevices(mics);

      setSelectedAudioId((prev) => {
        if (prev && mics.some((m) => m.deviceId === prev)) return prev;
        return mics[0]?.deviceId || "";
      });

      setDevicesLoaded(true);
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Microphone permission denied");
    }
  }, []);

  useEffect(() => {
    if (!joined) {
      loadDevices();
    }
  }, [joined, loadDevices]);

  useEffect(() => {
    const handleDeviceChange = () => loadDevices();
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
    };
  }, [loadDevices]);

  useEffect(() => {
    if (showDevicePicker) loadDevices();
  }, [showDevicePicker, loadDevices]);

  // ============================================================
  // WAVEFORM DRAWING
  // ============================================================
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const analyser = analyserRef.current;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;

      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      const styles = getComputedStyle(document.documentElement);
      const bgColor = styles.getPropertyValue("--ts-surface").trim() || "#fff";
      const borderColor = styles.getPropertyValue("--ts-border").trim() || "#cbd5e1";
      const accentColor = styles.getPropertyValue("--ts-accent").trim() || "#3b4fdf";

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.lineWidth = 2;
      ctx.strokeStyle = accentColor;
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();

      if (testStartTimeRef.current) {
        const elapsed = (Date.now() - testStartTimeRef.current) / 1000;
        const remaining = Math.max(0, MIC_TEST_DURATION - elapsed);
        setTestTimeLeft(Math.ceil(remaining));
      }
    };

    draw();
  }, []);

  // ============================================================
  // MIC TESTING
  // ============================================================
  const stopMicTest = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;

    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((t) => t.stop());
      testStreamRef.current = null;
    }

    testStartTimeRef.current = null;
    setIsTesting(false);
    setTestTimeLeft(MIC_TEST_DURATION);
  }, []);

  const startMicTest = useCallback(async () => {
    stopMicTest();

    if (!selectedAudioId) {
      toast.error("Please select a microphone first");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: selectedAudioId } },
      });

      testStreamRef.current = stream;

      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      source.connect(analyser);

      testStartTimeRef.current = Date.now();
      setTestTimeLeft(MIC_TEST_DURATION);
      setIsTesting(true);

      drawWaveform();

      countdownTimerRef.current = setInterval(() => {
        if (!testStartTimeRef.current) return;
        const elapsed = (Date.now() - testStartTimeRef.current) / 1000;
        const remaining = MIC_TEST_DURATION - elapsed;

        if (remaining <= 0) {
          stopMicTest();
          toast.success("✅ Mic test complete");
        } else {
          setTestTimeLeft(Math.ceil(remaining));
        }
      }, 200);
    } catch (err) {
      console.error("Mic test error:", err);
      toast.error("Could not test microphone");
      stopMicTest();
    }
  }, [selectedAudioId, stopMicTest, drawWaveform]);

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, [stopMicTest]);

  useEffect(() => {
    if (!showDevicePicker && isTesting) {
      stopMicTest();
    }
  }, [showDevicePicker, isTesting, stopMicTest]);

  useEffect(() => {
    if (isTesting) {
      startMicTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAudioId]);

  // ============================================================
  // MEETING TIMER
  // ============================================================
  // Start timer when both peers connected
  useEffect(() => {
    if (joined && peerIds.length > 0 && !timerRunning) {
      console.log(`⏱️ Meeting timer started — ${Math.floor(MEETING_DURATION / 60)} minutes`);
      setTimerRunning(true);
    }
  }, [joined, peerIds.length, timerRunning]);

  // Countdown
  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setMeetingTimeLeft((prev) => {
        const next = prev - 1;

        if (next === WARNING_AT) {
          console.log(`⏰ ${Math.floor(WARNING_AT / 60)} minutes remaining`);
          setShowWarningModal(true);
        }

        if (next <= 0) {
          clearInterval(interval);
          console.log("⏰ Time up!");

          if (isDoctor) {
            setShowTimeUpModal(true);
          }
          return 0;
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, isDoctor]);

  // ✅ NEW: Send timer state to parent (EMR.js topbar)
  useEffect(() => {
    if (onTimerUpdate) {
      onTimerUpdate({
        running: timerRunning,
        timeLeft: meetingTimeLeft,
        color: meetingTimeLeft <= CRITICAL_AT
          ? "#dc2626"
          : meetingTimeLeft <= WARNING_AT
          ? "#f59e0b"
          : "#3b4fdb",
        isCritical: meetingTimeLeft <= CRITICAL_AT,
      });
    }
  }, [timerRunning, meetingTimeLeft, onTimerUpdate]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    if (meetingTimeLeft <= CRITICAL_AT) return "#dc2626";
    if (meetingTimeLeft <= WARNING_AT) return "#f59e0b";
    return "#3b4fdb";
  };

  // Helper for warning modal text
  const getWarningText = () => {
    if (WARNING_AT >= 60) {
      return `${Math.floor(WARNING_AT / 60)} minute${WARNING_AT >= 120 ? "s" : ""}`;
    }
    return `${WARNING_AT} seconds`;
  };

  // ============================================================
  // LEAVE CALL
  // ============================================================
  const leaveCall = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "leave" }));
      wsRef.current.close();
    }
    peersRef.current.forEach(({ pc }) => pc.close());
    peersRef.current.clear();
    remoteVideosRef.current.clear();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    setJoined(false);
    setMeetingJoined?.(false);
    onMeetingLeave?.();
    if (!autoJoin) navigate("/dashboard");
  }, [navigate, onMeetingLeave, setMeetingJoined, autoJoin]);

  // Keep ref updated
  useEffect(() => {
    leaveCallRef.current = leaveCall;
  }, [leaveCall]);

  // ============================================================
  // SIGNALING
  // ============================================================
  const handleSignalMessage = useCallback(
    async (msg) => {
      const { type, from, sdp, candidate, peers } = msg;

      if (type === "joined") {
        const stream = localStreamRef.current;
        setPeerIds(peers || []);
        for (const peerId of peers || []) {
          createPeer(peerId, true, stream);
        }
      } else if (type === "user-joined") {
        setPeerIds((prev) => (prev.includes(from) ? prev : [...prev, from]));
      } else if (type === "offer") {
        setPeerIds((prev) => (prev.includes(from) ? prev : [...prev, from]));
        const stream = localStreamRef.current;
        const pc = createPeer(from, false, stream);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({ type: "answer", target: from, sdp: pc.localDescription })
            );
          }
        } catch (err) {
          console.error("Error answering offer from", from, ":", err);
        }
      } else if (type === "answer") {
        const peer = peersRef.current.get(from);
        if (peer)
          await peer.pc.setRemoteDescription(new RTCSessionDescription(sdp));
      } else if (type === "ice-candidate") {
        const peer = peersRef.current.get(from);
        if (peer) {
          try {
            await peer.pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("ICE add error:", e);
          }
        }
      } else if (type === "user-left") {
        removePeer(from);
      } else if (type === "meeting-ended") {
        console.log("🛑 Meeting ended by other participant");
        setMeetingEnded(true);
        toast.info("Meeting ended by doctor");
        setTimeout(() => {
          leaveCallRef.current?.();
        }, 2000);
      }
    },
    [createPeer, removePeer]
  );

  // ============================================================
  // JOIN CALL
  // ============================================================
  const joinCall = useCallback(async () => {
    stopMicTest();
    setJoining(true);

    let stream = null;
    try {
      const constraints = isDoctor
        ? {
            video: false,
            audio: selectedAudioId
              ? { deviceId: { exact: selectedAudioId } }
              : true,
          }
        : { video: true, audio: true };

      stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (!isDoctor && localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Media error:", err);
      toast.error(
        isDoctor
          ? "Microphone permission denied"
          : "Camera/mic permission denied"
      );
      setJoining(false);
      return;
    }

    const ws = new WebSocket(SIGNALING_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "join",
          roomId: meetingId,
          userId: userIdRef.current,
          role,
        })
      );
      setJoined(true);
      setJoining(false);
      setMeetingJoined?.(true);
    };

    ws.onmessage = (event) => {
      try {
        handleSignalMessage(JSON.parse(event.data));
      } catch (e) {
        console.error("WS parse error:", e);
      }
    };

    ws.onerror = (err) => {
      console.error("WS error:", err);
      toast.error("Signaling server error");
    };
  }, [
    isDoctor,
    meetingId,
    role,
    handleSignalMessage,
    setMeetingJoined,
    selectedAudioId,
    stopMicTest,
  ]);

  useEffect(() => {
    if (autoJoin && !joined && !joining && meetingId) {
      joinCall();
    }
  }, [autoJoin, joined, joining, meetingId, joinCall]);

  // End meeting for all (doctor only)
  const endMeetingForAll = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "meeting-ended" }));
    }
    setTimeout(() => {
      leaveCall();
      navigate("/instant-meeting");
    }, 300);
  }, [navigate, leaveCall]);

  useEffect(() => {
    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "leave" }));
        wsRef.current.close();
      }
      peersRef.current.forEach(({ pc }) => pc.close());
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ============================================================
  // CONTROLS
  // ============================================================
  const toggleMic = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) {
      t.enabled = !t.enabled;
      setMicOn(t.enabled);
    }
  };

  const toggleCam = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) {
      t.enabled = !t.enabled;
      setCamOn(t.enabled);
    }
  };

  const setRemoteVideoRef = (userId, el) => {
    if (!el) {
      remoteVideosRef.current.delete(userId);
      return;
    }
    remoteVideosRef.current.set(userId, el);

    const peer = peersRef.current.get(userId);
    if (peer && peer.remoteStream && el.srcObject !== peer.remoteStream) {
      el.srcObject = peer.remoteStream;
      el.play().catch((e) => {
        if (e.name !== "AbortError") console.error("Play error:", e);
      });
    }
  };

  const confirmLeave = () => {
    setEndOpen(false);
    setLeaveOpen(false);
    setTimeout(() => leaveCall(), 200);
  };

  // ============================================================
  // DEVICE PICKER MODAL
  // ============================================================
  const DevicePickerModal = showDevicePicker ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 20,
      }}
      onClick={() => {
        stopMicTest();
        setShowDevicePicker(false);
      }}
    >
      <div
        style={{
          background: "var(--ts-surface)",
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
          width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          color: "var(--ts-text)",
          border: "1px solid var(--ts-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: "0 0 4px",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--ts-text)",
          }}
        >
          🎤 Select Microphone
        </h3>
        <p style={{ margin: "0 0 20px", fontSize: 13, color: "var(--ts-text-muted)" }}>
          Choose which microphone to use for this call
          <span
            style={{
              display: "block",
              fontSize: 11,
              color: "var(--ts-text-faint)",
              marginTop: 4,
            }}
          >
            {audioDevices.length} microphone
            {audioDevices.length !== 1 ? "s" : ""} detected
          </span>
        </p>

        <div style={{ marginBottom: 16, maxHeight: 200, overflowY: "auto" }}>
          {audioDevices.length === 0 ? (
            <p
              style={{
                fontSize: 13,
                color: "var(--ts-text-faint)",
                textAlign: "center",
                padding: 20,
              }}
            >
              No microphones found
            </p>
          ) : (
            audioDevices.map((device, i) => (
              <div
                key={device.deviceId || i}
                onClick={() => setSelectedAudioId(device.deviceId)}
                style={{
                  padding: "12px 14px",
                  border:
                    selectedAudioId === device.deviceId
                      ? "2px solid var(--ts-accent)"
                      : "1px solid var(--ts-border)",
                  background:
                    selectedAudioId === device.deviceId
                      ? "var(--ts-active)"
                      : "var(--ts-surface)",
                  borderRadius: 8,
                  marginBottom: 8,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "all 0.15s",
                }}
              >
                <input
                  type="radio"
                  checked={selectedAudioId === device.deviceId}
                  onChange={() => setSelectedAudioId(device.deviceId)}
                  style={{ cursor: "pointer", accentColor: "var(--ts-accent)" }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--ts-text)",
                    flex: 1,
                  }}
                >
                  {device.label || `Microphone ${i + 1}`}
                </span>
              </div>
            ))
          )}
        </div>

        {/* MIC TEST SECTION */}
        <div
          style={{
            background: "var(--ts-surface-muted)",
            border: "1px solid var(--ts-border)",
            borderRadius: 8,
            padding: 14,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--ts-text)",
              }}
            >
              🎙️ Test Microphone
              {isTesting && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 12,
                    color: "var(--ts-accent)",
                    fontWeight: 700,
                  }}
                >
                  ({testTimeLeft}s)
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={isTesting ? stopMicTest : startMicTest}
              disabled={!selectedAudioId}
              style={{
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 6,
                border: "1px solid",
                borderColor: isTesting ? "#dc2626" : "var(--ts-accent)",
                background: isTesting ? "rgba(220, 38, 38, 0.15)" : "var(--ts-hover)",
                color: isTesting ? "#dc2626" : "var(--ts-accent)",
                cursor: selectedAudioId ? "pointer" : "not-allowed",
                opacity: selectedAudioId ? 1 : 0.5,
              }}
            >
              {isTesting ? "⏹ Stop Test" : "▶ Start Test"}
            </button>
          </div>

          <canvas
            ref={canvasRef}
            style={{
              width: "100%",
              height: 80,
              borderRadius: 6,
              border: "1px solid var(--ts-border)",
              background: "var(--ts-surface)",
              display: "block",
            }}
          />

          <p
            style={{
              fontSize: 11,
              color: "var(--ts-text-muted)",
              margin: "8px 0 0",
              textAlign: "center",
            }}
          >
            {isTesting
              ? "🎤 Speak into the mic — waves will appear above"
              : 'Click "Start Test" — 10 second mic check'}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              stopMicTest();
              setShowDevicePicker(false);
            }}
            className="ts-btn ts-btn-ghost"
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setShowDevicePicker(false);
              joinCall();
            }}
            className="ts-btn ts-btn-primary"
            style={{ flex: 1 }}
            disabled={!selectedAudioId}
          >
            Join Call
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // ============================================================
  // RENDER: PRE-JOIN
  // ============================================================
  if (!joined) {
    return (
      <div className="ts-exam-video-inner">
        <div className="ts-exam-join">
          <div className="ts-exam-join-icon">
            <Video size={28} />
          </div>
          <h3>{isDoctor ? "Join live exam" : "Connecting to device…"}</h3>
          <p>
            Meeting ID {meetingId || "—"}
            {patientId ? ` · Patient ${patientId}` : ""}
          </p>

          <button
            type="button"
            onClick={() => {
              if (isDoctor) {
                setShowDevicePicker(true);
              } else {
                joinCall();
              }
            }}
            className="ts-btn ts-btn-primary"
            disabled={joining || (isDoctor && !devicesLoaded)}
          >
            {joining
              ? "Connecting…"
              : isDoctor && !devicesLoaded
              ? "Loading devices…"
              : isDoctor
              ? "Join exam"
              : "Start Streaming"}
          </button>
        </div>

        {DevicePickerModal}
      </div>
    );
  }

  // ============================================================
  // RENDER: DOCTOR VIEW
  // ============================================================
  if (isDoctor) {
    return (
      <div className="ts-exam-video-inner" style={{ position: "relative" }}>
        {/* ❌ Timer badge REMOVED — now shown in topbar */}

        <div className="ts-exam-player">
          {peerIds.length === 0 ? (
            <div
              className="ts-exam-participant"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                fontSize: 14,
              }}
            >
              Waiting for patient to connect…
            </div>
          ) : (
            peerIds.map((peerId) => (
              <div className="ts-exam-participant" key={peerId}>
                <video
                  ref={(el) => setRemoteVideoRef(peerId, el)}
                  autoPlay
                  playsInline
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    background: "#000",
                  }}
                />
              </div>
            ))
          )}
        </div>

        <div className="ts-exam-controls-bar">
          <button
            type="button"
            onClick={() => setEndOpen(true)}
            className="ts-btn ts-btn-danger"
          >
            End Appointment
          </button>
          <button
            type="button"
            onClick={toggleMic}
            className="ts-btn ts-btn-ghost"
          >
            {micOn ? <Mic size={16} /> : <MicOff size={16} />}
            {micOn ? "Mute" : "Unmute"}
          </button>
        </div>

        <ConfirmModal
          isOpen={endOpen}
          onClose={() => setEndOpen(false)}
          onConfirm={confirmLeave}
          title="End appointment?"
          message="This will leave the live exam. Unsaved exam data may be lost."
          confirmLabel="End Appointment"
          danger
        />

        {/* Warning Modal */}
        {showWarningModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10000,
              padding: 20,
            }}
          >
            <div
              style={{
                background: "var(--ts-surface)",
                borderRadius: 12,
                padding: 32,
                maxWidth: 400,
                width: "100%",
                textAlign: "center",
                border: "2px solid #f59e0b",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏰</div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--ts-text)",
                }}
              >
                {getWarningText()} Remaining
              </h3>
              <p
                style={{
                  margin: "0 0 24px",
                  fontSize: 14,
                  color: "var(--ts-text-muted)",
                }}
              >
                This session will end in {getWarningText()}. Please wrap up.
              </p>
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                className="ts-btn ts-btn-primary"
                style={{ width: "100%" }}
              >
                OK, Noted
              </button>
            </div>
          </div>
        )}

        {/* Time Up Modal — Doctor */}
        {showTimeUpModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10001,
              padding: 20,
            }}
          >
            <div
              style={{
                background: "var(--ts-surface)",
                borderRadius: 12,
                padding: 32,
                maxWidth: 440,
                width: "100%",
                textAlign: "center",
                border: "2px solid #dc2626",
                boxShadow: "0 20px 60px rgba(220, 38, 38, 0.3)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏱️</div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--ts-text)",
                }}
              >
                Meeting Time Ended
              </h3>
              <p
                style={{
                  margin: "0 0 24px",
                  fontSize: 14,
                  color: "var(--ts-text-muted)",
                }}
              >
                The {Math.floor(MEETING_DURATION / 60)}-minute session is over.
                Would you like to end this meeting and create a new one?
              </p>
            <div style={{ display: "flex", gap: 10 }}>
  <button
    type="button"
    onClick={endMeetingForAll}
    className="ts-btn ts-btn-danger"
    style={{ flex: 1 }}
  >
    End & Create New
  </button>
</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // RENDER: PATIENT VIEW
  // ============================================================
  return (
    <div className="ts-exam-video-inner" style={{ position: "relative" }}>
      <div className="ts-exam-player">
        <div className="ts-exam-participant">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: "100%", height: "100%", background: "#000" }}
          />
        </div>
      </div>

      <div className="ts-exam-controls-bar">
        <span style={{ fontSize: 12, color: "#64748b" }}>
          🔴 Streaming to doctor
        </span>

        {/* Patient side timer (kept here since patient view has no topbar) */}
        {timerRunning && (
          <span
            style={{
              marginLeft: 12,
              padding: "4px 10px",
              borderRadius: 6,
              background: "rgba(0, 0, 0, 0.05)",
              color: getTimerColor(),
              fontWeight: 700,
              fontSize: 14,
              fontFamily: "monospace",
              border: `2px solid ${getTimerColor()}`,
            }}
          >
            ⏱️ {formatTime(meetingTimeLeft)}
          </span>
        )}

        {!autoJoin && (
          <button
            type="button"
            onClick={() => setEndOpen(true)}
            className="ts-btn ts-btn-danger"
          >
            Leave
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={endOpen}
        onClose={() => setEndOpen(false)}
        onConfirm={confirmLeave}
        title="Leave this exam?"
        message="Any unsaved changes will be lost if you leave now."
        confirmLabel="Leave"
        danger
      />

      {/* Meeting Ended Screen — Patient */}
      {meetingEnded && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10002,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--ts-surface)",
              borderRadius: 12,
              padding: 32,
              maxWidth: 400,
              width: "100%",
              textAlign: "center",
              border: "2px solid #dc2626",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛑</div>
            <h3
              style={{
                margin: "0 0 8px",
                fontSize: 20,
                fontWeight: 700,
                color: "var(--ts-text)",
              }}
            >
              Meeting Ended
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "var(--ts-text-muted)",
              }}
            >
              The doctor has ended the session.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoCall;