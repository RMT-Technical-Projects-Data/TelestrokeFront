import React, { useEffect, useState, useMemo } from "react";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import client from "../api/client";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faDownload, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Chart from "chart.js/auto";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const EMRReportpage = () => {
  const [examData, setExamData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 6;

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const doctor = localStorage.getItem('Doctor');
        if (!doctor) {
          console.error("Doctor not found in local storage");
          toast.error("Doctor not found in local storage");
          return;
        }

        const response = await client.get('/api/examdatas', {
          params: { Doctor: doctor }
        });
        console.log("Fetched exam data:", response.data);
        setExamData(response.data);
      } catch (error) {
        console.error("Error fetching exam data:", error);
        toast.error("Failed to fetch exam data");
      }
    };
    fetchExamData();
  }, []);

  const generateChartData = (session, isEyeOnly = false) => {
    if (!session?.dataPoints || session.dataPoints.length === 0) {
      console.warn("No data points in session:", session);
      return null;
    }

    const dataPoints = session.dataPoints
      .filter(dp => dp.relativeTime != null && (dp.eyeX != null || dp.eyeY != null || (!isEyeOnly && (dp.stimX != null || dp.stimY != null))))
      .sort((a, b) => a.relativeTime - b.relativeTime);

    if (dataPoints.length === 0) {
      console.warn("No valid data points after filtering:", session);
      return null;
    }

    // Downsample for performance
    const maxDisplayPoints = 1000;
    let processedPoints = dataPoints;
    if (dataPoints.length > maxDisplayPoints) {
      const step = Math.ceil(dataPoints.length / maxDisplayPoints);
      processedPoints = [];
      for (let i = 0; i < dataPoints.length; i += step) {
        const slice = dataPoints.slice(i, i + step);
        const avgPoint = {
          relativeTime: slice.reduce((sum, dp) => sum + (dp.relativeTime || 0), 0) / slice.length,
          eyeX: slice.reduce((sum, dp) => sum + (dp.eyeX || 0), 0) / slice.length,
          eyeY: slice.reduce((sum, dp) => sum + (dp.eyeY || 0), 0) / slice.length,
          stimX: isEyeOnly ? null : slice.reduce((sum, dp) => sum + (dp.stimX || 0), 0) / slice.length,
          stimY: isEyeOnly ? null : slice.reduce((sum, dp) => sum + (dp.stimY || 0), 0) / slice.length,
        };
        processedPoints.push(avgPoint);
      }
    }

    console.log(`Generating chart data for session (eyeOnly: ${isEyeOnly}), points: ${dataPoints.length}, downsampled to ${processedPoints.length}`);
    return {
      labels: processedPoints.map(dp => dp.relativeTime),
      datasets: isEyeOnly ? [
        {
          label: "Eye Angle X",
          borderColor: "#1e40af",
          backgroundColor: "#1e40af",
          fill: false,
          data: processedPoints.map(dp => dp.eyeX),
          pointRadius: 0,
          borderWidth: 1,
          tension: 0.3,
          spanGaps: true,
        },
        {
          label: "Eye Angle Y",
          borderColor: "#9d174d",
          backgroundColor: "#9d174d",
          fill: false,
          data: processedPoints.map(dp => dp.eyeY),
          pointRadius: 0,
          borderWidth: 1,
          tension: 0.3,
          spanGaps: true,
        },
      ] : [
        {
          label: "Eye Angle X",
          borderColor: "#1e40af",
          backgroundColor: "#1e40af",
          fill: false,
          data: processedPoints.map(dp => dp.eyeX),
          pointRadius: 0,
          borderWidth: 1,
          tension: 0.3,
          spanGaps: true,
        },
        {
          label: "Stimulus X",
          borderColor: "#10b981",
          backgroundColor: "#10b981",
          fill: false,
          data: processedPoints.map(dp => dp.stimX),
          pointRadius: 0,
          borderWidth: 1,
          tension: 0.3,
          spanGaps: true,
        },
        {
          label: "Eye Angle Y",
          borderColor: "#9d174d",
          backgroundColor: "#9d174d",
          fill: false,
          data: processedPoints.map(dp => dp.eyeY),
          pointRadius: 0,
          borderWidth: 1,
          tension: 0.3,
          spanGaps: true,
        },
        {
          label: "Stimulus Y",
          borderColor: "#f97316",
          backgroundColor: "#f97316",
          fill: false,
          data: processedPoints.map(dp => dp.stimY),
          pointRadius: 0,
          borderWidth: 1,
          tension: 0.3,
          spanGaps: true,
        },
      ],
    };
  };

  const generatePDF = async (patientData, patientId) => {
    try {
      const doc = new jsPDF();
      const margin = 10;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 15;

      // Title and Doctor
      doc.setFontSize(20);
      doc.text(`Report for Patient ID: ${patientId}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;
      doc.text(`Doctor: ${patientData.patientData.Doctor || 'N/A'}`, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 20;

      // Patient Info
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Patient Info:", margin, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 10;
      doc.text(`Name: ${patientData.patientData.Name || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Date of Birth: ${patientData.patientData.patientDOB ? new Date(patientData.patientData.patientDOB).toLocaleDateString() : 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Sex: ${patientData.patientData.patientSex || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Exam Date: ${patientData.patientData.examDate ? new Date(patientData.patientData.examDate).toLocaleDateString() : 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Visual Activity OD: ${patientData.patientData.visualActivityOD || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Visual Activity OS: ${patientData.patientData.visualActivityOS || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Neurological Findings: ${patientData.patientData.neuroFindings || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Aphasia: ${patientData.patientData.hasAphasia || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Aphasia Description: ${patientData.patientData.aphasiaDescription || 'N/A'}`, margin, yPosition);
      yPosition += 20;

      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 15;
      }

      // Bedside Exam
      doc.setFont("helvetica", "bold");
      doc.text("Bedside Exam:", margin, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 10;
      doc.text(`Smooth Pursuit: ${patientData.bedsideExamData.smoothPursuitAndSaccadesResult || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Smooth Pursuit Description: ${patientData.bedsideExamData.smoothPursuitAndSaccadesDescription || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Has Nystagmus: ${patientData.bedsideExamData.hasNystagmus || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Gaze Type: ${patientData.bedsideExamData.gazeType || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text("Visual Fields OD:", margin, yPosition);
      yPosition += 10;
      doc.text(`ODRUQ: ${patientData.bedsideExamData.visualFieldsODRUQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`ODRLQ: ${patientData.bedsideExamData.visualFieldsODRLQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`ODLUQ: ${patientData.bedsideExamData.visualFieldsODLUQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`ODLLQ: ${patientData.bedsideExamData.visualFieldsODLLQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`Extraocular Movement: ${patientData.bedsideExamData.extraocularMovementResult || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Extraocular Movement Description: ${patientData.bedsideExamData.extraocularMovementDescription || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Nystagmus Degree: ${patientData.bedsideExamData.nystagmusDegree || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Exam Tolerated: ${patientData.bedsideExamData.examTolerated || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text("Visual Fields OS:", margin, yPosition);
      yPosition += 10;
      doc.text(`OSRUQ: ${patientData.bedsideExamData.visualFieldsOSRUQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`OSRLQ: ${patientData.bedsideExamData.visualFieldsOSRLQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`OSLUQ: ${patientData.bedsideExamData.visualFieldsOSLUQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`OSLLQ: ${patientData.bedsideExamData.visualFieldsOSLLQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 20;

      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 15;
      }

      // Telestroke Exam
      doc.setFont("helvetica", "bold");
      doc.text("Telestroke Exam:", margin, yPosition);
      doc.setFont("helvetica", "normal");
      yPosition += 10;
      doc.text(`Smooth Pursuit: ${patientData.teleStrokeExamData.tele_smoothPursuitAndSaccadesResult || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Smooth Pursuit Description: ${patientData.teleStrokeExamData.tele_smoothPursuitAndSaccadesDescription || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Has Nystagmus: ${patientData.teleStrokeExamData.tele_hasNystagmus || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Gaze Type: ${patientData.teleStrokeExamData.tele_gazeType || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text("Visual Fields OD:", margin, yPosition);
      yPosition += 10;
      doc.text(`ODRUQ: ${patientData.teleStrokeExamData.tele_visualFieldsODRUQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`ODRLQ: ${patientData.teleStrokeExamData.tele_visualFieldsODRLQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`ODLUQ: ${patientData.teleStrokeExamData.tele_visualFieldsODLUQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`ODLLQ: ${patientData.teleStrokeExamData.tele_visualFieldsODLLQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`Extraocular Movement: ${patientData.teleStrokeExamData.tele_extraocularMovementResult || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Extraocular Movement Description: ${patientData.teleStrokeExamData.tele_extraocularMovementDescription || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Nystagmus Degree: ${patientData.teleStrokeExamData.tele_nystagmusDegree || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text(`Exam Tolerated: ${patientData.teleStrokeExamData.tele_examTolerated || 'N/A'}`, margin, yPosition);
      yPosition += 10;
      doc.text("Visual Fields OS:", margin, yPosition);
      yPosition += 10;
      doc.text(`OSRUQ: ${patientData.teleStrokeExamData.tele_visualFieldsOSRUQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`OSRLQ: ${patientData.teleStrokeExamData.tele_visualFieldsOSRLQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`OSLUQ: ${patientData.teleStrokeExamData.tele_visualFieldsOSLUQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 10;
      doc.text(`OSLLQ: ${patientData.teleStrokeExamData.tele_visualFieldsOSLLQ || 'N/A'}`, margin + 5, yPosition);
      yPosition += 20;

      // Tracking Sessions Graphs
      const chartContainer = document.createElement("div");
      chartContainer.style.width = "600px";
      chartContainer.style.height = "400px";
      chartContainer.style.position = "absolute";
      chartContainer.style.left = "-9999px";
      chartContainer.style.background = "#fff";
      document.body.appendChild(chartContainer);

      // Group sessions by stimulusType
      const sessionsByStimulusType = patientData.trackingSessions.reduce((acc, session, index) => {
        const key = session.stimulusType === "none" ? "Eye Only" : `Stimulus Type ${session.stimulusType || 'Unknown'}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push({ ...session, index: index + 1 });
        return acc;
      }, {});

      let sessionCount = 0;
      for (const [groupName, sessions] of Object.entries(sessionsByStimulusType)) {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 15;
        }
        doc.setFont("helvetica", "bold");
        doc.text(`${groupName} Sessions:`, margin, yPosition);
        doc.setFont("helvetica", "normal");
        yPosition += 10;

        for (const session of sessions) {
          sessionCount++;
          doc.text(`Session ${sessionCount} (Original Index: ${session.index}):`, margin, yPosition);
          yPosition += 10;
          doc.text(`Start: ${session.sessionStart ? new Date(session.sessionStart).toLocaleString() : 'N/A'}`, margin + 5, yPosition);
          yPosition += 10;
          doc.text(`End: ${session.sessionEnd ? new Date(session.sessionEnd).toLocaleString() : 'N/A'}`, margin + 5, yPosition);
          yPosition += 10;
          doc.text(`Selected Eye: ${session.selectedEye || 'N/A'}`, margin + 5, yPosition);
          yPosition += 10;
          doc.text(`Stimulus Type: ${session.stimulusType || 'N/A'}`, margin + 5, yPosition);
          yPosition += 10;
          doc.text(`Stimulus Shape: ${session.stimulusShape || 'N/A'}`, margin + 5, yPosition);
          yPosition += 10;
          doc.text(`Exam Mode: ${session.examMode || 'N/A'}`, margin + 5, yPosition);
          yPosition += 10;
          if (session.settingsHistory && session.settingsHistory.length > 0) {
            doc.text("Settings History:", margin + 5, yPosition);
            yPosition += 10;
            session.settingsHistory.forEach((setting, idx) => {
              doc.text(`Change ${idx + 1}: Stimulus Type: ${setting.stimulusType || 'N/A'}, Shape: ${setting.stimulusShape || 'N/A'}, Mode: ${setting.examMode || 'N/A'} at ${new Date(setting.timestamp).toLocaleString()}`, margin + 10, yPosition);
              yPosition += 10;
            });
          }

          const isEyeOnly = session.stimulusType === "none";
          const chartData = generateChartData(session, isEyeOnly);
          if (!chartData) {
            doc.text("No valid data available for graphs", margin + 5, yPosition);
            yPosition += 10;
            continue;
          }

          chartContainer.innerHTML = '';
          const xCanvas = document.createElement("canvas");
          xCanvas.width = 600;
          xCanvas.height = 400;
          chartContainer.appendChild(xCanvas);
          const xChart = new Chart(xCanvas.getContext('2d'), {
            type: "line",
            data: {
              labels: chartData.labels,
              datasets: isEyeOnly ? [chartData.datasets[0]] : [chartData.datasets[0], chartData.datasets[1]],
            },
            options: {
              responsive: false,
              maintainAspectRatio: true,
              animation: false,
              plugins: {
                legend: { display: true, position: 'top', labels: { font: { size: 12 } } },
                title: { 
                  display: true, 
                  text: `Session ${sessionCount} - Horizontal Eye Angle${isEyeOnly ? '' : ' and Stimulus'} (X)`, 
                  font: { size: 14 } 
                },
              },
              scales: {
                x: { 
                  type: 'linear',
                  title: { display: true, text: 'Time (s)', font: { size: 12 } },
                  ticks: { stepSize: Math.ceil(chartData.labels.length / 20), font: { size: 10 } }
                },
                y: { 
                  min: -70, 
                  max: 70, 
                  title: { display: true, text: 'Angle/Position (X)', font: { size: 12 } },
                  ticks: { stepSize: 10, font: { size: 10 } }
                },
              },
            },
          });

          await new Promise(resolve => setTimeout(resolve, 1000));
          const xCanvasImg = await html2canvas(chartContainer, { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#fff' 
          });
          const xImgData = xCanvasImg.toDataURL("image/png");
          console.log(`X Chart for session ${sessionCount} generated, points: ${chartData.labels.length}`);

          if (yPosition > pageHeight - 120) {
            doc.addPage();
            yPosition = 15;
          }
          doc.text(`Horizontal Eye Angle${isEyeOnly ? '' : ' and Stimulus'} (X)`, margin, yPosition);
          yPosition += 10;
          doc.addImage(xImgData, "PNG", margin, yPosition, 190, 100);
          yPosition += 110;

          chartContainer.innerHTML = '';
          const yCanvas = document.createElement("canvas");
          yCanvas.width = 600;
          yCanvas.height = 400;
          chartContainer.appendChild(yCanvas);
          const yChart = new Chart(yCanvas.getContext('2d'), {
            type: "line",
            data: {
              labels: chartData.labels,
              datasets: isEyeOnly ? [chartData.datasets[1]] : [chartData.datasets[2], chartData.datasets[3]],
            },
            options: {
              responsive: false,
              maintainAspectRatio: true,
              animation: false,
              plugins: {
                legend: { display: true, position: 'top', labels: { font: { size: 12 } } },
                title: { 
                  display: true, 
                  text: `Session ${sessionCount} - Vertical Eye Angle${isEyeOnly ? '' : ' and Stimulus'} (Y)`, 
                  font: { size: 14 } 
                },
              },
              scales: {
                x: { 
                  type: 'linear',
                  title: { display: true, text: 'Time (s)', font: { size: 12 } },
                  ticks: { stepSize: Math.ceil(chartData.labels.length / 20), font: { size: 10 } }
                },
                y: { 
                  min: -20, 
                  max: 15, 
                  title: { display: true, text: 'Angle/Position (Y)', font: { size: 12 } },
                  ticks: { stepSize: 5, font: { size: 10 } }
                },
              },
            },
          });

          await new Promise(resolve => setTimeout(resolve, 1000));
          const yCanvasImg = await html2canvas(chartContainer, { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#fff' 
          });
          const yImgData = yCanvasImg.toDataURL("image/png");
          console.log(`Y Chart for session ${sessionCount} generated, points: ${chartData.labels.length}`);

          if (yPosition > pageHeight - 120) {
            doc.addPage();
            yPosition = 15;
          }
          doc.text(`Vertical Eye Angle${isEyeOnly ? '' : ' and Stimulus'} (Y)`, margin, yPosition);
          yPosition += 10;
          doc.addImage(yImgData, "PNG", margin, yPosition, 190, 100);
          yPosition += 110;

          xChart.destroy();
          yChart.destroy();
        }
      }

      document.body.removeChild(chartContainer);
      doc.save(`Patient_${patientId}_Report.pdf`);
      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    }
  };

  const handleShowReport = (patientId) => {
    const patientData = examData.find((exam) => exam.patientData.patientid === patientId);
    if (!patientData) {
      console.error(`No patient data found for ID: ${patientId}`);
      toast.error("Patient data not found");
      return;
    }

    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      console.error("Failed to open new window for report");
      toast.error("Failed to open report window");
      return;
    }

    reportWindow.document.write(`
      <html>
        <head>
          <title>Patient Report - ${patientId}</title>
          <style>
            body {
              font-family: 'Helvetica', sans-serif;
              margin: 20px;
              line-height: 1.6;
              background-color: #f9f9fb;
              color: #333;
              display: flex;
              flex-direction: column;
              align-items: center;
              min-height: 100vh;
            }
            h1 {
              font-size: 28px;
              margin-bottom: 20px;
              color: #4f46e5;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
            .header {
              display: flex;
              flex-direction: column;
              align-items: center;
              margin-bottom: 30px;
              padding-bottom: 10px;
              border-bottom: 2px solid #d1d5db;
            }
            .section {
              margin-bottom: 40px;
              background: #ffffff;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              width: 80%;
            }
            .section-header {
              font-size: 20px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 15px;
              border-left: 5px solid #4f46e5;
              padding-left: 10px;
            }
            .field {
              margin-bottom: 12px;
              font-size: 16px;
              padding: 8px;
              border-radius: 5px;
              display: flex;
              justify-content: space-between;
            }
            .field-title {
              font-weight: bold;
              color: #4b5563;
            }
            .field-value {
              color: #111827;
            }
            .chart-container {
              margin-top: 20px;
              width: 600px;
              height: 400px;
            }
            button {
              display: block;
              margin: 30px auto;
              padding: 12px 24px;
              font-size: 16px;
              background-color: #4f46e5;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              transition: background-color 0.3s, transform 0.3s;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            button:hover {
              background-color: #3730a3;
              transform: scale(1.05);
            }
            button:active {
              transform: scale(0.95);
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js"></script>
        </head>
        <body>
          <div class="header">
            <h1>Report for Patient ID: ${patientId}</h1>
            <span><strong>Doctor:</strong> ${patientData.patientData.Doctor || 'N/A'}</span>
          </div>

          <div class="section">
            <div class="section-header">Patient Info</div>
            <div class="field"><span class="field-title">Name:</span> <span class="field-value">${patientData.patientData.Name || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Date of Birth:</span> <span class="field-value">${patientData.patientData.patientDOB ? new Date(patientData.patientData.patientDOB).toLocaleDateString() : 'N/A'}</span></div>
            <div class="field"><span class="field-title">Sex:</span> <span class="field-value">${patientData.patientData.patientSex || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Exam Date:</span> <span class="field-value">${patientData.patientData.examDate ? new Date(patientData.patientData.examDate).toLocaleDateString() : 'N/A'}</span></div>
            <div class="field"><span class="field-title">Visual Activity OD:</span> <span class="field-value">${patientData.patientData.visualActivityOD || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Visual Activity OS:</span> <span class="field-value">${patientData.patientData.visualActivityOS || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Neurological Findings:</span> <span class="field-value">${patientData.patientData.neuroFindings || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Aphasia:</span> <span class="field-value">${patientData.patientData.hasAphasia || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Aphasia Description:</span> <span class="field-value">${patientData.patientData.aphasiaDescription || 'N/A'}</span></div>
          </div>

          <div class="section">
            <div class="section-header">Bedside Exam</div>
            <div class="field"><span class="field-title">Smooth Pursuit:</span> <span class="field-value">${patientData.bedsideExamData.smoothPursuitAndSaccadesResult || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Smooth Pursuit Description:</span> <span class="field-value">${patientData.bedsideExamData.smoothPursuitAndSaccadesDescription || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Has Nystagmus:</span> <span class="field-value">${patientData.bedsideExamData.hasNystagmus || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Gaze Type:</span> <span class="field-value">${patientData.bedsideExamData.gazeType || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Visual Fields OD:</span> <span class="field-value"></span></div>
            <div class="field"><span class="field-title">ODRUQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsODRUQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">ODRLQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsODRLQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">ODLUQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsODLUQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">ODLLQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsODLLQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Extraocular Movement:</span> <span class="field-value">${patientData.bedsideExamData.extraocularMovementResult || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Extraocular Movement Description:</span> <span class="field-value">${patientData.bedsideExamData.extraocularMovementDescription || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Nystagmus Degree:</span> <span class="field-value">${patientData.bedsideExamData.nystagmusDegree || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Exam Tolerated:</span> <span class="field-value">${patientData.bedsideExamData.examTolerated || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Visual Fields OS:</span> <span class="field-value"></span></div>
            <div class="field"><span class="field-title">OSRUQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsOSRUQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">OSRLQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsOSRLQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">OSLUQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsOSLUQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">OSLLQ:</span> <span class="field-value">${patientData.bedsideExamData.visualFieldsOSLLQ || 'N/A'}</span></div>
          </div>

          <div class="section">
            <div class="section-header">Telestroke Exam</div>
            <div class="field"><span class="field-title">Smooth Pursuit:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_smoothPursuitAndSaccadesResult || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Smooth Pursuit Description:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_smoothPursuitAndSaccadesDescription || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Has Nystagmus:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_hasNystagmus || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Gaze Type:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_gazeType || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Visual Fields OD:</span> <span class="field-value"></span></div>
            <div class="field"><span class="field-title">ODRUQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsODRUQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">ODRLQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsODRLQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">ODLUQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsODLUQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">ODLLQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsODLLQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Extraocular Movement:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_extraocularMovementResult || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Extraocular Movement Description:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_extraocularMovementDescription || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Nystagmus Degree:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_nystagmusDegree || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Exam Tolerated:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_examTolerated || 'N/A'}</span></div>
            <div class="field"><span class="field-title">Visual Fields OS:</span> <span class="field-value"></span></div>
            <div class="field"><span class="field-title">OSRUQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsOSRUQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">OSRLQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsOSRLQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">OSLUQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsOSLUQ || 'N/A'}</span></div>
            <div class="field"><span class="field-title">OSLLQ:</span> <span class="field-value">${patientData.teleStrokeExamData.tele_visualFieldsOSLLQ || 'N/A'}</span></div>
          </div>

          ${patientData.trackingSessions && patientData.trackingSessions.length > 0 ? 
            Object.entries(patientData.trackingSessions.reduce((acc, session, index) => {
              const key = session.stimulusType === "none" ? "Eye Only" : `Stimulus Type ${session.stimulusType || 'Unknown'}`;
              if (!acc[key]) acc[key] = [];
              acc[key].push({ ...session, index: index + 1 });
              return acc;
            }, {})).map(([groupName, sessions]) => `
              <div class="section">
                <div class="section-header">${groupName} Sessions</div>
                ${sessions.map((session, idx) => `
                  <div class="field"><span class="field-title">Session ${idx + 1} (Original Index: ${session.index}):</span> <span class="field-value"></span></div>
                  <div class="field"><span class="field-title">Start:</span> <span class="field-value">${session.sessionStart ? new Date(session.sessionStart).toLocaleString() : 'N/A'}</span></div>
                  <div class="field"><span class="field-title">End:</span> <span class="field-value">${session.sessionEnd ? new Date(session.sessionEnd).toLocaleString() : 'N/A'}</span></div>
                  <div class="field"><span class="field-title">Selected Eye:</span> <span class="field-value">${session.selectedEye || 'N/A'}</span></div>
                  <div class="field"><span class="field-title">Stimulus Type:</span> <span class="field-value">${session.stimulusType || 'N/A'}</span></div>
                  <div class="field"><span class="field-title">Stimulus Shape:</span> <span class="field-value">${session.stimulusShape || 'N/A'}</span></div>
                  <div class="field"><span class="field-title">Exam Mode:</span> <span class="field-value">${session.examMode || 'N/A'}</span></div>
                  ${session.settingsHistory && session.settingsHistory.length > 0 ? `
                    <div class="field"><span class="field-title">Settings History:</span> <span class="field-value"></span></div>
                    ${session.settingsHistory.map((setting, sIdx) => `
                      <div class="field"><span class="field-title">Change ${sIdx + 1}:</span> <span class="field-value">Stimulus Type: ${setting.stimulusType || 'N/A'}, Shape: ${setting.stimulusShape || 'N/A'}, Mode: ${setting.examMode || 'N/A'} at ${new Date(setting.timestamp).toLocaleString()}</span></div>
                    `).join('')}
                  ` : ''}
                  ${generateChartData(session, session.stimulusType === "none") ? `
                    <div class="chart-container">
                      <canvas id="xChart${session.index}" width="600" height="400"></canvas>
                    </div>
                    <div class="chart-container">
                      <canvas id="yChart${session.index}" width="600" height="400"></canvas>
                    </div>
                  ` : '<div class="field">No valid data available for graphs</div>'}
                `).join('')}
              </div>
            `).join('') : 
            '<div class="section"><div class="section-header">Tracking Sessions</div><div class="field">No tracking sessions available</div></div>'}

          <button onclick="window.print()">Print Report</button>

          <script>
            document.addEventListener('DOMContentLoaded', () => {
              ${patientData.trackingSessions && patientData.trackingSessions.length > 0 ? patientData.trackingSessions.map((session, index) => {
                const isEyeOnly = session.stimulusType === "none";
                const chartData = generateChartData(session, isEyeOnly);
                if (!chartData) {
                  console.warn(`No chart data for session ${index + 1}`);
                  return '';
                }
                return `
                  console.log('Initializing chart for session ${index + 1}, points: ${chartData.labels.length}');
                  const xChart${index + 1} = document.getElementById('xChart${index + 1}');
                  if (xChart${index + 1}) {
                    new Chart(xChart${index + 1}.getContext('2d'), {
                      type: 'line',
                      data: {
                        labels: ${JSON.stringify(chartData.labels)},
                        datasets: ${JSON.stringify(isEyeOnly ? [chartData.datasets[0]] : [chartData.datasets[0], chartData.datasets[1]])},
                      },
                      options: {
                        responsive: false,
                        maintainAspectRatio: true,
                        animation: false,
                        plugins: {
                          legend: { display: true, position: 'top', labels: { font: { size: 12 } } },
                          title: { 
                            display: true, 
                            text: 'Horizontal Eye Angle${isEyeOnly ? '' : ' and Stimulus'} (X)', 
                            font: { size: 14 } 
                          },
                        },
                        scales: {
                          x: { 
                            type: 'linear',
                            title: { display: true, text: 'Time (s)', font: { size: 12 } },
                            ticks: { stepSize: ${Math.ceil(chartData.labels.length / 20)}, font: { size: 10 } }
                          },
                          y: { 
                            min: -70, 
                            max: 70, 
                            title: { display: true, text: 'Angle/Position (X)', font: { size: 12 } },
                            ticks: { stepSize: 10, font: { size: 10 } }
                          },
                        },
                      },
                    });
                  }
                  const yChart${index + 1} = document.getElementById('yChart${index + 1}');
                  if (yChart${index + 1}) {
                    new Chart(yChart${index + 1}.getContext('2d'), {
                      type: 'line',
                      data: {
                        labels: ${JSON.stringify(chartData.labels)},
                        datasets: ${JSON.stringify(isEyeOnly ? [chartData.datasets[1]] : [chartData.datasets[2], chartData.datasets[3]])},
                      },
                      options: {
                        responsive: false,
                        maintainAspectRatio: true,
                        animation: false,
                        plugins: {
                          legend: { display: true, position: 'top', labels: { font: { size: 12 } } },
                          title: { 
                            display: true, 
                            text: 'Vertical Eye Angle${isEyeOnly ? '' : ' and Stimulus'} (Y)', 
                            font: { size: 14 } 
                          },
                        },
                        scales: {
                          x: { 
                            type: 'linear',
                            title: { display: true, text: 'Time (s)', font: { size: 12 } },
                            ticks: { stepSize: ${Math.ceil(chartData.labels.length / 20)}, font: { size: 10 } }
                          },
                          y: { 
                            min: -20, 
                            max: 15, 
                            title: { display: true, text: 'Angle/Position (Y)', font: { size: 12 } },
                            ticks: { stepSize: 5, font: { size: 10 } }
                          },
                        },
                      },
                    });
                  }
                `;
              }).join('') : 'console.log("No tracking sessions to plot");'}
            });
          </script>
        </body>
      </html>
    `);
    reportWindow.document.close();
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const filteredExamData = useMemo(() => {
    return examData.filter((exam) =>
      exam.patientData.patientid.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.patientData.Name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [examData, searchQuery]);

  const totalPages = Math.ceil(filteredExamData.length / rowsPerPage);
  const currentRows = filteredExamData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="flex flex-col lg:flex-row pt-24">
        <Sidebar page="EMR" />
        <main className="flex-1 lg:ml-[250px] p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                EMR Reports
              </h1>
              <div className="w-full sm:w-1/2 lg:w-1/3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search by Patient ID or Name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-indigo-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Patient ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Patient Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentRows.length > 0 ? (
                      currentRows.map((exam) => (
                        <tr key={`${exam.patientData.patientid}-${exam.patientData.Name || 'unknown'}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {exam.patientData.patientid}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {exam.patientData.Name || 'N/A'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleShowReport(exam.patientData.patientid)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                              >
                                <FontAwesomeIcon icon={faEye} className="mr-1" />
                                View
                              </Button>
                              <Button
                                onClick={() => generatePDF(exam, exam.patientData.patientid)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                              >
                                <FontAwesomeIcon icon={faDownload} className="mr-1" />
                                Download
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                          No reports found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {filteredExamData.length > rowsPerPage && (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex-1 flex justify-between items-center sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                        currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * rowsPerPage, filteredExamData.length)}
                        </span>{' '}
                        of <span className="font-medium">{filteredExamData.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Previous</span>
                          <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          <span className="sr-only">Next</span>
                          <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default EMRReportpage;