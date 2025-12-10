import React, { useEffect, useState, useMemo } from "react";
import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import client from "../api/client";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faDownload, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { Line } from 'react-chartjs-2';
import Chart from "chart.js/auto";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Papa from 'papaparse';

const EMRReportpage = () => {
  const [examData, setExamData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [stimulusTemplates, setStimulusTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [generatingPDFs, setGeneratingPDFs] = useState({}); // Track generating state per row
  const rowsPerPage = 6;

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

  const generateChartData = (session, isEyeOnly = false) => {
    if (!session?.dataPoints || session.dataPoints.length === 0) {
      console.warn("No data points in session:", session);
      return null;
    }

    // Use the actual recorded data points
    const dataPoints = session.dataPoints
      .filter(dp => dp.relativeTime != null && (dp.eyeX != null || dp.eyeY != null))
      .sort((a, b) => a.relativeTime - b.relativeTime);

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
        // Stimulus X
        {
          label: "Stimulus Trajectory X",
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          fill: false,
          data: alignedStimulusData.x,
          pointRadius: 0,
          borderWidth: 1,
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
          data: alignedStimulusData.y,
          pointRadius: 0,
          borderWidth: 1,
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
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/Tele /gi, '')
      .replace(/O d/gi, 'OD')
      .replace(/O s/gi, 'OS')
      .replace(/R u q/gi, 'RUQ')
      .replace(/R l q/gi, 'RLQ')
      .replace(/L u q/gi, 'LUQ')
      .replace(/L l q/gi, 'LLQ');
  };

  // Helper function to create tables manually
  const createTable = (doc, headers, data, startY, margins, columnWidths) => {
    const pageWidth = doc.internal.pageSize.width;
    const leftMargin = margins.left;
    const rightMargin = margins.right;
    const tableWidth = pageWidth - leftMargin - rightMargin;
    
    const rowHeight = 8;
    const headerHeight = 10;
    let currentY = startY;

    // Draw table headers with background
    doc.setFillColor(44, 90, 160); // Primary blue
    doc.rect(leftMargin, currentY, tableWidth, headerHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    let xPosition = leftMargin;
    headers.forEach((header, index) => {
      const width = columnWidths[index] * tableWidth;
      doc.text(header, xPosition + 2, currentY + 6);
      xPosition += width;
    });

    currentY += headerHeight;

    // Draw table rows
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    data.forEach((row, rowIndex) => {
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(leftMargin, currentY, tableWidth, rowHeight, 'F');
      }

      xPosition = leftMargin;
      row.forEach((cell, cellIndex) => {
        const width = columnWidths[cellIndex] * tableWidth;
        
        // Draw cell border
        doc.setDrawColor(200, 200, 200);
        doc.rect(xPosition, currentY, width, rowHeight);
        
        // Add cell text
        const text = String(cell || 'N/A');
        const lines = doc.splitTextToSize(text, width - 4);
        doc.text(lines, xPosition + 2, currentY + 5);
        
        xPosition += width;
      });

      currentY += rowHeight;
    });

    return currentY;
  };

  // Improved chart generation with better quality
  const generateHighQualityChart = async (chartData, title, isEyeOnly, sessionCount, chartType) => {
    const container = document.createElement("div");
    container.style.width = "800px"; // Increased width for better quality
    container.style.height = "400px";
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "-9999px";
    container.style.background = "#ffffff";
    container.style.padding = "20px";
    container.style.border = "1px solid #ddd";
    document.body.appendChild(container);

    try {
      container.innerHTML = '<canvas id="highQualityChart"></canvas>';
      const canvas = container.querySelector('#highQualityChart');
      canvas.width = 800; // Higher resolution
      canvas.height = 400;
      canvas.style.width = "800px";
      canvas.style.height = "400px";

      const datasets = chartType === 'horizontal' 
        ? (isEyeOnly ? [chartData.datasets[0]] : [chartData.datasets[0], chartData.datasets[1]])
        : (isEyeOnly ? [chartData.datasets[1]] : [chartData.datasets[2], chartData.datasets[3]]);

      const chart = new Chart(canvas, {
        type: "line",
        data: {
          labels: chartData.labels,
          datasets: datasets
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: { duration: 0 },
          plugins: {
            legend: { 
              display: true, 
              position: 'top',
              labels: { 
                font: { 
                  size: 12, // Larger font for better readability
                  family: "'Helvetica', 'Arial', sans-serif"
                } 
              }
            },
            title: { 
              display: true, 
              text: title,
              font: { 
                size: 14,
                weight: 'bold',
                family: "'Helvetica', 'Arial', sans-serif"
              }
            },
          },
          scales: {
            x: { 
              type: 'linear',
              title: { 
                display: true, 
                text: 'Time (s)', 
                font: { 
                  size: 11,
                  family: "'Helvetica', 'Arial', sans-serif"
                } 
              },
              ticks: { 
                font: { 
                  size: 10,
                  family: "'Helvetica', 'Arial', sans-serif"
                } 
              }
            },
            y: { 
              min: chartType === 'horizontal' ? -70 : -40,
              max: chartType === 'horizontal' ? 70 : 40,
              title: { 
                display: true, 
                text: chartType === 'horizontal' ? 'Position X' : 'Position Y', 
                font: { 
                  size: 11,
                  family: "'Helvetica', 'Arial', sans-serif"
                } 
              },
              ticks: { 
                font: { 
                  size: 10,
                  family: "'Helvetica', 'Arial', sans-serif"
                } 
              }
            },
          },
          elements: {
            line: {
              borderWidth: 2, // Thicker lines for better visibility
            },
            point: {
              radius: 0, // No points for cleaner look
            }
          },
        },
      });

      // Wait for chart to render completely
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate high-quality image
      const chartImage = await html2canvas(container, {
        scale: 2, // Double the scale for high resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        height: 400,
        onclone: (clonedDoc) => {
          const clonedCanvas = clonedDoc.querySelector('#highQualityChart');
          if (clonedCanvas) {
            clonedCanvas.style.width = '800px';
            clonedCanvas.style.height = '400px';
          }
        }
      });

      chart.destroy();
      return chartImage;

    } finally {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };

  const generatePDF = async (patientData, patientId, rowIndex) => {
    // Create a unique key for this specific row
    const rowKey = `${patientId}-${rowIndex}`;
    
    // Set generating state for this specific row
    setGeneratingPDFs(prev => ({ ...prev, [rowKey]: true }));
    
    try {
      const doc = new jsPDF();
      const margin = 15;
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      let yPosition = 20;

      // Set professional colors
      const primaryColor = [44, 90, 160]; // Dark blue

      // Title Section with professional styling
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 50, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("OCULOMOTOR EXAMINATION REPORT", pageWidth / 2, 25, { align: "center" });
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Patient ID: ${patientId}`, pageWidth / 2, 35, { align: "center" });
      doc.text(`Report Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 42, { align: "center" });

      yPosition = 60;

      // Patient Information Section
      doc.setFontSize(16);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text("PATIENT INFORMATION", margin, yPosition);
      yPosition += 10;

      const patientInfoData = [
        ['Patient ID', patientData.patientData.patientid || 'N/A'],
        ['Name', patientData.patientData.Name || 'N/A'],
        ['Date of Birth', patientData.patientData.patientDOB ? new Date(patientData.patientData.patientDOB).toLocaleDateString() : 'N/A'],
        ['Sex', patientData.patientData.patientSex || 'N/A'],
        ['Exam Date', patientData.patientData.examDate ? new Date(patientData.patientData.examDate).toLocaleDateString() : 'N/A'],
        ['Doctor', patientData.patientData.Doctor || 'N/A'],
        ['Visual Activity OD', patientData.patientData.visualActivityOD || 'N/A'],
        ['Visual Activity OS', patientData.patientData.visualActivityOS || 'N/A'],
        ['Neurological Findings', patientData.patientData.neuroFindings || 'N/A'],
        ['Aphasia', patientData.patientData.hasAphasia || 'N/A'],
        ['Aphasia Description', patientData.patientData.aphasiaDescription || 'N/A']
      ];

      yPosition = createTable(
        doc,
        ['Field', 'Value'],
        patientInfoData,
        yPosition,
        { left: margin, right: margin },
        [0.3, 0.7]
      ) + 15;

      // Bedside Exam Section
      if (patientData.bedsideExamData) {
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text("BEDSIDE EXAMINATION", margin, yPosition);
        yPosition += 10;

        const bedsideData = Object.entries(patientData.bedsideExamData)
          .filter(([key, value]) => value && value !== 'N/A' && value !== '')
          .map(([key, value]) => [formatFieldName(key), value]);

        if (bedsideData.length > 0) {
          yPosition = createTable(
            doc,
            ['Examination Parameter', 'Findings'],
            bedsideData,
            yPosition,
            { left: margin, right: margin },
            [0.4, 0.6]
          ) + 15;
        }
      }

      // Telestroke Exam Section
      if (patientData.teleStrokeExamData) {
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(16);
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text("TELESTROKE EXAMINATION", margin, yPosition);
        yPosition += 10;

        const telestrokeData = Object.entries(patientData.teleStrokeExamData)
          .filter(([key, value]) => value && value !== 'N/A' && value !== '')
          .map(([key, value]) => [formatFieldName(key.replace('tele_', '')), value]);

        if (telestrokeData.length > 0) {
          yPosition = createTable(
            doc,
            ['Examination Parameter', 'Findings'],
            telestrokeData,
            yPosition,
            { left: margin, right: margin },
            [0.4, 0.6]
          ) + 15;
        }
      }

      // Tracking Sessions Section
      if (patientData.trackingSessions && patientData.trackingSessions.length > 0) {
        // Group sessions by stimulusType
        const sessionsByStimulusType = patientData.trackingSessions.reduce((acc, session, index) => {
          const key = session.stimulusType === "none" ? "Eye Only" : `Stimulus Type ${session.stimulusType || 'Unknown'}`;
          if (!acc[key]) {
            acc[key] = [];
          }
          acc[key].push({ ...session, originalIndex: index + 1 });
          return acc;
        }, {});

        let sessionCount = 0;

        try {
          for (const [groupName, sessions] of Object.entries(sessionsByStimulusType)) {
            if (yPosition > pageHeight - 100) {
              doc.addPage();
              yPosition = 20;
            }

            // Session Group Header
            doc.setFontSize(14);
            doc.setTextColor(...primaryColor);
            doc.setFont("helvetica", "bold");
            doc.text(`${groupName.toUpperCase()} SESSIONS`, margin, yPosition);
            yPosition += 8;

            for (const session of sessions) {
              sessionCount++;

              if (yPosition > pageHeight - 150) {
                doc.addPage();
                yPosition = 20;
              }

              // Session Metadata Table
              const sessionInfoData = [
                ['Session Number', `Session ${sessionCount} (Original: ${session.originalIndex})`],
                ['Start Time', session.sessionStart ? new Date(session.sessionStart).toLocaleString() : 'N/A'],
                ['End Time', session.sessionEnd ? new Date(session.sessionEnd).toLocaleString() : 'N/A'],
                ['Selected Eye', session.selectedEye || 'N/A'],
                ['Stimulus Type', session.stimulusType || 'N/A'],
                ['Stimulus Shape', session.stimulusShape || 'N/A'],
                ['Exam Mode', session.examMode || 'N/A'],
                ['Data Points', session.dataPoints ? session.dataPoints.length : 0]
              ];

              yPosition = createTable(
                doc,
                ['Parameter', 'Value'],
                sessionInfoData,
                yPosition,
                { left: margin, right: margin },
                [0.3, 0.7]
              ) + 10;

              const isEyeOnly = session.stimulusType === "none";
              const chartData = generateChartData(session, isEyeOnly);

              if (chartData) {
                // Generate high-quality X Chart
                const xChartImage = await generateHighQualityChart(
                  chartData, 
                  `Horizontal Eye Movement - Session ${sessionCount}`,
                  isEyeOnly,
                  sessionCount,
                  'horizontal'
                );

                if (yPosition > pageHeight - 160) {
                  doc.addPage();
                  yPosition = 20;
                }

                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(`Horizontal Movement Chart - Session ${sessionCount}`, margin, yPosition);
                yPosition += 6;
                
                // Add high-quality image with better dimensions
                const chartWidth = pageWidth - (2 * margin);
                const chartHeight = (chartWidth * 400) / 800; // Maintain aspect ratio
                doc.addImage(xChartImage, 'PNG', margin, yPosition, chartWidth, chartHeight);
                yPosition += chartHeight + 10;

                // Generate high-quality Y Chart
                const yChartImage = await generateHighQualityChart(
                  chartData, 
                  `Vertical Eye Movement - Session ${sessionCount}`,
                  isEyeOnly,
                  sessionCount,
                  'vertical'
                );

                if (yPosition > pageHeight - 160) {
                  doc.addPage();
                  yPosition = 20;
                }

                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(`Vertical Movement Chart - Session ${sessionCount}`, margin, yPosition);
                yPosition += 6;
                
                // Add high-quality image with better dimensions
                doc.addImage(yChartImage, 'PNG', margin, yPosition, chartWidth, chartHeight);
                yPosition += chartHeight + 10;
              } else {
                if (yPosition > pageHeight - 20) {
                  doc.addPage();
                  yPosition = 20;
                }
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text("No chart data available for this session", margin, yPosition);
                yPosition += 15;
              }

              yPosition += 10;
            }
          }
        } catch (error) {
          console.error("Error generating charts:", error);
        }
      } else {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("No tracking sessions available", margin, yPosition);
      }

      // Add page numbers
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, pageHeight - 10);
      }

      doc.save(`Patient_${patientId}_Report.pdf`);
      toast.success("PDF report generated successfully");
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF report");
    } finally {
      // Clear generating state for this specific row
      setGeneratingPDFs(prev => ({ ...prev, [rowKey]: false }));
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

    // Simple HTML report without complex chart scripting
    reportWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Patient Report - ${patientId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .section { 
              margin-bottom: 30px; 
            }
            .section-header { 
              font-size: 18px; 
              font-weight: bold; 
              color: #2c5aa0;
              margin-bottom: 10px;
              border-left: 4px solid #2c5aa0;
              padding-left: 10px;
            }
            .field { 
              margin-bottom: 8px; 
              padding: 5px;
            }
            .field-title { 
              font-weight: bold; 
              display: inline-block;
              width: 200px;
            }
            .no-data { 
              color: #666; 
              font-style: italic; 
            }
            .print-btn {
              background: #2c5aa0;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              margin: 20px 0;
            }
            .print-btn:hover {
              background: #1e3d6f;
            }
            @media print {
              .print-btn { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Medical Report - Patient ID: ${patientId}</h1>
            <p><strong>Doctor:</strong> ${patientData.patientData.Doctor || 'N/A'}</p>
            <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <div class="section-header">Patient Information</div>
            ${patientData.patientData.Name ? `<div class="field"><span class="field-title">Name:</span> ${patientData.patientData.Name}</div>` : ''}
            ${patientData.patientData.patientDOB ? `<div class="field"><span class="field-title">Date of Birth:</span> ${new Date(patientData.patientData.patientDOB).toLocaleDateString()}</div>` : ''}
            ${patientData.patientData.patientSex ? `<div class="field"><span class="field-title">Sex:</span> ${patientData.patientData.patientSex}</div>` : ''}
            ${patientData.patientData.examDate ? `<div class="field"><span class="field-title">Exam Date:</span> ${new Date(patientData.patientData.examDate).toLocaleDateString()}</div>` : ''}
            ${patientData.patientData.visualActivityOD ? `<div class="field"><span class="field-title">Visual Activity OD:</span> ${patientData.patientData.visualActivityOD}</div>` : ''}
            ${patientData.patientData.visualActivityOS ? `<div class="field"><span class="field-title">Visual Activity OS:</span> ${patientData.patientData.visualActivityOS}</div>` : ''}
            ${patientData.patientData.neuroFindings ? `<div class="field"><span class="field-title">Neurological Findings:</span> ${patientData.patientData.neuroFindings}</div>` : ''}
            ${patientData.patientData.hasAphasia ? `<div class="field"><span class="field-title">Aphasia:</span> ${patientData.patientData.hasAphasia}</div>` : ''}
            ${patientData.patientData.aphasiaDescription ? `<div class="field"><span class="field-title">Aphasia Description:</span> ${patientData.patientData.aphasiaDescription}</div>` : ''}
          </div>

          <div class="section">
            <div class="section-header">Bedside Examination</div>
            ${Object.entries(patientData.bedsideExamData || {}).map(([key, value]) => 
              value ? `<div class="field"><span class="field-title">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span> ${value}</div>` : ''
            ).join('')}
          </div>

          <div class="section">
            <div class="section-header">Telestroke Examination</div>
            ${Object.entries(patientData.teleStrokeExamData || {}).map(([key, value]) => 
              value ? `<div class="field"><span class="field-title">${key.replace('tele_', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span> ${value}</div>` : ''
            ).join('')}
          </div>

          <div class="section">
            <div class="section-header">Tracking Sessions</div>
            ${patientData.trackingSessions && patientData.trackingSessions.length > 0 ? 
              patientData.trackingSessions.map((session, index) => `
                <div style="margin-bottom: 20px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                  <h3>Session ${index + 1}</h3>
                  <div class="field"><span class="field-title">Start Time:</span> ${session.sessionStart ? new Date(session.sessionStart).toLocaleString() : 'N/A'}</div>
                  <div class="field"><span class="field-title">End Time:</span> ${session.sessionEnd ? new Date(session.sessionEnd).toLocaleString() : 'N/A'}</div>
                  <div class="field"><span class="field-title">Selected Eye:</span> ${session.selectedEye || 'N/A'}</div>
                  <div class="field"><span class="field-title">Stimulus Type:</span> ${session.stimulusType || 'N/A'}</div>
                  <div class="field"><span class="field-title">Stimulus Shape:</span> ${session.stimulusShape || 'N/A'}</div>
                  <div class="field"><span class="field-title">Exam Mode:</span> ${session.examMode || 'N/A'}</div>
                  <div class="field"><span class="field-title">Data Points:</span> ${session.dataPoints ? session.dataPoints.length : 0}</div>
                </div>
              `).join('') : 
              '<div class="no-data">No tracking sessions available</div>'
            }
          </div>

          <button class="print-btn" onclick="window.print()">Print Report</button>

          <script>
            window.onload = function() {
              // Focus and attempt to print
              setTimeout(() => {
                window.focus();
              }, 1000);
            };
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

  // Check if a specific row's PDF is being generated
  const isGeneratingPDF = (patientId, rowIndex) => {
    const rowKey = `${patientId}-${rowIndex}`;
    return generatingPDFs[rowKey] || false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="flex flex-col lg:flex-row pt-24">
          <Sidebar page="EMR" />
          <main className="flex-1 lg:ml-[250px] p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-lg text-gray-600">Loading exam data...</div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
                      currentRows.map((exam, index) => {
                        const patientId = exam.patientData.patientid;
                        const isGenerating = isGeneratingPDF(patientId, index);
                        
                        return (
                          <tr key={`${patientId}-${index}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {patientId}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {exam.patientData.Name || 'N/A'}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleShowReport(patientId)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                >
                                  <FontAwesomeIcon icon={faEye} className="mr-1" />
                                  View
                                </Button>
                                <Button
                                  onClick={() => generatePDF(exam, patientId, index)}
                                  disabled={isGenerating}
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FontAwesomeIcon icon={faDownload} className="mr-1" />
                                  {isGenerating ? 'Generating...' : 'Download'}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                          {examData.length === 0 ? 'No exam data found' : 'No reports match your search'}
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
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Previous</span>
                          <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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