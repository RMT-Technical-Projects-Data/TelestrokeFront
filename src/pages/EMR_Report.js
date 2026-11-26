import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AppShell from "../components/AppShell";
import { Search } from "lucide-react";
import client from "../api/client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faDownload, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import Chart from "chart.js/auto";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const downsamplePoints = (points, maxPoints) => {
  if (!maxPoints || points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  return points.filter((_, index) => index % step === 0 || index === points.length - 1);
};

const EMRReportpage = () => {
  const [examData, setExamData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generatingPDFs, setGeneratingPDFs] = useState({}); // Track generating state per row
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

    fetchExamData();
  }, []);

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

    console.log(`Generating chart data for session ${session.stimulusType}, points: ${dataPoints.length}`);

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
                          {exam._id ? (
                            <Link
                              to={`/emr-report/${exam._id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ts-btn ts-btn-ghost"
                            >
                              <FontAwesomeIcon icon={faEye} className="mr-1" />
                              View
                            </Link>
                          ) : (
                            <button type="button" className="ts-btn ts-btn-ghost" disabled>
                              <FontAwesomeIcon icon={faEye} className="mr-1" />
                              View
                            </button>
                          )}
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