import React, { useEffect, useState, useMemo } from "react";
import AppShell from "../components/AppShell";
import { Search } from "lucide-react";
import client from "../api/client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faDownload, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Line } from 'react-chartjs-2';
import Chart from "chart.js/auto";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Papa from 'papaparse';

const downsamplePoints = (points, maxPoints) => {
  if (!maxPoints || points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  return points.filter((_, index) => index % step === 0 || index === points.length - 1);
};

const EMRReportpage = () => {
  const [examData, setExamData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [stimulusTemplates, setStimulusTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [generatingPDFs, setGeneratingPDFs] = useState({}); // Track generating state per row
  const [viewingReports, setViewingReports] = useState({});
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const entriesOptions = [10, 25, 50, 100];

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };

    const loadStimulusTemplates = async () => {
      try {
        console.log("Loading stimulus templates for reports...");
        const templates = {
          '1': await loadCSVData('1'),
          '2': await loadCSVData('2'),
          '3': await loadCSVData('3')
        };
        setStimulusTemplates(templates);
        console.log("Stimulus templates loaded for reports");
      } catch (error) {
        console.error("Error loading stimulus templates:", error);
      }
    };

    fetchExamData();
    loadStimulusTemplates();
  }, []);

  // Load CSV data for stimulus templates
  const loadCSVData = async (stimulusType) => {
    try {
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
        return { x: [], y: [], labels: [] };
      }

      const [xResponse, yResponse] = await Promise.all([
        fetch(csvPaths.x),
        fetch(csvPaths.y)
      ]);

      if (!xResponse.ok || !yResponse.ok) {
        throw new Error(`Failed to fetch CSV files`);
      }

      const xText = await xResponse.text();
      const yText = await yResponse.text();

      const xParsed = Papa.parse(xText, { header: true, skipEmptyLines: true });
      const yParsed = Papa.parse(yText, { header: true, skipEmptyLines: true });

      const xData = xParsed.data.map(row => {
        const xValue = row['X Position (pixels)'] || row['X Position'] || row['X'] || row['x'] || 0;
        return parseFloat(xValue) || 0;
      }).filter(value => !isNaN(value));

      const yData = yParsed.data.map(row => {
        const yValue = row['Y Position (pixels)'] || row['Y Position'] || row['Y'] || row['y'] || 0;
        return parseFloat(yValue) || 0;
      }).filter(value => !isNaN(value));

      // Create time labels based on the actual data points
      const labels = Array.from({ length: Math.max(xData.length, yData.length) }, (_, i) => i * 0.1);

      return {
        x: xData,
        y: yData,
        labels: labels
      };
    } catch (error) {
      console.error("Error loading CSV template:", error);
      return { x: [], y: [], labels: [] };
    }
  };

  const fetchFullExam = async (exam) => {
    const hasPoints = exam?.trackingSessions?.some(
      (session) => Array.isArray(session.dataPoints) && session.dataPoints.length > 0
    );
    const needsPoints = Boolean(exam?.trackingSessions?.length) && !hasPoints;
    if (!needsPoints || !exam?._id) return exam;
    const response = await client.get(`/api/examdatas/${exam._id}`);
    return response.data;
  };

  const generateChartData = (session, isEyeOnly = false, maxPoints) => {
    if (!session?.dataPoints || session.dataPoints.length === 0) {
      console.warn("No data points in session:", session);
      return null;
    }

    // Use the actual recorded data points
    const dataPoints = downsamplePoints(
      session.dataPoints
        .filter(dp => dp.relativeTime != null && (dp.eyeX != null || dp.eyeY != null))
        .sort((a, b) => a.relativeTime - b.relativeTime),
      maxPoints
    );

    if (dataPoints.length === 0) {
      console.warn("No valid data points after filtering:", session);
      return null;
    }

    // Get stimulus template for this session
    const stimulusTemplate = stimulusTemplates[session.stimulusType] || { x: [], y: [], labels: [] };

    console.log(`Generating chart data for session ${session.stimulusType}, points: ${dataPoints.length}`);

    // For charts, we need to align the stimulus data with the eye data time points
    const alignedStimulusData = alignStimulusWithEyeData(dataPoints, stimulusTemplate);

    return {
      labels: dataPoints.map(dp => dp.relativeTime),
      datasets: isEyeOnly ? [
        {
          label: "Eye Angle X",
          borderColor: "#1e40af",
          backgroundColor: "#1e40af",
          fill: false,
          data: dataPoints.map(dp => dp.eyeX),
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1,
        },
        {
          label: "Eye Angle Y",
          borderColor: "#9d174d",
          backgroundColor: "#9d174d",
          fill: false,
          data: dataPoints.map(dp => dp.eyeY),
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1,
        },
      ] : [
        // Eye X
        {
          label: "Eye Angle X",
          borderColor: "#1e40af",
          backgroundColor: "#1e40af",
          fill: false,
          data: dataPoints.map(dp => dp.eyeX),
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1,
        },
        // Stimulus XManage and view patient examination records


        {
          label: "Stimulus Trajectory X",
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: false,
          data: dataPoints.map(dp => dp.stimX),
          pointRadius: 0,
          borderWidth: 2, // Thicker for better visibility
          tension: 0.3,
          borderDash: [5, 5],
        },
        // Eye Y
        {
          label: "Eye Angle Y",
          borderColor: "#9d174d",
          backgroundColor: "#9d174d",
          fill: false,
          data: dataPoints.map(dp => dp.eyeY),
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1,
        },
        // Stimulus Y
        {
          label: "Stimulus Trajectory Y",
          borderColor: "#f97316",
          backgroundColor: "rgba(249, 115, 22, 0.1)",
          fill: false,
          data: dataPoints.map(dp => dp.stimY),
          pointRadius: 0,
          borderWidth: 2, // Thicker for better visibility
          tension: 0.3,
          borderDash: [5, 5],
        },
      ],
    };
  };

  // Align stimulus data with eye data time points
  const alignStimulusWithEyeData = (eyeDataPoints, stimulusTemplate) => {
    if (!stimulusTemplate.x.length || !stimulusTemplate.y.length) {
      return { x: [], y: [] };
    }

    const alignedX = [];
    const alignedY = [];

    // For each eye data point, find the corresponding stimulus point
    eyeDataPoints.forEach((eyePoint, index) => {
      // Use modulo to loop through stimulus data if eye data is longer
      const stimulusIndex = index % Math.min(stimulusTemplate.x.length, stimulusTemplate.y.length);

      alignedX.push(stimulusTemplate.x[stimulusIndex] || 0);
      alignedY.push(stimulusTemplate.y[stimulusIndex] || 0);
    });

    return { x: alignedX, y: alignedY };
  };

  // Helper function to format field names for display
  const formatFieldName = (fieldName) => {
    return String(fieldName || "")
      .replace(/^tele_/i, "")
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/\bO d\b/gi, "OD")
      .replace(/\bO s\b/gi, "OS")
      .replace(/\bR u q\b/gi, "RUQ")
      .replace(/\bR l q\b/gi, "RLQ")
      .replace(/\bL u q\b/gi, "LUQ")
      .replace(/\bL l q\b/gi, "LLQ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const isDisplayableExamValue = (key, value) => {
    if (key === "_id" || key === "__v" || key === "id") return false;
    if (value === null || value === undefined) return false;
    if (typeof value === "object") return false;
    const text = String(value).trim();
    return text !== "" && text !== "N/A";
  };

  const toExamRows = (examObject, keyTransform) =>
    Object.entries(examObject || {})
      .filter(([key, value]) => isDisplayableExamValue(key, value))
      .map(([key, value]) => [
        formatFieldName(keyTransform ? keyTransform(key) : key),
        String(value),
      ]);

  const ensureSpace = (doc, y, needed, margin, pageHeight) => {
    if (y + needed <= pageHeight - margin) return y;
    doc.addPage();
    return margin;
  };

  const drawSectionTitle = (doc, title, y, margin, colors) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...colors.primary);
    doc.text(title, margin, y);
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(0.6);
    doc.line(margin, y + 2.5, margin + 48, y + 2.5);
    return y + 8;
  };

  const createPdfTable = (doc, headers, rows, startY, margin, columnStyles = {}) => {
    autoTable(doc, {
      startY,
      head: [headers],
      body: rows,
      margin: { left: margin, right: margin, top: margin, bottom: margin + 8 },
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: { top: 3.2, right: 4, bottom: 3.2, left: 4 },
        textColor: [30, 41, 59],
        lineColor: [203, 213, 225],
        lineWidth: 0.2,
        valign: "middle",
        overflow: "linebreak",
        minCellHeight: 8,
      },
      headStyles: {
        fillColor: [44, 90, 160],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9.5,
        cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles,
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 0) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.textColor = [51, 65, 85];
        }
      },
    });

    return (doc.lastAutoTable?.finalY || startY) + 12;
  };

  const generateChartImage = async (chartData, title, isEyeOnly, chartType, preview = false) => {
    const width = preview ? 800 : 1200;
    const height = preview ? 400 : 600;
    const container = document.createElement("div");
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.background = "#ffffff";
    document.body.appendChild(container);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      container.appendChild(canvas);

      const datasets = chartType === "horizontal"
        ? (isEyeOnly ? [chartData.datasets[0]] : [chartData.datasets[0], chartData.datasets[1]])
        : (isEyeOnly ? [chartData.datasets[1]] : [chartData.datasets[2], chartData.datasets[3]]);

      const chart = new Chart(canvas, {
        type: "line",
        data: {
          labels: chartData.labels,
          datasets
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: false,
          plugins: {
            legend: {
              display: true,
              position: "top",
              labels: {
                font: { size: preview ? 12 : 16, weight: "bold" },
                usePointStyle: true,
                padding: preview ? 10 : 20
              }
            },
            title: {
              display: true,
              text: title,
              font: { size: preview ? 14 : 20, weight: "bold" },
              padding: { bottom: preview ? 10 : 20 }
            },
          },
          scales: {
            x: {
              type: "linear",
              title: {
                display: true,
                text: "Time (seconds)",
                font: { size: preview ? 11 : 14, weight: "bold" }
              }
            },
            y: {
              min: chartType === "horizontal" ? -70 : -40,
              max: chartType === "horizontal" ? 70 : 40,
              title: {
                display: true,
                text: chartType === "horizontal" ? "Horizontal Position" : "Vertical Position",
                font: { size: preview ? 11 : 14, weight: "bold" }
              }
            },
          },
          elements: {
            line: { borderWidth: 2 },
            point: { radius: 0 }
          },
        },
      });

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const image = chart.toBase64Image("image/png", preview ? 0.85 : 1);
      chart.destroy();
      return image;
    } finally {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };

  const generatePDF = async (examSummary, patientId, rowIndex) => {
    const rowKey = `${patientId}-${rowIndex}`;
    setGeneratingPDFs((prev) => ({ ...prev, [rowKey]: true }));

    try {
      const patientData = await fetchFullExam(examSummary);
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const margin = 14;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const colors = {
        primary: [44, 90, 160],
        muted: [100, 116, 139],
        text: [30, 41, 59],
        line: [226, 232, 240],
      };

      const reportId = patientData.reportId || examSummary.reportId || "N/A";
      const examDateText = patientData.patientData?.examDate
        ? new Date(patientData.patientData.examDate).toLocaleDateString()
        : new Date().toLocaleDateString();
      const patientName = patientData.patientData?.Name || "N/A";

      // Header banner
      doc.setFillColor(...colors.primary);
      doc.rect(0, 0, pageWidth, 42, "F");
      doc.setFillColor(30, 64, 130);
      doc.rect(0, 42, pageWidth, 4, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text("Oculomotor Examination Report", pageWidth / 2, 16, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Report ID: ${reportId}`, margin, 28);
      doc.text(`Meeting ID: ${patientId || "N/A"}`, margin, 35);
      doc.text(`Patient: ${patientName}`, pageWidth - margin, 28, { align: "right" });
      doc.text(`Exam Date: ${examDateText}`, pageWidth - margin, 35, { align: "right" });

      let yPosition = 56;

      // Patient Information
      yPosition = drawSectionTitle(doc, "PATIENT INFORMATION", yPosition, margin, colors);
      const patientInfoData = [
        ["Meeting ID", patientData.patientData?.patientid || "N/A"],
        ["Name", patientName],
        [
          "Date of Birth",
          patientData.patientData?.patientDOB
            ? new Date(patientData.patientData.patientDOB).toLocaleDateString()
            : "N/A",
        ],
        ["Sex", patientData.patientData?.patientSex || "N/A"],
        ["Exam Date", examDateText],
        ["Doctor", patientData.patientData?.Doctor || "N/A"],
        ["Visual Activity OD", patientData.patientData?.visualActivityOD || "N/A"],
        ["Visual Activity OS", patientData.patientData?.visualActivityOS || "N/A"],
        ["Neurological Findings", patientData.patientData?.neuroFindings || "N/A"],
        ["Aphasia", patientData.patientData?.hasAphasia || "N/A"],
        ["Aphasia Description", patientData.patientData?.aphasiaDescription || "N/A"],
      ];
      yPosition = createPdfTable(doc, ["Field", "Value"], patientInfoData, yPosition, margin, {
        0: { cellWidth: 58 },
        1: { cellWidth: "auto" },
      });

      // Bedside Exam
      const bedsideData = toExamRows(patientData.bedsideExamData);
      if (bedsideData.length > 0) {
        yPosition = ensureSpace(doc, yPosition, 28, margin, pageHeight);
        yPosition = drawSectionTitle(doc, "BEDSIDE EXAMINATION", yPosition, margin, colors);
        yPosition = createPdfTable(
          doc,
          ["Examination Parameter", "Findings"],
          bedsideData,
          yPosition,
          margin,
          {
            0: { cellWidth: 78 },
            1: { cellWidth: "auto" },
          }
        );
      }

      // Telestroke Exam
      const telestrokeData = toExamRows(patientData.teleStrokeExamData, (key) =>
        String(key).replace(/^tele_/i, "")
      );
      if (telestrokeData.length > 0) {
        yPosition = ensureSpace(doc, yPosition, 28, margin, pageHeight);
        yPosition = drawSectionTitle(doc, "TELESTROKE EXAMINATION", yPosition, margin, colors);
        yPosition = createPdfTable(
          doc,
          ["Examination Parameter", "Findings"],
          telestrokeData,
          yPosition,
          margin,
          {
            0: { cellWidth: 78 },
            1: { cellWidth: "auto" },
          }
        );
      }

      // Tracking Sessions
      if (patientData.trackingSessions?.length > 0) {
        const sessionsByStimulusType = patientData.trackingSessions.reduce((acc, session, index) => {
          const key =
            session.stimulusType === "none"
              ? "Eye Only"
              : `Stimulus Type ${session.stimulusType || "Unknown"}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push({ ...session, originalIndex: index + 1 });
          return acc;
        }, {});

        let sessionCount = 0;
        try {
          for (const [groupName, sessions] of Object.entries(sessionsByStimulusType)) {
            yPosition = ensureSpace(doc, yPosition, 30, margin, pageHeight);
            yPosition = drawSectionTitle(
              doc,
              `${groupName.toUpperCase()} SESSIONS`,
              yPosition,
              margin,
              colors
            );

            for (const session of sessions) {
              sessionCount += 1;
              yPosition = ensureSpace(doc, yPosition, 40, margin, pageHeight);

              const sessionInfoData = [
                ["Session Number", `Session ${sessionCount}`],
                [
                  "Start Time",
                  session.sessionStart ? new Date(session.sessionStart).toLocaleString() : "N/A",
                ],
                [
                  "End Time",
                  session.sessionEnd ? new Date(session.sessionEnd).toLocaleString() : "N/A",
                ],
                ["Selected Eye", session.selectedEye || "N/A"],
                ["Stimulus Type", session.stimulusType || "N/A"],
                ["Stimulus Shape", session.stimulusShape || "N/A"],
                ["Exam Mode", session.examMode || "N/A"],
                ["Data Points", String(session.dataPoints?.length || 0)],
              ];

              yPosition = createPdfTable(
                doc,
                ["Parameter", "Value"],
                sessionInfoData,
                yPosition,
                margin,
                {
                  0: { cellWidth: 58 },
                  1: { cellWidth: "auto" },
                }
              );

              const isEyeOnly = session.stimulusType === "none";
              const chartData = generateChartData(session, isEyeOnly);
              const chartWidth = pageWidth - 2 * margin;
              const chartHeight = chartWidth * 0.45;

              if (chartData) {
                const xChartImage = await generateChartImage(
                  chartData,
                  `Horizontal Eye Movement - Session ${sessionCount}`,
                  isEyeOnly,
                  "horizontal"
                );
                yPosition = ensureSpace(doc, yPosition, chartHeight + 16, margin, pageHeight);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(...colors.text);
                doc.text(`Horizontal Movement - Session ${sessionCount}`, margin, yPosition);
                yPosition += 4;
                doc.addImage(xChartImage, "PNG", margin, yPosition, chartWidth, chartHeight);
                yPosition += chartHeight + 10;

                const yChartImage = await generateChartImage(
                  chartData,
                  `Vertical Eye Movement - Session ${sessionCount}`,
                  isEyeOnly,
                  "vertical"
                );
                yPosition = ensureSpace(doc, yPosition, chartHeight + 16, margin, pageHeight);
                doc.setFont("helvetica", "bold");
                doc.setFontSize(10);
                doc.setTextColor(...colors.text);
                doc.text(`Vertical Movement - Session ${sessionCount}`, margin, yPosition);
                yPosition += 4;
                doc.addImage(yChartImage, "PNG", margin, yPosition, chartWidth, chartHeight);
                yPosition += chartHeight + 12;
              } else {
                yPosition = ensureSpace(doc, yPosition, 14, margin, pageHeight);
                doc.setFont("helvetica", "italic");
                doc.setFontSize(9);
                doc.setTextColor(...colors.muted);
                doc.text("No chart data available for this session.", margin, yPosition);
                yPosition += 12;
              }
            }
          }
        } catch (error) {
          console.error("Error generating charts:", error);
        }
      } else {
        yPosition = ensureSpace(doc, yPosition, 14, margin, pageHeight);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(...colors.muted);
        doc.text("No tracking sessions available.", margin, yPosition);
      }

      // Footer on every page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(...colors.line);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...colors.muted);
        doc.text(`Report ${reportId}`, margin, pageHeight - 7);
        doc.text(`Generated ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 7, {
          align: "center",
        });
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 7, {
          align: "right",
        });
      }

      doc.save(`Patient_${patientId}_Report.pdf`);
      toast.success("PDF report generated successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      setGeneratingPDFs((prev) => ({ ...prev, [rowKey]: false }));
    }
  };

  const handleShowReport = async (examSummary) => {
    if (!examSummary) {
      console.error(`No patient data provided`);
      toast.error("Patient data not found");
      return;
    }

    const reportKey = examSummary._id || examSummary.patientData?.patientid;
    setViewingReports((prev) => ({ ...prev, [reportKey]: true }));

    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      setViewingReports((prev) => ({ ...prev, [reportKey]: false }));
      toast.error("Please allow popups to view the report");
      return;
    }

    reportWindow.document.write(`
      <html>
        <head>
          <title>Loading Report...</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: #f8fafc; }
            .loader { border: 4px solid #f3f3f3; border-top: 4px solid #4f46e5; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div style="text-align: center;">
            <div class="loader" style="margin: 0 auto 20px;"></div>
            <p>Opening report...</p>
          </div>
        </body>
      </html>
    `);

    try {
    const patientData = await fetchFullExam(examSummary);

    const sessionCharts = await Promise.all(
      (patientData.trackingSessions || []).map(async (session, i) => {
        const isEyeOnly = session.stimulusType === "none";
        const chartData = generateChartData(session, isEyeOnly, 400);
        if (!chartData) return null;
        const [x, y] = await Promise.all([
          generateChartImage(chartData, `Horizontal Movement - Session ${i + 1}`, isEyeOnly, "horizontal", true),
          generateChartImage(chartData, `Vertical Movement - Session ${i + 1}`, isEyeOnly, "vertical", true),
        ]);
        return { x, y };
      })
    );

    const reportHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Medical Report - ${patientData.patientData.patientid}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            body { 
              font-family: 'Inter', sans-serif; 
              margin: 0; 
              padding: 40px; 
              background-color: #f1f5f9;
              color: #1e293b;
            }
            .report-container {
              max-width: 1000px;
              margin: 0 auto;
              background: white;
              padding: 60px;
              border-radius: 24px;
              shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            }
            .header { 
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 30px;
              margin-bottom: 40px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .header h1 { margin: 0; color: #4f46e5; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; }
            .header-meta { text-align: right; color: #64748b; font-size: 14px; }
            
            .section { margin-bottom: 50px; }
            .section-title { 
              font-size: 18px; 
              font-weight: 700; 
              color: #0f172a;
              margin-bottom: 20px;
              padding-bottom: 8px;
              border-bottom: 2px solid #f1f5f9;
              display: flex;
              align-items: center;
            }
            .section-title::before {
              content: '';
              display: inline-block;
              width: 4px;
              height: 18px;
              background: #4f46e5;
              margin-right: 12px;
              border-radius: 2px;
            }
            
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
            .field { padding: 12px 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; }
            .field-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
            .field-value { font-size: 15px; font-weight: 500; color: #334155; }
            
            .session-card {
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              padding: 30px;
              margin-bottom: 30px;
              background: #ffffff;
            }
            .session-header { font-weight: 700; font-size: 18px; margin-bottom: 20px; color: #4f46e5; display: flex; justify-content: space-between; }
            
            .chart-grid { display: grid; grid-template-columns: 1fr; gap: 30px; margin-top: 20px; }
            .chart-container { background: #fff; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9; }
            .chart-container h4 { margin: 0 0 15px 0; color: #64748b; font-size: 14px; text-align: center; }
            .chart-image { width: 100%; height: auto; border-radius: 8px; }
            
            .print-btn {
              position: fixed;
              bottom: 40px;
              right: 40px;
              background: #4f46e5;
              color: white;
              border: none;
              padding: 16px 32px;
              border-radius: 50px;
              font-weight: 700;
              cursor: pointer;
              box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.4);
              transition: all 0.2s;
              z-index: 100;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .print-btn:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(79, 70, 229, 0.5); }
            
            @media print {
              .print-btn { display: none; }
              body { background: white; padding: 0; }
              .report-container { box-shadow: none; padding: 0; margin: 0; max-width: none; border: none; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <div>
                <h1 style="color: #4f46e5; font-size: 24px;">${patientData.patientData.Name || "Examination Report"}</h1>
                <div style="color: #64748b; font-weight: 600; margin-top: 4px;">Meeting ID: ${patientData.patientData.patientid || "N/A"}</div>
              </div>
              <div class="header-meta">
                <div>Doctor: <strong>${patientData.patientData.Doctor || 'N/A'}</strong></div>
                <div>Generated: ${new Date().toLocaleString()}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Patient Demographics</div>
              <div class="grid">
                <div class="field"><div class="field-label">Name</div><div class="field-value">${patientData.patientData.Name || 'N/A'}</div></div>
                <div class="field"><div class="field-label">DOB</div><div class="field-value">${patientData.patientData.patientDOB ? new Date(patientData.patientData.patientDOB).toLocaleDateString() : 'N/A'}</div></div>
                <div class="field"><div class="field-label">Sex</div><div class="field-value">${patientData.patientData.patientSex || 'N/A'}</div></div>
                <div class="field"><div class="field-label">Exam Date</div><div class="field-value">${patientData.patientData.examDate ? new Date(patientData.patientData.examDate).toLocaleDateString() : 'N/A'}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Clinical Findings</div>
              <div class="grid">
                <div class="field"><div class="field-label">Visual Activity OD</div><div class="field-value">${patientData.patientData.visualActivityOD || 'N/A'}</div></div>
                <div class="field"><div class="field-label">Visual Activity OS</div><div class="field-value">${patientData.patientData.visualActivityOS || 'N/A'}</div></div>
                <div class="field" style="grid-column: span 2;"><div class="field-label">Neurological Findings</div><div class="field-value">${patientData.patientData.neuroFindings || 'N/A'}</div></div>
                <div class="field"><div class="field-label">Aphasia</div><div class="field-value">${patientData.patientData.hasAphasia || 'No'}</div></div>
                <div class="field"><div class="field-label">Aphasia Detail</div><div class="field-value">${patientData.patientData.aphasiaDescription || 'N/A'}</div></div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Tracking Data & Charts</div>
              ${patientData.trackingSessions && patientData.trackingSessions.length > 0 ?
        patientData.trackingSessions.map((session, index) => `
                  <div class="session-card">
                    <div class="session-header">
                      <span>SESSION #${index + 1}</span>
                      <span style="font-size: 12px; color: #64748b; font-weight: 500;">
                        ${session.stimulusType !== 'none' ? `${session.stimulusShape} Shape (${session.speed})` : 'Eye Only'}
                      </span>
                    </div>
                    <div class="grid" style="margin-bottom: 25px;">
                      <div class="field"><div class="field-label">Start</div><div class="field-value">${session.sessionStart ? new Date(session.sessionStart).toLocaleTimeString() : 'N/A'}</div></div>
                      <div class="field"><div class="field-label">Eye</div><div class="field-value" style="text-transform: capitalize;">${session.selectedEye || 'N/A'}</div></div>
                    </div>
                    
                    ${sessionCharts[index] ? `
                      <div class="chart-grid">
                        <div class="chart-container">
                          <h4>HORIZONTAL TRACKING</h4>
                          <img src="${sessionCharts[index].x}" class="chart-image" alt="Horizontal Chart">
                        </div>
                        <div class="chart-container">
                          <h4>VERTICAL TRACKING</h4>
                          <img src="${sessionCharts[index].y}" class="chart-image" alt="Vertical Chart">
                        </div>
                      </div>
                    ` : '<div style="color: #94a3b8; font-style: italic; text-align: center;">No chart available for this session</div>'}
                  </div>
                `).join('') :
        '<div style="text-align: center; color: #94a3b8; padding: 40px;">No tracking sessions recorded.</div>'
      }
            </div>
          </div>

          <button class="print-btn" onclick="window.print()">
            <svg style="width: 20px; height: 20px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
            Print Full Report
          </button>
        </body>
      </html>
    `;

    reportWindow.document.open();
    reportWindow.document.write(reportHtml);
    reportWindow.document.close();
    } catch (error) {
      console.error("Error opening report:", error);
      toast.error("Failed to open report");
      if (reportWindow && !reportWindow.closed) {
        reportWindow.document.open();
        reportWindow.document.write("<p style='font-family:sans-serif;padding:40px;'>Failed to load report.</p>");
        reportWindow.document.close();
      }
    } finally {
      setViewingReports((prev) => ({ ...prev, [reportKey]: false }));
    }
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const filteredExamData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return examData;
    return examData.filter((exam) => {
      const patientId = exam.patientData?.patientid || "";
      const name = exam.patientData?.Name || "";
      return (
        patientId.toLowerCase().includes(query) ||
        name.toLowerCase().includes(query)
      );
    });
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

  const handleEntriesChange = (event) => {
    const nextSize = Number(event.target.value) || 10;
    setRowsPerPage(nextSize);
    setCurrentPage(1);
  };

  const formatExamDate = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString();
  };

  const showingFrom = filteredExamData.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const showingTo = Math.min(currentPage * rowsPerPage, filteredExamData.length);

  // Check if a specific row's PDF is being generated
  const isGeneratingPDF = (patientId, rowIndex) => {
    const rowKey = `${patientId}-${rowIndex}`;
    return generatingPDFs[rowKey] || false;
  };

  const reportActions = (
    <div className="ts-search-wrap">
      <Search size={16} />
      <input
        type="search"
        value={searchQuery}
        onChange={handleSearchChange}
        placeholder="Search by meeting ID or patient"
        className="ts-search"
      />
    </div>
  );

  if (loading) {
    return (
      <AppShell page="EMR" title="EMR Reports" subtitle="Patient examination records.">
        <div className="ts-loading">
          <span className="ts-spinner" /> Loading exam data...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      page="EMR"
      title="EMR Reports"
      subtitle="Manage and view patient examination records."
      actions={reportActions}
    >
      <div className="ts-panel">
        <div className="ts-panel-head">
          <h3 className="ts-panel-title">Examination records</h3>
          <span className="ts-panel-meta">{filteredExamData.length} shown</span>
        </div>
        <div className="ts-table-wrap">
          <table className="ts-table">
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Meeting ID</th>
                <th>Patient</th>
                <th>Exam Date</th>
                <th className="ts-col-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.length > 0 ? (
                currentRows.map((exam, index) => {
                  const patientId = exam.patientData?.patientid || "N/A";
                  const reportId = exam.reportId || "N/A";
                  const isGenerating = isGeneratingPDF(patientId, index);
                  const isViewing = Boolean(viewingReports[exam._id] || viewingReports[patientId]);
                  const avatarText = String(exam.patientData?.Name || patientId || "?").charAt(0).toUpperCase();

                  return (
                    <tr key={exam._id || `${patientId}-${index}`}>
                      <td><strong>{reportId}</strong></td>
                      <td>
                        <div className="ts-user-cell">
                          <div className="ts-avatar">{avatarText}</div>
                          <div><strong>{patientId}</strong></div>
                        </div>
                      </td>
                      <td>{exam.patientData?.Name || "N/A"}</td>
                      <td>{formatExamDate(exam.patientData?.examDate)}</td>
                      <td className="ts-col-center">
                        <div className="ts-actions">
                          <button
                            type="button"
                            onClick={() => handleShowReport(exam)}
                            disabled={isViewing}
                            className="ts-btn ts-btn-ghost"
                          >
                            <FontAwesomeIcon icon={faEye} className="mr-1" />
                            {isViewing ? "Opening..." : "View"}
                          </button>
                          <button
                            type="button"
                            onClick={() => generatePDF(exam, patientId, index)}
                            disabled={isGenerating}
                            className="ts-btn ts-btn-primary"
                          >
                            <FontAwesomeIcon icon={faDownload} className="mr-1" />
                            {isGenerating ? "Generating..." : "Download"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="ts-empty">
                    {examData.length === 0 ? "No exam data found" : "No reports match your search"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ts-toolbar ts-table-footer">
          <div className="ts-entries">
            <label htmlFor="emr-entries">
              Show
              <select
                id="emr-entries"
                className="ts-entries-select"
                value={rowsPerPage}
                onChange={handleEntriesChange}
              >
                {entriesOptions.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              entries
            </label>
            <span className="ts-muted ts-entries-range">
              {showingFrom}–{showingTo} of {filteredExamData.length}
            </span>
          </div>
          <div className="ts-actions">
            <button
              type="button"
              className="ts-btn ts-btn-ghost"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1 || totalPages === 0}
            >
              <FontAwesomeIcon icon={faChevronLeft} /> Previous
            </button>
            <span className="ts-panel-meta">Page {totalPages === 0 ? 0 : currentPage} of {totalPages}</span>
            <button
              type="button"
              className="ts-btn ts-btn-ghost"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || totalPages === 0}
            >
              Next <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default EMRReportpage;