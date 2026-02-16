


import React, { useEffect, useState, useRef } from "react";
import NavBar from "../components/NavBar";
import Button from "../components/Button";
import axios from "axios";
import VIDEOSDK from "../components/VideoSDK";
import { useParams } from "react-router-dom";
import EMRPatientInfo from "../components/EMR_PatientInfo";
import EMRBedSide from "../components/EMR_BedSide";
import EMRTelestrokeExam from "../components/EMR_TelestrokeExam";
import QuadrantTracking from "../components/QuadrantTracking";
import StimulusVideoController from "../components/StimulusVideoController";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Line } from "react-chartjs-2";
import { submitExamData, submitTrackingSession } from "../utils/auth";
import Papa from "papaparse";

const EMRpage = () => {
  const { patientid, meetingid } = useParams();
  const [selectedEye, setSelectedEye] = useState(null);
  const [meetingJoined, setMeetingJoined] = useState(false);
  const [centerFocus, setCenterFocus] = useState(null);
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState({
    eye_camera_control: "",
    exam_mode: "",
    stimulus_type: "",
    speed: "slow",
    stop: "",
    coordinates: "",
    shape: "",
  });
  const [examId, setExamId] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [trackingSessions, setTrackingSessions] = useState([]);
  const [plottingEnabled, setPlottingEnabled] = useState(false);
  const [plottingData, setPlottingData] = useState({
    eyeX: [],
    eyeY: [],
    stimX: [],
    stimY: [],
    labels: [],
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "Eye Angle X",
        borderColor: "#1e40af",
        backgroundColor: "#1e40af",
        fill: false,
        data: [],
        pointRadius: 0,
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: "Stimulus X",
        borderColor: "#10b981",
        backgroundColor: "#10b981",
        fill: false,
        data: [],
        pointRadius: 0,
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: "Eye Angle Y",
        borderColor: "#9d174d",
        backgroundColor: "#9d174d",
        fill: false,
        data: [],
        pointRadius: 0,
        tension: 0.3,
        spanGaps: true,
      },
      {
        label: "Stimulus Y",
        borderColor: "#f97316",
        backgroundColor: "#f97316",
        fill: false,
        data: [],
        pointRadius: 0,
        tension: 0.3,
        spanGaps: true,
      },
    ],
  });

  const chartRef = useRef(null);
  const MAX_POINTS = 1000;
  const csvDataLoaded = useRef(false);
  const stimulusXData = useRef([]);
  const stimulusYData = useRef([]);
  const currentDataIndex = useRef(0);
  const cumulativeData = useRef({
    labels: [],
    eyeX: [],
    eyeY: [],
    stimX: [],
    stimY: [],
  });
  const webSocketRef = useRef(null);
  const eyeDataBuffer = useRef([]);
  const sessionDataPoints = useRef([]);
  const lastValidEyeData = useRef({ eyeX: 0, eyeY: 0 });
  const SMOOTH_WINDOW = 5;
  const lastEyeTimestamp = useRef(null);
  const stimulusStartTime = useRef(null);
  const sessionStarted = useRef(false);
  const pauseStartTime = useRef(null);
  const [calibrateCounts, setCalibrateCounts] = useState({ left: 0, right: 0 });

  // Pause state
  const [isPaused, setIsPaused] = useState(false);

  // Check if stimulus is active (both type and shape are selected)
  const isStimulusActive = useRef(false);

  // Stimulus interval ref
  const stimulusIntervalRef = useRef(null);

  // Track if WebSocket is already connected
  const webSocketConnected = useRef(false);

  // Track if stimulus data has been completely plotted
  const stimulusDataComplete = useRef(false);

  // Track if we need to save session on pause
  const shouldSaveOnPause = useRef(false);

  // Track if session was saved due to CSV completion
  const sessionSavedDueToCSVComplete = useRef(false);

  // Track latest eye data for pairing with stimulus
  const latestEyeDataForStimulus = useRef({
    eyeX: null,
    eyeY: null,
    timestamp: null,
  });

  // Start session when stimulus becomes active
  useEffect(() => {
    isStimulusActive.current = !!(settings.stimulus_type && settings.shape && settings.speed);
    console.log("Stimulus active:", isStimulusActive.current, {
      stimulus_type: settings.stimulus_type,
      shape: settings.shape,
      speed: settings.speed,
    });

    // START SESSION WHEN STIMULUS BECOMES ACTIVE
    if (
      isStimulusActive.current &&
      !currentSession &&
      !sessionStarted.current
    ) {
      console.log("Stimulus is ON - starting new session");
      startNewStimulusSession();
    }
  }, [settings.stimulus_type, settings.shape, settings.speed]);

  // Initialize WebSocket for eye data
  useEffect(() => {
    if (webSocketConnected.current) {
      return;
    }

    // webSocketRef.current = new WebSocket("ws://localhost:3001");
    // webSocketRef.current = new WebSocket("ws://13.233.6.224:3001");

    webSocketRef.current = new WebSocket("wss://telestrokeapp.duckdns.org/socket/");


    webSocketRef.current.onopen = () => {
      console.log("WebSocket connected for eye data");
      webSocketConnected.current = true;
    };

    webSocketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("eye data ", data);
        if (data.type === "eye_data") {
          const timestamp = data?.timestamp || Date.now();
          lastEyeTimestamp.current = timestamp;

          const angle_x = data?.angle_x ?? lastValidEyeData.current.eyeX;
          const angle_y = data?.angle_y ?? lastValidEyeData.current.eyeY;

          // Always update last valid value
          if (angle_x != null && angle_y != null) {
            lastValidEyeData.current = { eyeX: angle_x, eyeY: angle_y };
            // Store latest eye data for pairing with stimulus
            latestEyeDataForStimulus.current = {
              eyeX: angle_x,
              eyeY: angle_y,
              timestamp: timestamp,
            };
          }

          // STOP processing when PAUSED
          if (isPaused) return;

          // Only continue if NOT paused
          eyeDataBuffer.current.push({ angle_x, angle_y, timestamp });

          if (eyeDataBuffer.current.length > MAX_POINTS) {
            eyeDataBuffer.current.shift();
          }

          // ONLY plot eye data directly if stimulus plotting IS NOT driving the graph
          if (!plottingEnabled || isPaused) {
            processAndPlotEyeData();
          }

          // Store eye-only data points when stimulus is active
          if (
            isStimulusActive.current &&
            currentSession &&
            !stimulusDataComplete.current &&
            !isPaused
          ) {
            // Store eye-only data point (stimulus will be paired later)
            const dataPoint = {
              timestamp: new Date(timestamp),
              relativeTime:
                (timestamp - currentSession.sessionStart.getTime()) / 1000,
              eyeX: angle_x,
              eyeY: angle_y,
              stimX: null, // Will be paired with stimulus data
              stimY: null, // Will be paired with stimulus data
              stimulusType: currentSession.stimulusType,
              isPaired: false, // Not yet paired with stimulus
            };
            sessionDataPoints.current = [
              ...sessionDataPoints.current,
              dataPoint,
            ];
          }
        }
      } catch (err) {
        console.error("WebSocket parse error:", err);
      }
    };

    webSocketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      if (!webSocketConnected.current) {
        toast.error("WebSocket connection error occurred.");
      }
    };

    webSocketRef.current.onclose = () => {
      console.log("WebSocket disconnected");
      webSocketConnected.current = false;
    };

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketConnected.current = false;
      }
    };
  }, []);

  const togglePause = () => {
    setIsPaused((prev) => {
      const newPaused = !prev;

      if (newPaused) {
        // Track when we paused to adjust stimulus start time on resume
        pauseStartTime.current = Date.now();

        // Stop eye data processing
        eyeDataBuffer.current = [];

        // Stop stimulus plotting interval
        if (stimulusIntervalRef.current) {
          clearInterval(stimulusIntervalRef.current);
          stimulusIntervalRef.current = null;
        }

        console.log("⛔ PAUSED: Eye + Stimulus plotting stopped");
      } else {
        // RESUMING: Adjust stimulus start time to account for pause duration
        if (pauseStartTime.current && stimulusStartTime.current) {
          const pauseDuration = Date.now() - pauseStartTime.current;
          stimulusStartTime.current += pauseDuration;
          pauseStartTime.current = null;
          console.log(`Adjusted stimulus start time by ${pauseDuration}ms`);
        }

        // Restart stimulus plotting when resuming
        if (!stimulusDataComplete.current && plottingEnabled) {
          startStimulusPlotting();
        }

        console.log("▶ RESUMED: Plotting restarted");
      }

      return newPaused;
    });
  };

  // Process and plot eye data
  const processAndPlotEyeData = () => {
    if (eyeDataBuffer.current.length === 0 || isPaused) return;

    let newEyeX = null;
    let newEyeY = null;

    // Relative time label for continuity (if stimulus is active)
    let newLabel = stimulusStartTime.current
      ? (Date.now() - stimulusStartTime.current) / 1000
      : (lastEyeTimestamp.current || Date.now()) / 1000;

    // Smooth for plotting only
    if (eyeDataBuffer.current.length >= SMOOTH_WINDOW) {
      const window = eyeDataBuffer.current.slice(-SMOOTH_WINDOW);
      newEyeX = window.reduce((sum, p) => sum + p.angle_x, 0) / SMOOTH_WINDOW;
      newEyeY = window.reduce((sum, p) => sum + p.angle_y, 0) / SMOOTH_WINDOW;
    } else {
      const latest = eyeDataBuffer.current[eyeDataBuffer.current.length - 1];
      newEyeX = latest.angle_x;
      newEyeY = latest.angle_y;
    }

    if (newEyeX != null && newEyeY != null) {
      lastValidEyeData.current = { eyeX: newEyeX, eyeY: newEyeY };
    }

    // Capture latest stimulus data to keep arrays synchronized
    const currentStimX = (plottingEnabled && !stimulusDataComplete.current && currentDataIndex.current < plottingData.stimX.length)
      ? (plottingData.stimX[currentDataIndex.current] || null)
      : null;
    const currentStimY = (plottingEnabled && !stimulusDataComplete.current && currentDataIndex.current < plottingData.stimY.length)
      ? (plottingData.stimY[currentDataIndex.current] || null)
      : null;

    // Update cumulative data for plotting
    cumulativeData.current = {
      ...cumulativeData.current,
      labels: [...cumulativeData.current.labels, newLabel],
      eyeX: [...cumulativeData.current.eyeX, newEyeX],
      eyeY: [...cumulativeData.current.eyeY, newEyeY],
      stimX: [...cumulativeData.current.stimX, currentStimX],
      stimY: [...cumulativeData.current.stimY, currentStimY],
    };

    // Trim cumulative data (ALWAYS shift all arrays to keep them in sync)
    if (cumulativeData.current.labels.length > MAX_POINTS) {
      cumulativeData.current.labels.shift();
      cumulativeData.current.eyeX.shift();
      cumulativeData.current.eyeY.shift();
      cumulativeData.current.stimX.shift();
      cumulativeData.current.stimY.shift();
    }

    // Update chart data
    setChartData((prev) => ({
      ...prev,
      labels: cumulativeData.current.labels,
      datasets: [
        { ...prev.datasets[0], data: cumulativeData.current.eyeX },
        { ...prev.datasets[1], data: cumulativeData.current.stimX },
        { ...prev.datasets[2], data: cumulativeData.current.eyeY },
        { ...prev.datasets[3], data: cumulativeData.current.stimY },
      ],
    }));
  };


  // Reset stimulus plotting state
  const resetPlottingState = () => {
    console.log("Resetting stimulus plotting state");

    // Clear all cumulative data to ensure graph starts from the beginning
    cumulativeData.current = {
      labels: [],
      eyeX: [],
      eyeY: [],
      stimX: [],
      stimY: [],
    };

    // Reset chart data state immediately to clear the UI
    setChartData((prev) => ({
      ...prev,
      labels: [],
      datasets: prev.datasets.map(dataset => ({
        ...dataset,
        data: []
      }))
    }));

    setPlottingData((prev) => ({
      ...prev,
      stimX: [],
      stimY: [],
    }));

    currentDataIndex.current = 0;
    csvDataLoaded.current = false;
    stimulusStartTime.current = null;
    stimulusDataComplete.current = false;
    sessionSavedDueToCSVComplete.current = false;
  };

  // Save current session
  const saveCurrentSession = async (keepOpen = false) => {
    if (!currentSession || sessionDataPoints.current.length === 0) {
      console.log("No session or data points to save.");
      return;
    }

    // Only save stimulus sessions if they are fully completed
    if (isStimulusActive.current && !stimulusDataComplete.current) {
      console.log("Stimulus session not complete - as per user request, skipping save.");
      return;
    }

    // Filter to only include data points that have at least eye OR stimulus data
    const validDataPoints = sessionDataPoints.current.filter(
      (dp) =>
        dp.eyeX != null ||
        dp.eyeY != null ||
        dp.stimX != null ||
        dp.stimY != null
    );

    if (validDataPoints.length === 0) {
      console.log("No valid data points to save.");
      return;
    }

    // Calculate statistics
    const pairedDataPoints = validDataPoints.filter((dp) => dp.isPaired);
    const eyeOnlyPoints = validDataPoints.filter(
      (dp) => !dp.isPaired && (dp.eyeX != null || dp.eyeY != null)
    );
    const stimulusOnlyPoints = validDataPoints.filter(
      (dp) => !dp.isPaired && (dp.stimX != null || dp.stimY != null)
    );

    const sessionToSave = {
      ...currentSession,
      sessionEnd: new Date(),
      dataPoints: validDataPoints,
      // Enhanced statistics
      stats: {
        totalDataPoints: validDataPoints.length,
        pairedDataPoints: pairedDataPoints.length,
        eyeOnlyPoints: eyeOnlyPoints.length,
        stimulusOnlyPoints: stimulusOnlyPoints.length,
        durationSeconds: (new Date() - currentSession.sessionStart) / 1000,
        stimulusType: currentSession.stimulusType,
        stimulusShape: currentSession.stimulusShape,
        dataCompleteness: pairedDataPoints.length > 0 ? "Paired" : "Partial",
      },
    };

    const payloadSize = JSON.stringify(sessionToSave).length / 1024;
    console.log(
      `Saving session with ${validDataPoints.length} data points (${pairedDataPoints.length
      } paired), size: ${payloadSize.toFixed(2)} KB`
    );

    try {
      if (examId) {
        const response = await submitTrackingSession(examId, sessionToSave);
        if (response.error) {
          throw new Error(response.error);
        }
        setTrackingSessions((prev) => [...prev, sessionToSave]);
        toast.success("Tracking session saved successfully!");
      } else {
        setTrackingSessions((prev) => [...prev, sessionToSave]);
        toast.success("Tracking session saved locally!");
      }

      if (!keepOpen) {
        // Reset session state
        setCurrentSession(null);
        sessionDataPoints.current = [];
        sessionStarted.current = false;

        // Clear chart data if not keeping open
        if (!keepOpen) {
          cumulativeData.current = {
            labels: [],
            eyeX: [],
            eyeY: [],
            stimX: [],
            stimY: [],
          };
          setChartData((prev) => ({
            ...prev,
            labels: [],
            datasets: [
              { ...prev.datasets[0], data: [] },
              { ...prev.datasets[1], data: [] },
              { ...prev.datasets[2], data: [] },
              { ...prev.datasets[3], data: [] },
            ],
          }));
        }
      } else {
        // Only clear data points, keep session metadata
        sessionDataPoints.current = [];
      }
    } catch (error) {
      console.error("Error saving tracking session:", error);
      toast.error("Failed to save tracking session.");
    }
  };

  // Start new session for stimulus
  const startNewStimulusSession = (resetGraph = true) => {
    if (
      settings.shape &&
      settings.stimulus_type &&
      selectedEye &&
      settings.exam_mode &&
      settings.speed
    ) {
      const newSession = {
        sessionStart: new Date(),
        selectedEye: selectedEye.toLowerCase(),
        stimulusType: settings.stimulus_type,
        stimulusShape: settings.shape,
        speed: settings.speed,
        examMode: settings.exam_mode,
        settingsHistory: [
          {
            stimulusType: settings.stimulus_type,
            stimulusShape: settings.shape,
            speed: settings.speed,
            examMode: settings.exam_mode,
            timestamp: new Date(),
          },
        ],
        dataPoints: [],
      };
      setCurrentSession(newSession);
      sessionDataPoints.current = [];
      sessionStarted.current = true;
      stimulusDataComplete.current = false;
      sessionSavedDueToCSVComplete.current = false;
      console.log("Started new stimulus session:", newSession);

      // Load CSV data for the stimulus
      if (resetGraph) {
        loadCSVData(settings.shape, settings.stimulus_type);
      }
    } else {
      console.log("Cannot start session - missing required settings:", {
        shape: settings.shape,
        stimulus_type: settings.stimulus_type,
        speed: settings.speed,
        selectedEye,
        exam_mode: settings.exam_mode,
      });
    }
  };

  // Handle settings changes
  useEffect(() => {
    if (
      settings.shape &&
      settings.stimulus_type &&
      selectedEye &&
      settings.exam_mode
    ) {
      if (
        !currentSession ||
        currentSession.stimulusType !== settings.stimulus_type ||
        currentSession.stimulusShape !== settings.shape ||
        currentSession.speed !== settings.speed
      ) {
        // Save existing session if it has data AND is complete
        if (
          currentSession &&
          sessionDataPoints.current.length > 0 &&
          !sessionSavedDueToCSVComplete.current &&
          (!isStimulusActive.current || stimulusDataComplete.current)
        ) {
          saveCurrentSession(false).then(() => {
            resetPlottingState();
            startNewStimulusSession();
          });
        } else {
          // If not complete, we just reset and start new without saving old one
          if (currentSession && !sessionSavedDueToCSVComplete.current) {
            console.log("Discarding incomplete stimulus session");
          }
          resetPlottingState();
          startNewStimulusSession();
        }
      }
    } else {
      // If stimulus settings are cleared, save any active session ONLY if complete
      if (
        currentSession &&
        sessionDataPoints.current.length > 0 &&
        !sessionSavedDueToCSVComplete.current &&
        (!isStimulusActive.current || stimulusDataComplete.current)
      ) {
        saveCurrentSession(false);
      } else if (currentSession && !sessionSavedDueToCSVComplete.current) {
        console.log("Discarding incomplete stimulus session on settings clear");
      }
      setCurrentSession(null);
      sessionStarted.current = false;
      stimulusDataComplete.current = false;
    }
  }, [settings.shape, settings.stimulus_type, selectedEye, settings.exam_mode, settings.speed]);

  // Process stimulus data - PAIR WITH EYE DATA
  const startStimulusPlotting = () => {
    if (
      !plottingEnabled ||
      !currentSession ||
      isPaused ||
      stimulusDataComplete.current
    ) {
      console.log("Plotting not started - conditions not met");
      return;
    }

    // Clear any existing interval
    if (stimulusIntervalRef.current) {
      clearInterval(stimulusIntervalRef.current);
    }

    const TICK_INTERVAL = 10; // High frequency for smooth plotting

    console.log(
      `Starting stimulus plotting with ${stimulusXData.current.length} points, starting from index: ${currentDataIndex.current}`
    );

    stimulusIntervalRef.current = setInterval(() => {
      if (isPaused || !plottingEnabled || !currentSession || stimulusDataComplete.current) return;

      if (!stimulusStartTime.current) {
        stimulusStartTime.current = Date.now();
      }

      const elapsedTime = (Date.now() - stimulusStartTime.current) / 1000;
      let pointsProcessed = 0;

      // Process all points that should have occurred by now according to CSV time
      while (
        currentDataIndex.current < stimulusXData.current.length &&
        stimulusXData.current[currentDataIndex.current].time <= elapsedTime
      ) {
        const stimulusIndex = currentDataIndex.current;
        const newStimX = stimulusXData.current[stimulusIndex].value;
        const newStimY = stimulusYData.current[stimulusIndex].value;
        const stimulusTime = stimulusXData.current[stimulusIndex].time;

        // Update cumulative data for plotting
        cumulativeData.current = {
          ...cumulativeData.current,
          labels: [...cumulativeData.current.labels, stimulusTime],
          eyeX: [...cumulativeData.current.eyeX, lastValidEyeData.current.eyeX],
          eyeY: [...cumulativeData.current.eyeY, lastValidEyeData.current.eyeY],
          stimX: [...cumulativeData.current.stimX, newStimX],
          stimY: [...cumulativeData.current.stimY, newStimY],
        };

        // **PAIR STIMULUS DATA WITH EYE DATA**
        if (isStimulusActive.current && !isPaused && currentSession) {
          const {
            eyeX,
            eyeY,
            timestamp: eyeTimestamp,
          } = latestEyeDataForStimulus.current;

          const dataPoint = {
            timestamp: new Date(stimulusTime),
            relativeTime: stimulusXData.current[stimulusIndex].time,
            eyeX: eyeX,
            eyeY: eyeY,
            stimX: newStimX,
            stimY: newStimY,
            stimulusType: currentSession.stimulusType,
            isPaired: true,
            eyeTimestamp: eyeTimestamp,
          };

          sessionDataPoints.current = [
            ...sessionDataPoints.current,
            dataPoint,
          ];
        }

        currentDataIndex.current++;
        pointsProcessed++;

        // Trim data to maintain performance
        if (cumulativeData.current.labels.length > MAX_POINTS) {
          cumulativeData.current.labels.shift();
          cumulativeData.current.eyeX.shift();
          cumulativeData.current.eyeY.shift();
          cumulativeData.current.stimX.shift();
          cumulativeData.current.stimY.shift();
        }
      }

      if (pointsProcessed > 0) {
        // Update chart data
        setChartData((prev) => ({
          ...prev,
          labels: cumulativeData.current.labels,
          datasets: [
            { ...prev.datasets[0], data: cumulativeData.current.eyeX },
            { ...prev.datasets[1], data: cumulativeData.current.stimX },
            { ...prev.datasets[2], data: cumulativeData.current.eyeY },
            { ...prev.datasets[3], data: cumulativeData.current.stimY },
          ],
        }));
      }

      // Check for completion
      if (currentDataIndex.current >= stimulusXData.current.length) {
        console.log("Stimulus data plotting completed - all points processed");
        stimulusDataComplete.current = true;
        sessionSavedDueToCSVComplete.current = true;
        stopStimulusPlotting();
        setPlottingEnabled(false);

        if (currentSession && sessionDataPoints.current.length > 0) {
          saveCurrentSession(false);
        }

        // Reset settings to restart UI selection
        updateSetting("stimulus_type", "");
        updateSetting("shape", "");
      }
    }, TICK_INTERVAL);
  };

  // Stop stimulus plotting
  const stopStimulusPlotting = () => {
    if (stimulusIntervalRef.current) {
      clearInterval(stimulusIntervalRef.current);
      stimulusIntervalRef.current = null;
      console.log("Stimulus plotting stopped");
    }
  };

  // Effect to handle pause/resume of stimulus plotting
  useEffect(() => {
    if (plottingEnabled && !isPaused && !stimulusDataComplete.current) {
      console.log("Starting/resuming stimulus plotting");
      startStimulusPlotting();
    } else {
      console.log("Stopping/pausing stimulus plotting");
      stopStimulusPlotting();
    }

    return () => {
      stopStimulusPlotting();
    };
  }, [plottingEnabled, isPaused, currentSession, plottingData]);

  // Check plotting conditions for stimulus
  useEffect(() => {
    const shouldPlotStimulus =
      centerFocus &&
      settings.stimulus_type &&
      settings.shape &&
      csvDataLoaded.current &&
      selectedEye &&
      !isPaused &&
      !stimulusDataComplete.current;

    console.log("Stimulus plotting conditions:", {
      centerFocus,
      stimulus_type: settings.stimulus_type,
      shape: settings.shape,
      csvDataLoaded: csvDataLoaded.current,
      eyeSelected: !!selectedEye,
      isPaused,
      stimulusDataComplete: stimulusDataComplete.current,
      shouldPlotStimulus,
      currentDataIndex: currentDataIndex.current,
      plottingDataLength: plottingData.stimX.length,
      currentSession: !!currentSession,
    });

    setPlottingEnabled(shouldPlotStimulus);

    if (!shouldPlotStimulus) {
      stopStimulusPlotting();
      if (isPaused) {
        console.log("Paused at stimulus index:", currentDataIndex.current);
      }
    } else {
      stimulusStartTime.current = Date.now();
      console.log(
        "Stimulus plotting enabled, starting from index:",
        currentDataIndex.current,
        "with",
        plottingData.stimX.length,
        "total points"
      );
    }
  }, [
    centerFocus,
    settings.stimulus_type,
    settings.shape,
    csvDataLoaded.current,
    selectedEye,
    isPaused,
    stimulusDataComplete.current,
  ]);

  // Load CSV data for stimulus
  const loadCSVData = async (shape, stimulusType) => {
    try {
      const speed = settings.speed || "slow";
      console.log(
        `Loading CSV data for shape: ${shape}, stimulus_type: ${stimulusType}, speed: ${speed}`
      );

      // Reset stimulus state when loading new CSV data
      resetPlottingState();

      let csvPath = "";
      if (stimulusType === "1") {
        // H-Shape
        csvPath = `/ShapesGraph/H-Shape/H_shape_${speed}.csv`;
      } else if (stimulusType === "3") {
        // Horizontal
        csvPath = `/ShapesGraph/Horizontal-Shape/Horizontal_${speed}.csv`;
      } else if (stimulusType === "2") {
        // Vertical
        csvPath = `/ShapesGraph/Vertical-Shape/Vertical_${speed}.csv`;
      } else {
        console.warn(`No CSV path defined for stimulus type: ${stimulusType}`);
        return;
      }

      const response = await fetch(csvPath);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV file: ${csvPath} (${response.status})`);
      }

      const csvText = await response.text();
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

      const xData = parsed.data
        .map((row) => {
          const timeValue = row["Time(s)"] || row["Time (s)"] || row["Time"] || row["time"] || 0;
          const xValue = row["X"] || row["X Position (pixels)"] || row["X Position"] || row["x"] || 0;
          return {
            time: parseFloat(timeValue) || 0,
            value: parseFloat(xValue) || 0,
          };
        })
        .filter((item) => !isNaN(item.time) && !isNaN(item.value));

      const yData = parsed.data
        .map((row) => {
          const timeValue = row["Time(s)"] || row["Time (s)"] || row["Time"] || row["time"] || 0;
          const yValue = row["Y"] || row["Y Position (pixels)"] || row["Y Position"] || row["y"] || 0;
          return {
            time: parseFloat(timeValue) || 0,
            value: parseFloat(yValue) || 0,
          };
        })
        .filter((item) => !isNaN(item.time) && !isNaN(item.value));

      if (xData.length === 0 || yData.length === 0) {
        throw new Error("Parsed CSV data is empty");
      }

      xData.sort((a, b) => a.time - b.time);
      yData.sort((a, b) => a.time - b.time);

      const limitedXData = xData.slice(0, MAX_POINTS);
      const limitedYData = yData.slice(0, MAX_POINTS);

      stimulusXData.current = limitedXData;
      stimulusYData.current = limitedYData;

      setPlottingData((prev) => ({
        ...prev,
        stimX: limitedXData.map((d) => d.value),
        stimY: limitedYData.map((d) => d.value),
        labels: limitedXData.map((d) => d.time),
      }));

      csvDataLoaded.current = true;
      stimulusDataComplete.current = false;
      sessionSavedDueToCSVComplete.current = false;
      console.log(
        `CSV data loaded successfully for shape: ${shape}, stimulus_type: ${stimulusType}`,
        {
          xDataLength: limitedXData.length,
          yDataLength: limitedYData.length,
          estimatedTime: (limitedXData.length / 4) * 0.005,
        }
      );
    } catch (error) {
      console.error("Error fetching or parsing CSV files:", error);
      toast.error("Error loading stimulus data from CSV files.");
      csvDataLoaded.current = false;
      stimulusDataComplete.current = false;
    }
  };

  const updateSetting = (key, value) => {
    console.log(`Updating setting: ${key} = ${value}`);
    setSettings((prevSettings) => ({ ...prevSettings, [key]: value }));
  };

  const handleCalibrate = () => {
    if (selectedEye && calibrateCounts[selectedEye] < 2) {
      const newCount = calibrateCounts[selectedEye] + 1;
      updateSetting("calibrate", { eye: selectedEye, count: newCount });
      setCalibrateCounts((prev) => ({ ...prev, [selectedEye]: newCount }));
      toast.success(`Calibration sent for ${selectedEye} eye (${newCount}/2)`);
    } else if (calibrateCounts[selectedEye] >= 2) {
      toast.warning(`Calibration limit reached for ${selectedEye} eye`);
    }
  };

  const handleResetCalibration = () => {
    if (selectedEye) {
      setCalibrateCounts((prev) => ({ ...prev, [selectedEye]: 0 }));
      // Send reset command to server
      updateSetting("calibrate", { eye: selectedEye, count: 0 });
      toast.success(`Calibration reset for ${selectedEye} eye`);
    }
  };

  const handleSave = async () => {
    try {
      // Save any active session first
      if (
        currentSession &&
        sessionDataPoints.current.length > 0 &&
        !sessionSavedDueToCSVComplete.current
      ) {
        await saveCurrentSession(false);
      }

      const patientEMR = JSON.parse(localStorage.getItem("patientEMR")) || {};
      const emrBedSideData =
        JSON.parse(localStorage.getItem("emrBedSideData")) || {};
      const emrTelestrokeExam =
        JSON.parse(localStorage.getItem("emrTelestrokeExam")) || {};

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
        hasAphasia: patientEMR.HasAphasia ? "Yes" : "No",
        aphasiaDescription: patientEMR.AphasiaText || null,
      };

      const bedsideExamData = {
        smoothPursuitAndSaccadesResult:
          emrBedSideData.smoothPursuitAndSaccadesResult,
        smoothPursuitAndSaccadesDescription:
          emrBedSideData.smoothPursuitAndSaccadesDescription,
        hasNystagmus: emrBedSideData.hasNystagmus ? "Yes" : "No",
        gazeType: emrBedSideData.gazeType,
        visualFieldsODRUQ:
          emrBedSideData.od?.ruq === "pass"
            ? "Pass"
            : emrBedSideData.od?.ruq
              ? "Fail"
              : null,
        visualFieldsODRLQ:
          emrBedSideData.od?.rlq === "pass"
            ? "Pass"
            : emrBedSideData.od?.rlq
              ? "Fail"
              : null,
        visualFieldsODLUQ:
          emrBedSideData.od?.luq === "pass"
            ? "Pass"
            : emrBedSideData.od?.luq
              ? "Fail"
              : null,
        visualFieldsODLLQ:
          emrBedSideData.od?.llq === "pass"
            ? "Pass"
            : emrBedSideData.od?.llq
              ? "Fail"
              : null,
        extraocularMovementResult: emrBedSideData.extraocularMovementResult,
        extraocularMovementDescription:
          emrBedSideData.extraocularMovementDescription,
        nystagmusDegree: emrBedSideData.nystagmusDegree,
        examTolerated: emrBedSideData.examTolerated ? "Yes" : "No",
        visualFieldsOSRUQ:
          emrBedSideData.os?.ruq === "pass"
            ? "Pass"
            : emrBedSideData.os?.ruq
              ? "Fail"
              : null,
        visualFieldsOSRLQ:
          emrBedSideData.os?.rlq === "pass"
            ? "Pass"
            : emrBedSideData.os?.rlq
              ? "Fail"
              : null,
        visualFieldsOSLUQ:
          emrBedSideData.os?.luq === "pass"
            ? "Pass"
            : emrBedSideData.os?.luq
              ? "Fail"
              : null,
        visualFieldsOSLLQ:
          emrBedSideData.os?.llq === "pass"
            ? "Pass"
            : emrBedSideData.os?.llq
              ? "Fail"
              : null,
      };

      const teleStrokeExamData = {
        tele_smoothPursuitAndSaccadesResult:
          emrTelestrokeExam.smoothPursuitAndSaccadesResult,
        tele_smoothPursuitAndSaccadesDescription:
          emrTelestrokeExam.smoothPursuitAndSaccadesDescription,
        tele_hasNystagmus: emrTelestrokeExam.hasNystagmus ? "Yes" : "No",
        tele_gazeType: emrTelestrokeExam.gazeType,
        tele_visualFieldsODRUQ:
          emrTelestrokeExam.od?.ruq === "pass"
            ? "Pass"
            : emrTelestrokeExam.od?.ruq
              ? "Fail"
              : null,
        tele_visualFieldsODRLQ:
          emrTelestrokeExam.od?.rlq === "pass"
            ? "Pass"
            : emrTelestrokeExam.od?.rlq
              ? "Fail"
              : null,
        tele_visualFieldsODLUQ:
          emrTelestrokeExam.od?.luq === "pass"
            ? "Pass"
            : emrTelestrokeExam.od?.luq
              ? "Fail"
              : null,
        tele_visualFieldsODLLQ:
          emrTelestrokeExam.od?.llq === "pass"
            ? "Pass"
            : emrTelestrokeExam.od?.llq
              ? "Fail"
              : null,
        tele_extraocularMovementResult:
          emrTelestrokeExam.extraocularMovementResult,
        tele_extraocularMovementDescription:
          emrTelestrokeExam.extraocularMovementDescription,
        tele_nystagmusDegree: emrTelestrokeExam.nystagmusDegree,
        tele_examTolerated: emrTelestrokeExam.examTolerated ? "Yes" : "No",
        tele_visualFieldsOSRUQ:
          emrTelestrokeExam.os?.ruq === "pass"
            ? "Pass"
            : emrTelestrokeExam.os?.ruq
              ? "Fail"
              : null,
        tele_visualFieldsOSRLQ:
          emrTelestrokeExam.os?.rlq === "pass"
            ? "Pass"
            : emrTelestrokeExam.os?.rlq
              ? "Fail"
              : null,
        tele_visualFieldsOSLUQ:
          emrTelestrokeExam.os?.luq === "pass"
            ? "Pass"
            : emrTelestrokeExam.os?.luq
              ? "Fail"
              : null,
        tele_visualFieldsOSLLQ:
          emrTelestrokeExam.os?.llq === "pass"
            ? "Pass"
            : emrTelestrokeExam.os?.llq
              ? "Fail"
              : null,
      };

      const dataToSend = {
        patientData,
        bedsideExamData,
        teleStrokeExamData,
        trackingSessions,
      };

      const payloadSize = JSON.stringify(dataToSend).length / 1024;
      console.log(`Submitting exam data, size: ${payloadSize.toFixed(2)} KB`);

      const response = await submitExamData(dataToSend);

      if (response.error) {
        toast.error(response.error);
      } else {
        setExamId(response.data._id);
        toast.success("Exam data saved successfully!");
        localStorage.removeItem("patientEMR");
        localStorage.removeItem("emrBedSideData");
        localStorage.removeItem("emrTelestrokeExam");
        setTrackingSessions([]);
      }
    } catch (error) {
      console.error("Error submitting exam data:", error);
      toast.error("There was an error saving the data. Please try again.");
    }
  };

  useEffect(() => {
    console.log("Sending settings to server:", settings);
    axios
      .post(
        `${process.env.REACT_APP_BACKEND_URL}/videoController-webhook`,
        settings
      )
      .then((response) => {
        console.log("Command sent:", response.data);
      })
      .catch((error) => {
        console.error("Error sending command:", error);
        toast.error("There was an error sending the command!");
      });
  }, [settings]);

  return (
    <>
      <div className="overflow-x-hidden overflow-y-auto">
        <NavBar disableDashboardLink={true} />
        <div className="flex flex-col min-h-screen pt-6 mx-10 mt-10">
          <div className="flex flex-col gap-4 ml-3 w-full">
            {meetingid ? (
              <>
                <div className="flex flex-row justify-between gap-8 pt-5 px-3">
                  <div className="basis-[50%] bg-[#F0F0F0]">
                    <VIDEOSDK setMeetingJoined={setMeetingJoined} />
                  </div>
                  {meetingJoined && (
                    <div className="basis-[40%] p-4 rounded-md bg-white shadow-lg">
                      <div className="w-full flex flex-col gap-6">
                        {/* Horizontal Chart */}
                        {!isPaused ? (
                          <div className="h-[400px] bg-white p-4 rounded-md shadow-sm">
                            <h4 className="text-center font-semibold text-black mb-2">
                              Horizontal Eye Angle and Stimulus (X)
                            </h4>
                            <Line
                              ref={chartRef}
                              data={{
                                labels: chartData.labels,
                                datasets: [
                                  chartData.datasets[0],
                                  chartData.datasets[1],
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                animation: { duration: 0 },
                                hover: { animationDuration: 0 },
                                responsiveAnimationDuration: 0,
                                plugins: {
                                  legend: {
                                    display: true,
                                    position: "top",
                                    labels: {
                                      color: "#000",
                                      boxWidth: 15,
                                      padding: 20,
                                      font: {
                                        weight: 'bold',
                                        size: 14
                                      }
                                    },
                                  },
                                },
                                scales: {
                                  x: {
                                    grid: {
                                      color: "rgba(0, 0, 0, 0.1)",
                                      drawBorder: true,
                                    },
                                    title: {
                                      display: true,
                                      text: "Time (s)",
                                      font: { weight: 'bold', size: 14 }
                                    },
                                    ticks: {
                                      font: { weight: 'bold' }
                                    }
                                  },
                                  y: {
                                    grid: {
                                      color: "rgba(0, 0, 0, 0.1)",
                                      drawBorder: true,
                                    },
                                    min: -70,
                                    max: 70,
                                    title: {
                                      display: true,
                                      text: "Angle/Position (X)",
                                      font: { weight: 'bold', size: 14 }
                                    },
                                    ticks: {
                                      font: { weight: 'bold' }
                                    }
                                  },
                                },
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-[400px] bg-gray-100 p-4 rounded-md shadow-sm flex items-center justify-center">
                            <div className="text-center">
                              <h4 className="text-center font-semibold text-gray-600 mb-2">
                                Chart Paused
                              </h4>
                              <p className="text-gray-500">
                                Resume to view real-time data
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Vertical Chart */}
                        {!isPaused ? (
                          <div className="h-[400px] bg-white p-4 rounded-md shadow-sm">
                            <h4 className="text-center font-semibold text-black mb-2">
                              Vertical Eye Angle and Stimulus (Y)
                            </h4>
                            <Line
                              ref={chartRef}
                              data={{
                                labels: chartData.labels,
                                datasets: [
                                  chartData.datasets[2],
                                  chartData.datasets[3],
                                ],
                              }}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                animation: { duration: 0 },
                                hover: { animationDuration: 0 },
                                responsiveAnimationDuration: 0,
                                plugins: {
                                  legend: {
                                    display: true,
                                    position: "top",
                                    labels: {
                                      color: "#000",
                                      boxWidth: 15,
                                      padding: 20,
                                      font: {
                                        weight: 'bold',
                                        size: 14
                                      }
                                    },
                                  },
                                },
                                scales: {
                                  x: {
                                    grid: {
                                      color: "rgba(0, 0, 0, 0.1)",
                                      drawBorder: true,
                                    },
                                    title: {
                                      display: true,
                                      text: "Time (s)",
                                      font: { weight: 'bold', size: 14 }
                                    },
                                    ticks: {
                                      font: { weight: 'bold' }
                                    }
                                  },
                                  y: {
                                    grid: {
                                      color: "rgba(0, 0, 0, 0.1)",
                                      drawBorder: true,
                                    },
                                    min: -40,
                                    max: 40,
                                    title: {
                                      display: true,
                                      text: "Angle/Position (Y)",
                                      font: { weight: 'bold', size: 14 }
                                    },
                                    ticks: {
                                      font: { weight: 'bold' }
                                    }
                                  },
                                },
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-[400px] bg-gray-100 p-4 rounded-md shadow-sm flex items-center justify-center">
                            <div className="text-center">
                              <h4 className="text-center font-semibold text-gray-600 mb-2">
                                Chart Paused
                              </h4>
                              <p className="text-gray-500">
                                Resume to view real-time data
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {meetingJoined && (
                    <div className="w-full max-w-[280px] bg-slate-200 p-5 rounded-md">
                      <div className="flex flex-col gap-3 justify-evenly items-left">
                        <h3 className="font-bold text-2xl text-center">
                          Video Control Panel
                        </h3>
                        <h3 className="font-bold text-lg">
                          Eye Camera Controls
                        </h3>
                        <div className="flex items-center space-x-6">
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
                            <label htmlFor="left" className="text-lg">
                              Left
                            </label>
                          </div>
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
                                updateSetting("eye_camera_control", "right");
                              }}
                            />
                            <label htmlFor="right" className="text-lg">
                              Right
                            </label>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4"
                            disabled={
                              !selectedEye || calibrateCounts[selectedEye] >= 2
                            }
                            onClick={handleCalibrate}
                          >
                            Calibrate (
                            {selectedEye
                              ? `${calibrateCounts[selectedEye]}/2`
                              : "0/2"}
                            )
                          </button>
                          {selectedEye && calibrateCounts[selectedEye] >= 2 && (
                            <button
                              className="bg-red-500 text-white px-4 py-2 rounded-md"
                              onClick={handleResetCalibration}
                            >
                              Reset Calibration
                            </button>
                          )}
                        </div>
                        {selectedEye && (
                          <>
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
                                checked={centerFocus === true}
                              />
                              <label
                                htmlFor="centerFocus"
                                className="mr-6 text-lg"
                              >
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
                                checked={centerFocus === false}
                              />
                              <label htmlFor="quadrant" className="text-lg">
                                Quadrant
                              </label>
                            </div>

                            {centerFocus ? (
                              <StimulusVideoController
                                settings={settings}
                                updateSetting={updateSetting}
                                isPaused={isPaused}
                                setIsPaused={setIsPaused}
                                togglePause={togglePause}
                              />
                            ) : (
                              <QuadrantTracking
                                settings={settings}
                                updateSetting={updateSetting}
                              />
                            )}
                          </>
                        )}
                        {/* Session status display */}
                        <div className="mt-4 p-3 bg-white rounded-md">
                          <h4 className="font-semibold text-lg mb-2">
                            Session Status
                          </h4>
                          <div className="text-sm">
                            <p>
                              <strong>Active:</strong>{" "}
                              {currentSession ? "Yes" : "No"}
                            </p>
                            <p>
                              <strong>Stimulus:</strong>{" "}
                              {isStimulusActive.current ? "ON" : "OFF"}
                            </p>
                            <p>
                              <strong>Paused:</strong> {isPaused ? "Yes" : "No"}
                            </p>
                            <p>
                              <strong>Data Points:</strong>{" "}
                              {sessionDataPoints.current.length}
                            </p>
                            <p>
                              <strong>CSV Complete:</strong>{" "}
                              {stimulusDataComplete.current ? "Yes" : "No"}
                            </p>
                            <p>
                              <strong>Plotting:</strong>{" "}
                              {plottingEnabled ? "Enabled" : "Disabled"}
                            </p>
                            {currentSession && (
                              <>
                                <p>
                                  <strong>Type:</strong>{" "}
                                  {currentSession.stimulusType}
                                </p>
                                <p>
                                  <strong>Shape:</strong>{" "}
                                  {currentSession.stimulusShape}
                                </p>
                                <p>
                                  <strong>Eye:</strong>{" "}
                                  {currentSession.selectedEye}
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {meetingJoined && (
                  <>
                    <div className="flex flex-row gap-1 ml-2 mt-4">
                      <button
                        className={`rounded-b-none rounded-t-md border-b-0 text-sm ${tab === 0
                          ? "bg-[rgb(5,60,212)] text-white"
                          : "bg-gray-200"
                          }`}
                        onClick={() => setTab(0)}
                      >
                        Patient Info
                      </button>
                      <button
                        className={`rounded-b-none rounded-t-md border-b-0 text-sm ${tab === 1
                          ? "bg-[rgb(5,60,212)] text-white"
                          : "bg-gray-200"
                          }`}
                        onClick={() => setTab(1)}
                      >
                        Bedside Exam
                      </button>
                      <button
                        className={`rounded-b-none rounded-t-md border-b-0 text-sm ${tab === 2
                          ? "bg-[rgb(5,60,212)] text-white"
                          : "bg-gray-200"
                          }`}
                        onClick={() => setTab(2)}
                      >
                        Telestroke Exam
                      </button>
                    </div>
                    <div className="mt-2">
                      {tab === 0 && <EMRPatientInfo />}
                      {tab === 1 && <EMRBedSide />}
                      {tab === 2 && <EMRTelestrokeExam />}
                    </div>
                  </>
                )}
              </>
            ) : (
              <Button>Join Meeting</Button>
            )}
            {meetingJoined && (
              <div className="flex flex-row-reverse gap-8 mx-8 mt-4 mb-6">
                <Button
                  onClick={handleSave}
                  className="scale-110 rounded-lg px-6 py-3"
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
};

export default EMRpage;
