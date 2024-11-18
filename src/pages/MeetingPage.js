import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAllAppointments } from "../utils/auth"; // Assuming this fetches appointments
import { getToken, createMeeting } from "../API"; // API methods to get token and create meeting
import { AppointmentFormSubmit } from "../utils/auth"; // Method to save meeting info (in your DB)
import { CopyToClipboard } from "react-copy-to-clipboard"; // Import CopyToClipboard
import { FaCopy } from "react-icons/fa"; // Import Font Awesome copy icon

const MeetingPage = () => {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState("");
  const [patientID, setPatientID] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMeetingCreated, setIsMeetingCreated] = useState(false);  // New state to track meeting creation status
  const [copied, setCopied] = useState(false); // New state to track if the meeting ID has been copied

  useEffect(() => {
    // Automatically generate the patient ID when the page loads
    const generatePatientID = async () => {
      try {
        const appointments = await getAllAppointments();
        let maxID = 0;
        if (appointments && appointments.length > 0) {
          maxID = Math.max(...appointments.map((appt) => parseInt(appt.ID, 10)));
        }
        // Generate a new patient ID with leading zeros
        const newID = String(maxID + 1).padStart(5, "0");
        setPatientID(newID);
      } catch (error) {
        console.error("Error fetching appointments:", error);
        alert("Error generating Patient ID. Please try again.");
      }
    };

    generatePatientID();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get the token
      const generatedToken = await getToken();
      if (!generatedToken) {
        alert("Failed to generate token. Please try again.");
        setIsLoading(false);
        return;
      }
      setToken(generatedToken);

      // Create the meeting
      const generatedMeetingId = await createMeeting();
      if (!generatedMeetingId) {
        alert("Failed to create meeting. Please try again.");
        setIsLoading(false);
        return;
      }
      setMeetingId(generatedMeetingId);
      setIsMeetingCreated(true);  // Set this to true after the meeting is created

      // Save meeting details to the database
      const meetingDetails = {
        Name: patientName,
        ID: patientID,
        token: generatedToken,
        meetingId: generatedMeetingId,
      };
      const saveResponse = await AppointmentFormSubmit(meetingDetails);
      if (saveResponse) {
        alert("Meeting created successfully!");
      } else {
        alert("Failed to save meeting details.");
      }
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Error creating meeting. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMeeting = () => {
    if (meetingId) {
      navigate(`/emr/${patientID}/${meetingId}`);  // Navigate to the meeting
    }
  };

  const handleCopyClick = () => {
    setCopied(true); // Mark as copied
    setTimeout(() => setCopied(false), 1500); // Reset copied state after a brief period
  };

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-lg mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Create an Instant Meeting</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Patient Name</label>
          <input
            type="text"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            className="w-full p-2 border rounded"
            required
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
          <label className="block text-gray-700">Meeting ID</label>
          <div className="flex items-center">
            <input
              type="text"
              value={meetingId}
              readOnly
              className="w-full p-2 border rounded"
            />
            {/* Copy button with icon visible once meeting is created */}
            {isMeetingCreated && (
              <CopyToClipboard text={meetingId}>
                <button
                  type="button"
                  onClick={handleCopyClick} // Trigger copy click
                  className={`ml-2 ${copied ? "text-blue-600" : "text-gray-400"} hover:text-blue-600 focus:outline-none`}
                  style={{ border: "none", background: "none" }} // Remove border
                >
                  <FaCopy size={20} /> {/* Copy Icon */}
                </button>
              </CopyToClipboard>
            )}
          </div>
        </div>
        <div className="flex justify-between">
          {/* Show "Create Meeting" button initially, change to "Start Meeting" once created */}
          {!isMeetingCreated ? (
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
