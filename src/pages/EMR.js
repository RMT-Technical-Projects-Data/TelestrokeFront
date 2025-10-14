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
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Line } from "react-chartjs-2";
import Chart from "chart.js/auto";
import { submitExamData, submitTrackingSession } from "../utils/auth";
import Papa from 'papaparse';

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
    speed: "",
    stop: "",
    coordinates: "",
    shape: ""
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
    labels: []
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
      },
      {
        label: "Stimulus X",
        borderColor: "#10b981",
        backgroundColor: "#10b981",
        fill: false,
        data: [],
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: "Eye Angle Y",
        borderColor: "#9d174d",
        backgroundColor: "#9d174d",
        fill: false,
        data: [],
        pointRadius: 0,
        tension: 0.3,
      },
      {
        label: "Stimulus Y",
        borderColor: "#f97316",
        backgroundColor: "#f97316",
        fill: false,
        data: [],
        pointRadius: 0,
        tension: 0.3,
      },
    ],
  });

  const chartRef = useRef(null);
  const MAX_POINTS = 1000;
  const PLOTTING_INTERVAL = 100;
  const SESSION_SAVE_INTERVAL = 30000;
  const csvDataLoaded = useRef(false);
  const stimulusXData = useRef([]);
  const stimulusYData = useRef([]);
  const currentDataIndex = useRef(0);
  const cumulativeData = useRef({
    labels: [],
    eyeX: [],
    eyeY: [],
    stimX: [],
    stimY: []
  });
  const webSocketRef = useRef(null);
  const eyeDataBuffer = useRef([]);
  const sessionDataPoints = useRef([]);
  const lastValidEyeData = useRef({ eyeX: 0, eyeY: 0 });
  const SMOOTH_WINDOW = 5;
  const lastEyeTimestamp = useRef(null);
  const stimulusStartTime = useRef(null);
  const sessionStarted = useRef(false);
  const [calibrateCounts, setCalibrateCounts] = useState({ left: 0, right: 0 });

  // Initialize WebSocket and start session on first eye data
  useEffect(() => {
    webSocketRef.current = new WebSocket("ws://localhost:3001");

    webSocketRef.current.onopen = () => {
      console.log("WebSocket connected for eye data");
    };

    webSocketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "eye_data") {
          const timestamp = data?.timestamp || Date.now();
          lastEyeTimestamp.current = timestamp;

          const angle_x = data?.angle_x != null ? data.angle_x : lastValidEyeData.current.eyeX;
          const angle_y = data?.angle_y != null ? data.angle_y : lastValidEyeData.current.eyeY;

          // Start session on first eye data
          if (!sessionStarted.current) {
            setCurrentSession({
              sessionStart: new Date(timestamp),
              selectedEye: selectedEye?.toLowerCase() || "none",
              stimulusType: "none",
              stimulusShape: null,
              examMode: null,
              settingsHistory: [],
              dataPoints: []
            });
            sessionStarted.current = true;
            console.log("Started new session on first eye data");
          }

          // Add raw data to buffer
          eyeDataBuffer.current.push({
            angle_x,
            angle_y,
            timestamp
          });

          if (angle_x != null && angle_y != null) {
            lastValidEyeData.current = { eyeX: angle_x, eyeY: angle_y };
          }

          if (eyeDataBuffer.current.length > MAX_POINTS) {
            eyeDataBuffer.current.shift();
          }

          processAndPlotEyeData();
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
        toast.error("WebSocket error occurred.");
      }
    };

    webSocketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast.error("WebSocket error occurred.");
    };

    webSocketRef.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      if (webSocketRef.current) {
        webSocketRef.current.close();
      }
    };
  }, []);

  // Process and plot eye data
  const processAndPlotEyeData = () => {
    if (eyeDataBuffer.current.length === 0) return;

    let newEyeX = null;
    let newEyeY = null;
    let newLabel = (lastEyeTimestamp.current || Date.now()) / 1000;

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

    // Update cumulative data for plotting
    cumulativeData.current = {
      ...cumulativeData.current,
      labels: [...cumulativeData.current.labels, newLabel],
      eyeX: [...cumulativeData.current.eyeX, newEyeX],
      eyeY: [...cumulativeData.current.eyeY, newEyeY],
    };

    // Trim cumulative data
    if (cumulativeData.current.labels.length > MAX_POINTS) {
      cumulativeData.current.labels.shift();
      cumulativeData.current.eyeX.shift();
      cumulativeData.current.eyeY.shift();
      if (cumulativeData.current.stimX.length > 0) {
        cumulativeData.current.stimX.shift();
        cumulativeData.current.stimY.shift();
      }
    }

    // Update chart data
    setChartData(prev => ({
      ...prev,
      labels: cumulativeData.current.labels,
      datasets: [
        { ...prev.datasets[0], data: cumulativeData.current.eyeX },
        { ...prev.datasets[1], data: cumulativeData.current.stimX },
        { ...prev.datasets[2], data: cumulativeData.current.eyeY },
        { ...prev.datasets[3], data: cumulativeData.current.stimY },
      ],
    }));

    // Save raw eye data to session
    if (currentSession) {
      const latest = eyeDataBuffer.current[eyeDataBuffer.current.length - 1];
      const dataPoint = {
        timestamp: new Date(lastEyeTimestamp.current || Date.now()),
        relativeTime: ((lastEyeTimestamp.current || Date.now()) - currentSession.sessionStart.getTime()) / 1000,
        eyeX: latest.angle_x, // Save raw data
        eyeY: latest.angle_y, // Save raw data
        stimX: null,
        stimY: null,
        stimulusType: currentSession.stimulusType
      };
      sessionDataPoints.current = [...sessionDataPoints.current, dataPoint];
    }

    console.log("Eye data processed:", { newEyeX, newEyeY, newLabel });
  };

  // Periodic session save
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentSession && sessionDataPoints.current.length > 0) {
        saveCurrentSession(true);
      }
    }, SESSION_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [currentSession]);

  // Reset stimulus plotting state
  const resetPlottingState = () => {
    console.log("Resetting stimulus plotting state");
    setPlottingData(prev => ({
      ...prev,
      stimX: [],
      stimY: [],
      labels: prev.labels
    }));
    cumulativeData.current = {
      labels: cumulativeData.current.labels,
      eyeX: cumulativeData.current.eyeX,
      eyeY: cumulativeData.current.eyeY,
      stimX: [],
      stimY: []
    };
    currentDataIndex.current = 0;
    csvDataLoaded.current = false;
    stimulusStartTime.current = null;
  };

  // Save current session
  const saveCurrentSession = async (keepOpen = false) => {
    if (!currentSession || sessionDataPoints.current.length === 0) {
      console.log("No session or data points to save.");
      return;
    }

    // Filter out completely invalid points
    const validDataPoints = sessionDataPoints.current.filter(
      dp => dp.eyeX != null || dp.eyeY != null || dp.stimX != null || dp.stimY != null
    );

    if (validDataPoints.length === 0) {
      console.log("No valid data points to save.");
      return;
    }

    const sessionToSave = {
      ...currentSession,
      sessionEnd: new Date(),
      dataPoints: validDataPoints
    };

    const payloadSize = JSON.stringify(sessionToSave).length / 1024;
    console.log(`Saving session with ${validDataPoints.length} data points, size: ${payloadSize.toFixed(2)} KB`);

    try {
      if (examId) {
        const response = await submitTrackingSession(examId, sessionToSave);
        if (response.error) {
          throw new Error(response.error);
        }
        setTrackingSessions(prev => [...prev, sessionToSave]);
        toast.success("Tracking session saved successfully!");
      } else {
        setTrackingSessions(prev => [...prev, sessionToSave]);
      }

      if (!keepOpen) {
        setCurrentSession(null);
        sessionDataPoints.current = [];
        cumulativeData.current = { labels: [], eyeX: [], eyeY: [], stimX: [], stimY: [] };
        setChartData(prev => ({
          ...prev,
          labels: [],
          datasets: [
            { ...prev.datasets[0], data: [] },
            { ...prev.datasets[1], data: [] },
            { ...prev.datasets[2], data: [] },
            { ...prev.datasets[3], data: [] },
          ],
        }));
        sessionStarted.current = false;
      } else {
        sessionDataPoints.current = [];
      }
    } catch (error) {
      console.error("Error saving tracking session:", error);
      toast.error("Failed to save tracking session.");
    }
  };

  // Start new session for stimulus
  const startNewStimulusSession = () => {
    if (settings.shape && settings.stimulus_type && selectedEye && settings.exam_mode) {
      const newSession = {
        sessionStart: new Date(),
        selectedEye: selectedEye.toLowerCase(),
        stimulusType: settings.stimulus_type,
        stimulusShape: settings.shape,
        examMode: settings.exam_mode,
        settingsHistory: [{
          stimulusType: settings.stimulus_type,
          stimulusShape: settings.shape,
          examMode: settings.exam_mode,
          timestamp: new Date()
        }],
        dataPoints: []
      };
      setCurrentSession(newSession);
      sessionDataPoints.current = [];
      console.log("Started new stimulus session:", newSession);
    }
  };

  // Handle settings changes
  useEffect(() => {
    if (settings.shape && settings.stimulus_type && selectedEye && settings.exam_mode) {
      if (currentSession && currentSession.stimulusType === "none") {
        // Transition from eye-only to stimulus: save and start new session
        saveCurrentSession().then(() => {
          resetPlottingState();
          startNewStimulusSession();
          loadCSVData(settings.shape, settings.stimulus_type);
        });
      } else if (currentSession && currentSession.stimulusType !== settings.stimulus_type) {
        // Stimulus type changed: save and start new session
        saveCurrentSession().then(() => {
          resetPlottingState();
          startNewStimulusSession();
          loadCSVData(settings.shape, settings.stimulus_type);
        });
      } else if (!currentSession) {
        // No session yet, but conditions met: start stimulus session
        startNewStimulusSession();
        loadCSVData(settings.shape, settings.stimulus_type);
      }
    }
  }, [settings.shape, settings.stimulus_type, selectedEye, settings.exam_mode]);

  // Check plotting conditions for stimulus
  useEffect(() => {
    const shouldPlotStimulus = centerFocus && settings.stimulus_type && settings.shape && csvDataLoaded.current && lastEyeTimestamp.current && selectedEye;
    console.log("Stimulus plotting conditions:", {
      centerFocus,
      stimulus_type: settings.stimulus_type,
      shape: settings.shape,
      csvDataLoaded: csvDataLoaded.current,
      eyeDataAvailable: !!lastEyeTimestamp.current,
      eyeSelected: !!selectedEye,
      shouldPlotStimulus
    });
    setPlottingEnabled(shouldPlotStimulus);

    if (!shouldPlotStimulus) {
      resetPlottingState();
    } else {
      stimulusStartTime.current = Date.now();
      console.log("Stimulus plotting enabled");
    }
  }, [centerFocus, settings.stimulus_type, settings.shape, csvDataLoaded.current, lastEyeTimestamp.current, selectedEye]);

  // Process stimulus data
  useEffect(() => {
    if (!plottingEnabled || !currentSession) return;

    const intervalRef = setInterval(() => {
      let newStimX = null;
      let newStimY = null;

      if (plottingData.stimX.length > 0) {
        if (currentDataIndex.current >= plottingData.stimX.length) {
          currentDataIndex.current = 0;
          stimulusStartTime.current = Date.now();
          console.log("Stimulus data looping back to start");
        }

        const index = currentDataIndex.current;
        newStimX = plottingData.stimX[index];
        newStimY = plottingData.stimY[index];
        currentDataIndex.current += 1;

        cumulativeData.current = {
          ...cumulativeData.current,
          stimX: [...cumulativeData.current.stimX, newStimX],
          stimY: [...cumulativeData.current.stimY, newStimY],
        };

        if (cumulativeData.current.labels.length > MAX_POINTS) {
          cumulativeData.current.labels.shift();
          cumulativeData.current.eyeX.shift();
          cumulativeData.current.eyeY.shift();
          cumulativeData.current.stimX.shift();
          cumulativeData.current.stimY.shift();
        }

        setChartData(prev => ({
          ...prev,
          labels: cumulativeData.current.labels,
          datasets: [
            { ...prev.datasets[0], data: cumulativeData.current.eyeX },
            { ...prev.datasets[1], data: cumulativeData.current.stimX },
            { ...prev.datasets[2], data: cumulativeData.current.eyeY },
            { ...prev.datasets[3], data: cumulativeData.current.stimY },
          ],
        }));

        const dataPoint = {
          timestamp: new Date(lastEyeTimestamp.current || Date.now()),
          relativeTime: ((lastEyeTimestamp.current || Date.now()) - currentSession.sessionStart.getTime()) / 1000,
          eyeX: lastValidEyeData.current.eyeX,
          eyeY: lastValidEyeData.current.eyeY,
          stimX: newStimX,
          stimY: newStimY,
          stimulusType: currentSession.stimulusType
        };
        sessionDataPoints.current = [...sessionDataPoints.current, dataPoint];
      }
    }, PLOTTING_INTERVAL);

    return () => clearInterval(intervalRef);
  }, [plottingEnabled, currentSession, plottingData]);

  // Load CSV data for stimulus
  const loadCSVData = async (shape, stimulusType) => {
    try {
      console.log(`Loading CSV data for shape: ${shape}, stimulus_type: ${stimulusType}`);
      
      let csvPaths;
      if (stimulusType === '2') {
        csvPaths = {
          x: '/ShapesGraph/Vx.csv',
          y: '/ShapesGraph/Vy.csv',
        };
      } else if (stimulusType === '3') {
        csvPaths = {
          x: '/ShapesGraph/HorizX.csv',
          y: '/ShapesGraph/HorizY.csv',
        };
      } else if (stimulusType === '1') {
        csvPaths = {
          x: '/ShapesGraph/Hx.csv',
          y: '/ShapesGraph/Hy.csv',
        };
      } else {
        throw new Error(`Invalid stimulus type: ${stimulusType}`);
      }

      const [xResponse, yResponse] = await Promise.all([
        fetch(csvPaths.x),
        fetch(csvPaths.y)
      ]);

      if (!xResponse.ok || !yResponse.ok) {
        throw new Error(`Failed to fetch CSV files: X(${xResponse.status}), Y(${yResponse.status})`);
      }

      const xText = await xResponse.text();
      const yText = await yResponse.text();
      
      const xParsed = Papa.parse(xText, { header: true, skipEmptyLines: true });
      const yParsed = Papa.parse(yText, { header: true, skipEmptyLines: true });

      const xData = xParsed.data.map(row => {
        const timeValue = row['Time (s)'] || row['Time'] || row['time'] || 0;
        const xValue = row['X Position (pixels)'] || row['X Position'] || row['X'] || row['x'] || 0;
        
        return {
          time: parseFloat(timeValue) || 0,
          value: parseFloat(xValue) || 0
        };
      }).filter(item => !isNaN(item.time) && !isNaN(item.value));
      
      const yData = yParsed.data.map(row => {
        const timeValue = row['Time (s)'] || row['Time'] || row['time'] || 0;
        const yValue = row['Y Position (pixels)'] || row['Y Position'] || row['Y'] || row['y'] || 0;
        
        return {
          time: parseFloat(timeValue) || 0,
          value: parseFloat(yValue) || 0
        };
      }).filter(item => !isNaN(item.time) && !isNaN(item.value));

      if (xData.length === 0 || yData.length === 0) {
        throw new Error("Parsed CSV data is empty");
      }

      xData.sort((a, b) => a.time - b.time);
      yData.sort((a, b) => a.time - b.time);

      const limitedXData = xData.slice(0, MAX_POINTS);
      const limitedYData = yData.slice(0, MAX_POINTS);

      stimulusXData.current = limitedXData;
      stimulusYData.current = limitedYData;

      setPlottingData(prev => ({
        ...prev,
        stimX: limitedXData.map(d => d.value),
        stimY: limitedYData.map(d => d.value),
        labels: limitedXData.map(d => d.time)
      }));

      csvDataLoaded.current = true;
      console.log(`CSV data loaded successfully for shape: ${shape}, stimulus_type: ${stimulusType}`, {
        xDataLength: limitedXData.length,
        yDataLength: limitedYData.length
      });
    } catch (error) {
      console.error("Error fetching or parsing CSV files:", error);
      toast.error("Error loading stimulus data from CSV files.");
      csvDataLoaded.current = false;
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
      setCalibrateCounts(prev => ({ ...prev, [selectedEye]: newCount }));
      toast.success(`Calibration sent for ${selectedEye} eye (${newCount}/2)`);
    } else if (calibrateCounts[selectedEye] >= 2) {
      toast.warning(`Calibration limit reached for ${selectedEye} eye`);
    }
  };

  const handleResetCalibration = () => {
    if (selectedEye) {
      setCalibrateCounts(prev => ({ ...prev, [selectedEye]: 0 }));
      updateSetting("calibrate", { eye: selectedEye, count: 0 });
      toast.success(`Calibration reset for ${selectedEye} eye`);
    }
  };

  const handleSave = async () => {
    try {
      await saveCurrentSession();

      const patientEMR = JSON.parse(localStorage.getItem("patientEMR")) || {};
      const emrBedSideData = JSON.parse(localStorage.getItem("emrBedSideData")) || {};
      const emrTelestrokeExam = JSON.parse(localStorage.getItem("emrTelestrokeExam")) || {};

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
        aphasiaDescription: patientEMR.AphasiaText || null,
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

      const dataToSend = {
        patientData,
        bedsideExamData,
        teleStrokeExamData,
        trackingSessions
      };

      const payloadSize = JSON.stringify(dataToSend).length / 1024;
      console.log(`Submitting exam data, size: ${payloadSize.toFixed(2)} KB`);

      const response = await submitExamData(dataToSend);
      console.log("Data saved successfully:", response);

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
      .post(`${process.env.REACT_APP_BACKEND_URL}/videoController-webhook`, settings)
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
                                  position: 'top',
                                  labels: {
                                    color: '#000',
                                    boxWidth: 12,
                                    padding: 15,
                                  },
                                },
                              },
                              scales: {
                                x: {
                                  grid: { color: 'rgba(0, 0, 0, 0.15)', drawBorder: true },
                                  title: { display: true, text: 'Time (s)' },
                                },
                                y: {
                                  grid: { color: 'rgba(0, 0, 0, 0.15)', drawBorder: true },
                                  min: -70,
                                  max: 70,
                                  title: { display: true, text: 'Angle/Position (X)' },
                                },
                              },
                            }}
                          />
                        </div>
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
                                  position: 'top',
                                  labels: {
                                    color: '#000',
                                    boxWidth: 12,
                                    padding: 15,
                                  },
                                },
                              },
                              scales: {
                                x: {
                                  grid: { color: 'rgba(0, 0, 0, 0.15)', drawBorder: true },
                                  title: { display: true, text: 'Time (s)' },
                                },
                                y: {
                                  grid: { color: 'rgba(0, 0, 0, 0.15)', drawBorder: true },
                                  min: -40,
                                  max: 40,
                                  title: { display: true, text: 'Angle/Position (Y)' },
                                },
                              },
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {meetingJoined && (
                    <div className="w-full max-w-[280px] bg-slate-200 p-5 rounded-md">
                      <div className="flex flex-col gap-3 justify-evenly items-left">
                        <h3 className="font-bold text-2xl text-center">
                          Video Control Panel
                        </h3>
                        <h3 className="font-bold text-lg">Eye Camera Controls</h3>
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
                            <label htmlFor="left" className="text-lg">Left</label>
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
                            <label htmlFor="right" className="text-lg">Right</label>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-md mt-4"
                            disabled={!selectedEye || calibrateCounts[selectedEye] >= 2}
                            onClick={handleCalibrate}
                          >
                            Calibrate ({selectedEye ? `${calibrateCounts[selectedEye]}/2` : '0/2'})
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
                                checked={centerFocus === true}
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
                              />
                            ) : (
                              <QuadrantTracking
                                settings={settings}
                                updateSetting={updateSetting}
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {meetingJoined && (
                  <>
                    <div className="flex flex-row gap-1 ml-2 mt-4">
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