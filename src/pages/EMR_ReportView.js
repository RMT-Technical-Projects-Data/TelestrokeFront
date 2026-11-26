import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import client from "../api/client";

const formatDate = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "N/A" : date.toLocaleString();
};

const formatFieldName = (fieldName) =>
  String(fieldName || "")
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

const isDisplayable = (key, value) => {
  if (key === "_id" || key === "__v" || key === "id") return false;
  if (value === null || value === undefined || typeof value === "object") return false;
  const text = String(value).trim();
  return text !== "" && text !== "N/A";
};

const toRows = (obj, transformKey) =>
  Object.entries(obj || {})
    .filter(([key, value]) => isDisplayable(key, value))
    .map(([key, value]) => [
      formatFieldName(transformKey ? transformKey(key) : key),
      String(value),
    ]);

const downsample = (points, maxPoints = 400) => {
  if (!maxPoints || points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  return points.filter((_, index) => index % step === 0 || index === points.length - 1);
};

const buildSessionChart = (session) => {
  const points = downsample(
    (session?.dataPoints || [])
      .filter((dp) => dp.relativeTime != null && (dp.eyeX != null || dp.eyeY != null))
      .sort((a, b) => a.relativeTime - b.relativeTime)
  );
  if (!points.length) return null;

  const labels = points.map((dp) => dp.relativeTime);
  const isEyeOnly = session.stimulusType === "none";

  return {
    labels,
    horizontal: {
      labels,
      datasets: [
        {
          label: "Eye Angle X",
          data: points.map((dp) => dp.eyeX),
          borderColor: "#1e40af",
          backgroundColor: "#1e40af",
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1,
        },
        ...(!isEyeOnly
          ? [
              {
                label: "Stimulus X",
                data: points.map((dp) => dp.stimX),
                borderColor: "#10b981",
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                pointRadius: 0,
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.2,
              },
            ]
          : []),
      ],
    },
    vertical: {
      labels,
      datasets: [
        {
          label: "Eye Angle Y",
          data: points.map((dp) => dp.eyeY),
          borderColor: "#9d174d",
          backgroundColor: "#9d174d",
          pointRadius: 0,
          borderWidth: 2,
          tension: 0.1,
        },
        ...(!isEyeOnly
          ? [
              {
                label: "Stimulus Y",
                data: points.map((dp) => dp.stimY),
                borderColor: "#f97316",
                backgroundColor: "rgba(249, 115, 22, 0.1)",
                pointRadius: 0,
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.2,
              },
            ]
          : []),
      ],
    },
  };
};

const chartOptions = (title, yLabel) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: { display: true, position: "top" },
    title: { display: true, text: title, font: { size: 13, weight: "bold" } },
  },
  scales: {
    x: {
      type: "linear",
      title: { display: true, text: "Time (seconds)" },
    },
    y: {
      title: { display: true, text: yLabel },
    },
  },
});

const FieldGrid = ({ rows }) => (
  <div className="ts-report-grid">
    {rows.map(([label, value]) => (
      <div key={label} className="ts-report-field">
        <span className="ts-report-field-label">{label}</span>
        <strong className="ts-report-field-value">{value}</strong>
      </div>
    ))}
  </div>
);

