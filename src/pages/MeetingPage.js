import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import CSS for Toastify
import { getAllAppointments } from "../utils/auth";
import { getToken, createMeeting } from "../API";
import { AppointmentFormSubmit } from "../utils/auth";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { FaCopy } from "react-icons/fa";

const MeetingPage = () => {
  const navigate = useNavigate();
  const [DeviceID, setDeviceID] = useState("");
  const [patientID, setPatientID] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMeetingCreated, setIsMeetingCreated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [doctor, setDoctor] = useState(""); // State to hold Doctor value

  // Fetch Doctor from localStorage on component mount
  useEffect(() => {
    const storedDoctor = localStorage.getItem("Doctor") || "Unknown Doctor";
    setDoctor(storedDoctor);
  }, []);

  // Clear specific localStorage keys on component mount
  useEffect(() => {
    ["patientEMR", "emrBedSideData", "emrTelestrokeExam", "patientName"].forEach((key) =>
      localStorage.removeItem(key)
    );
  }, []);

// In MeetingPage component
useEffect(() => {
  const generatePatientID = async () => {
    try {
      const appointments = await getAllAppointments(doctor); // Pass the doctor reference
      let maxID = 0;
      if (appointments && appointments.length > 0) {
        maxID = Math.max(...appointments.map((appt) => parseInt(appt.ID, 10)));
      }
      const newID = String(maxID + 1).padStart(5, "0");
      setPatientID(newID);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Error generating Patient ID. Please try again.");
    }
  };

  if (doctor) {
    generatePatientID();
  }
}, [doctor]); // Add doctor as a dependency

// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
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

    // Get current date and time
    const currentDateTime = new Date();
    const appointmentDate = currentDateTime.toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const appointmentTime = currentDateTime.toTimeString().split(" ")[0].slice(0, 5); // Format: HH:MM (removes seconds)

    // Include Doctor and date/time in the meeting details
    const meetingDetails = {
      DeviceID: DeviceID,
      ID: patientID,
      token: generatedToken,
      meetingId: generatedMeetingId,
      Doctor: doctor,
      AppointmentDate: appointmentDate, // Add current date
      AppointmentTime: appointmentTime, // Add current time in HH:MM format
      Checkup_Status: "Pending"
    };

    const saveResponse = await AppointmentFormSubmit(meetingDetails);
    if (saveResponse) {
      toast.success("Meeting created successfully!");
    } else {
      toast.error("Failed to save meeting details.");
    }
  } catch (error) {
    console.error("Error creating meeting:", error);
    toast.error("Error creating meeting. Please try again.");
  } finally {
    setIsLoading(false);
  }
};


  const handleStartMeeting = () => {
    if (meetingId) {
      navigate(`/emr/${patientID}/${meetingId}`);
    }
  };

  const handleCopyClick = () => {
    setCopied(true);
    toast.info("Meeting ID copied to clipboard!");
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-lg mx-auto mt-8">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <h2 className="text-2xl font-bold mb-4">Create an Instant Meeting</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">
            Device ID <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={DeviceID}
            onChange={(e) => setDeviceID(e.target.value)}
            className="w-full p-2 border rounded"
            required
            minLength={4}
            maxLength={4} // Limit to 25 characters
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Patient ID</label>
          <input
            type="text"
            value={patientID}
            readOnly
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Doctor</label>
          <input
            type="text"
            value={doctor}
            readOnly
            className="w-full p-2 border rounded bg-gray-100 text-gray-700"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Meeting ID</label>
          <div className="flex items-center">
            <input
              type="text"
              value={meetingId}
              readOnly
              className="w-full p-2 border rounded"
            />
            {isMeetingCreated && (
              <CopyToClipboard text={meetingId}>
                <button
                  type="button"
                  onClick={handleCopyClick}
                  className={`ml-2 ${copied ? "text-bg-[#3b4fdf]" : "text-gray-400"} hover:bg-[#2f44c4] focus:outline-none`}
                  style={{ border: "none", background: "none" }}
                >
                  <FaCopy size={20} />
                </button>
              </CopyToClipboard>
            )}
          </div>
        </div>
        <div className="flex justify-between">
          {!isMeetingCreated ? (
            <button
              type="submit"
              className="bg-[#3b4fdf] text-white px-4 py-2 rounded hover:bg-[#2f44c4]"
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create Meeting"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStartMeeting}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Start Meeting
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate("/Dashboard")}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeetingPage;
