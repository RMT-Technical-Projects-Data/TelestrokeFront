import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getAllAppointments } from "../utils/auth";
import { getToken, createMeeting } from "../API";
import { AppointmentFormSubmit } from "../utils/auth";
import { Copy, Phone, Video, Calendar, FileText } from "lucide-react";
import AppShell from "../components/AppShell";
import { buildAppointmentInsights } from "../utils/overviewInsights";

const MeetingPage = () => {
  const navigate = useNavigate();
  const [DeviceID] = useState("1000");
  const [patientID, setPatientID] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMeetingCreated, setIsMeetingCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [doctor, setDoctor] = useState("");
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const storedDoctor = localStorage.getItem("Doctor") || "Unknown Doctor";
    setDoctor(storedDoctor);
  }, []);

  useEffect(() => {
    ["patientEMR", "emrBedSideData", "emrTelestrokeExam", "patientName"].forEach((key) =>
      localStorage.removeItem(key)
    );
  }, []);

  useEffect(() => {
    const generatePatientID = async () => {
      try {
        const result = await getAllAppointments(doctor);
        let list = [];
        if (Array.isArray(result)) list = result;
        else if (result && Array.isArray(result.data)) list = result.data;
        else if (result && Array.isArray(result.appointments)) list = result.appointments;
        setAppointments(list);

        let maxID = 0;
        if (list.length > 0) {
          maxID = Math.max(...list.map((appt) => parseInt(appt.ID, 10) || 0));
        }
        setPatientID(String(maxID + 1).padStart(5, "0"));
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast.error("Error generating Patient ID. Please try again.");
      }
    };

    if (doctor) generatePatientID();
  }, [doctor]);

  const insights = useMemo(() => buildAppointmentInsights(appointments), [appointments]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!DeviceID) {
      toast.warn("Please select a Device ID.");
      return;
    }

    setIsLoading(true);

    try {
      const generatedToken = await getToken();
      if (!generatedToken) {
        toast.error("Failed to generate token. Please try again.");
        setIsLoading(false);
        return;
      }
      setToken(generatedToken);

      const generatedMeetingId = await createMeeting();
      if (!generatedMeetingId) {
        toast.error("Failed to create meeting. Please try again.");
        setIsLoading(false);
        return;
      }
      setMeetingId(generatedMeetingId);
      setIsMeetingCreated(true);

      const currentDateTime = new Date();
      const appointmentDate = currentDateTime.toISOString().split("T")[0];
      const appointmentTime = currentDateTime.toTimeString().split(" ")[0].slice(0, 5);

      const meetingDetails = {
        DeviceID,
        ID: patientID,
        token: generatedToken,
        meetingId: generatedMeetingId,
        Doctor: doctor,
        AppointmentDate: appointmentDate,
        AppointmentTime: appointmentTime,
        Checkup_Status: "Pending",
      };

      const saveResponse = await AppointmentFormSubmit(meetingDetails);
      if (saveResponse) toast.success("Meeting created successfully!");
      else toast.error("Failed to save meeting details.");
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Error creating meeting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMeeting = () => {
    if (meetingId) navigate(`/emr/${patientID}/${meetingId}`);
  };

  const handleCopyClick = async () => {
    const value = meetingId || patientID;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.info("Copied to clipboard.");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy.");
    }
  };

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isMeetingCreated) {
        event.preventDefault();
        event.returnValue = "You have an unsaved meeting. Are you sure you want to leave?";
        return event.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isMeetingCreated]);

  return (
    <AppShell
      page="PATIENTS"
      title="Instant meeting"
      subtitle="Create a live session and join the exam immediately."
    >
      <div className="ts-meeting-layout">
        <form onSubmit={handleSubmit} className="ts-modal ts-modal-wide ts-meeting-card">
          <div className="ts-modal-head">
            <div>
              <h2>Create meeting</h2>
              <p className="ts-muted" style={{ margin: "0.25rem 0 0" }}>
                Session details are filled in automatically.
              </p>
            </div>
            <span className={`ts-badge ${isMeetingCreated ? "ts-badge-ok" : "ts-badge-accent"}`}>
              {isMeetingCreated ? "Ready" : "Pending"}
            </span>
          </div>

          <div className="ts-modal-body">
            <div className="ts-form-grid">
              <div className="ts-field">
                <label htmlFor="meeting-device">Device ID</label>
                <input id="meeting-device" type="text" value={DeviceID} readOnly className="ts-input" />
              </div>
              <div className="ts-field">
                <label htmlFor="meeting-id">Meeting ID</label>
                <input id="meeting-id" type="text" value={patientID} readOnly className="ts-input" />
              </div>
              <div className="ts-field">
                <label htmlFor="meeting-doctor">Doctor</label>
                <input id="meeting-doctor" type="text" value={doctor} readOnly className="ts-input" />
              </div>
              <div className="ts-field">
                <label htmlFor="meeting-status">Checkup status</label>
                <input
                  id="meeting-status"
                  type="text"
                  value={isMeetingCreated ? "Ready to join" : "Pending"}
                  readOnly
                  className="ts-input"
                />
              </div>
            </div>

            {isMeetingCreated && meetingId ? (
              <div className="ts-meeting-result">
                <div>
                  <span className="ts-meeting-result-label">Live meeting ID</span>
                  <strong>{meetingId}</strong>
                </div>
                <button type="button" className="ts-btn ts-btn-ghost" onClick={handleCopyClick}>
                  <Copy size={14} /> {copied ? "Copied" : "Copy"}
                </button>
              </div>
            ) : null}
          </div>

          <div className="ts-modal-footer">
            <button type="button" className="ts-btn ts-btn-ghost" onClick={() => navigate("/dashboard")}>
              Cancel
            </button>
            {!isMeetingCreated ? (
              <button type="submit" className="ts-btn ts-btn-primary" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Meeting"}
              </button>
            ) : (
              <button type="button" className="ts-btn ts-btn-primary" onClick={handleStartMeeting}>
                <Phone size={15} /> Start Meeting
              </button>
            )}
          </div>
        </form>

        <div className="ts-stack">
          <div className="ts-panel">
            <div className="ts-panel-head">
              <h3 className="ts-panel-title">How it works</h3>
              <span className="ts-panel-meta">3 steps</span>
            </div>
            <div className="ts-meeting-steps">
              <div className="ts-meeting-step">
                <span className="ts-meeting-step-num">1</span>
                <div>
                  <strong>Create the session</strong>
                  <p>Device, meeting ID, and doctor are assigned automatically.</p>
                </div>
              </div>
              <div className="ts-meeting-step">
                <span className="ts-meeting-step-num">2</span>
                <div>
                  <strong>Start the exam</strong>
                  <p>Join the live meeting and complete the bedside / telestroke exam.</p>
                </div>
              </div>
              <div className="ts-meeting-step">
                <span className="ts-meeting-step-num">3</span>
                <div>
                  <strong>Save to EMR</strong>
                  <p>Findings are stored so the report is available after the call.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="ts-panel">
            <div className="ts-panel-head">
              <h3 className="ts-panel-title">Today’s sessions</h3>
              <span className="ts-panel-meta">{insights.todayCount}</span>
            </div>
            {insights.today.length > 0 ? (
              <div className="ts-table-wrap">
                <table className="ts-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insights.today.slice(0, 6).map((a) => (
                      <tr key={`meet-today-${a.ID || a._id}`}>
                        <td><strong>{String(a.ID ?? "—").padStart(5, "0")}</strong></td>
                        <td>{a.AppointmentTime || "—"}</td>
                        <td className="ts-muted">{a.Checkup_Status || "Pending"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ts-empty-state" style={{ minHeight: 120 }}>
                <div className="ts-empty-icon"><Video size={18} /></div>
                <strong>No live sessions today</strong>
                <p>Create a meeting on the left to start an exam immediately.</p>
              </div>
            )}
          </div>

          <div className="ts-panel">
            <div className="ts-panel-head">
              <h3 className="ts-panel-title">Quick links</h3>
            </div>
            <div className="ts-meeting-steps">
              <Link to="/appointment" className="ts-btn ts-btn-ghost" style={{ justifyContent: "flex-start" }}>
                <Calendar size={15} /> Schedule appointment
              </Link>
              <Link to="/emr" className="ts-btn ts-btn-ghost" style={{ justifyContent: "flex-start" }}>
                <FileText size={15} /> EMR reports
              </Link>
              <Link to="/dashboard" className="ts-btn ts-btn-ghost" style={{ justifyContent: "flex-start" }}>
                <Video size={15} /> Back to overview
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

export default MeetingPage;