const EMRReportView = () => {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id) {
        setError("Report id is missing.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await client.get(`/api/examdatas/${id}`);
        if (!active) return;
        setExam(response.data);
        setError("");
      } catch (err) {
        console.error("Failed to load report:", err);
        if (active) setError("Failed to load report.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const patient = exam?.patientData || {};
  const bedsideRows = useMemo(() => toRows(exam?.bedsideExamData), [exam]);
  const telestrokeRows = useMemo(
    () => toRows(exam?.teleStrokeExamData, (key) => String(key).replace(/^tele_/i, "")),
    [exam]
  );
  const sessionCharts = useMemo(
    () => (exam?.trackingSessions || []).map((session) => buildSessionChart(session)),
    [exam]
  );

  return (
    <div className="ts-report-page">
      <div className="ts-report-toolbar no-print">
        <Link to="/emr" className="ts-btn ts-btn-ghost">
          <ArrowLeft size={15} /> Back to reports
        </Link>
        <button type="button" className="ts-btn ts-btn-primary" onClick={() => window.print()}>
          <Printer size={15} /> Print
        </button>
      </div>

      <div className="ts-report-sheet">
        {loading ? (
          <div className="ts-loading" style={{ padding: "3rem 1rem" }}>
            <span className="ts-spinner" /> Loading report...
          </div>
        ) : error ? (
          <div className="ts-empty">{error}</div>
        ) : (
          <>
            <header className="ts-report-header">
              <div>
                <p className="ts-report-kicker">Oculomotor Examination Report</p>
                <h1>{patient.Name || "Examination Report"}</h1>
                <p className="ts-muted" style={{ margin: "0.35rem 0 0" }}>
                  Report ID: <strong>{exam.reportId || "N/A"}</strong>
                  {" · "}
                  Meeting ID: <strong>{patient.patientid || "N/A"}</strong>
                </p>
              </div>
              <div className="ts-report-meta">
                <div>Doctor: <strong>{patient.Doctor || "N/A"}</strong></div>
                <div>Exam Date: <strong>{formatDate(patient.examDate)}</strong></div>
                <div>Opened: <strong>{new Date().toLocaleString()}</strong></div>
              </div>
            </header>

            <section className="ts-report-section">
              <h2>Patient Information</h2>
              <FieldGrid
                rows={[
                  ["Meeting ID", patient.patientid || "N/A"],
                  ["Name", patient.Name || "N/A"],
                  ["Date of Birth", formatDate(patient.patientDOB)],
                  ["Sex", patient.patientSex || "N/A"],
                  ["Exam Date", formatDate(patient.examDate)],
                  ["Doctor", patient.Doctor || "N/A"],
                  ["Visual Activity OD", patient.visualActivityOD || "N/A"],
                  ["Visual Activity OS", patient.visualActivityOS || "N/A"],
                  ["Neurological Findings", patient.neuroFindings || "N/A"],
                  ["Aphasia", patient.hasAphasia || "N/A"],
                  ["Aphasia Description", patient.aphasiaDescription || "N/A"],
                ]}
              />
            </section>

            {bedsideRows.length > 0 ? (
              <section className="ts-report-section">
                <h2>Bedside Examination</h2>
                <div className="ts-table-wrap">
                  <table className="ts-table">
                    <thead>
                      <tr>
                        <th>Examination Parameter</th>
                        <th>Findings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bedsideRows.map(([label, value]) => (
                        <tr key={label}>
                          <td><strong>{label}</strong></td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {telestrokeRows.length > 0 ? (
              <section className="ts-report-section">
                <h2>Telestroke Examination</h2>
                <div className="ts-table-wrap">
                  <table className="ts-table">
                    <thead>
                      <tr>
                        <th>Examination Parameter</th>
                        <th>Findings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {telestrokeRows.map(([label, value]) => (
                        <tr key={label}>
                          <td><strong>{label}</strong></td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            <section className="ts-report-section">
              <h2>Tracking Sessions</h2>
              {(exam.trackingSessions || []).length === 0 ? (
                <p className="ts-muted">No tracking sessions recorded.</p>
              ) : (
                (exam.trackingSessions || []).map((session, index) => {
                  const charts = sessionCharts[index];
                  return (
                    <div key={session._id || index} className="ts-report-session">
                      <div className="ts-report-session-head">
                        <strong>Session #{index + 1}</strong>
                        <span className="ts-muted">
                          {session.stimulusType === "none"
                            ? "Eye Only"
                            : `Stimulus ${session.stimulusType || "N/A"}`}
                        </span>
                      </div>
                      <FieldGrid
                        rows={[
                          ["Start", formatDateTime(session.sessionStart)],
                          ["End", formatDateTime(session.sessionEnd)],
                          ["Selected Eye", session.selectedEye || "N/A"],
                          ["Stimulus Shape", session.stimulusShape || "N/A"],
                          ["Exam Mode", session.examMode || "N/A"],
                          ["Data Points", String(session.dataPoints?.length || 0)],
                        ]}
                      />
                      {charts ? (
                        <div className="ts-report-charts">
                          <div className="ts-report-chart">
                            <Line
                              data={charts.horizontal}
                              options={chartOptions(
                                `Horizontal Movement - Session ${index + 1}`,
                                "Horizontal Position"
                              )}
                            />
                          </div>
                          <div className="ts-report-chart">
                            <Line
                              data={charts.vertical}
                              options={chartOptions(
                                `Vertical Movement - Session ${index + 1}`,
                                "Vertical Position"
                              )}
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="ts-muted">No chart data for this session.</p>
                      )}
                    </div>
                  );
                })
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default EMRReportView;
