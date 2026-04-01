import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import CSS for Toastify
import { getAllAppointments } from "../utils/auth";
import { getToken, createMeeting } from "../API";
import { AppointmentFormSubmit } from "../utils/auth";
import { FaPhoneAlt } from "react-icons/fa";

import NavBar from "../components/NavBar";
import Sidebar from "../components/Sidebar";

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

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isMeetingCreated) {
        event.preventDefault();
        event.returnValue = "You have an unsaved meeting. Are you sure you want to leave?";
        return event.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isMeetingCreated]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <NavBar />
      <div className="flex flex-col sm:flex-row h-screen">
        <Sidebar page="PATIENTS" />
        <main className="flex-1 sm:ml-[250px] bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6 lg:p-10 pt-20">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-blue-600 text-white p-6">
              <h1 className="text-2xl font-bold font-sans">Create an Instant Meeting</h1>
              <p className="text-blue-100 mt-1">Please fill out the details below to start a meeting immediately.</p>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Device ID <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={DeviceID}
                      onChange={(e) => setDeviceID(e.target.value)}
                      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${isMeetingCreated ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""}`}
                      required
                      disabled={isMeetingCreated}
                    >
                      <option value="">Select Device ID</option>
                      <option value="1000">1000</option>
                      <option value="1001">1001</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Meeting ID
                    </label>
                    <input
                      type="text"
                      value={patientID}
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Doctor
                    </label>
                    <input
                      type="text"
                      value={doctor}
                      readOnly
                      className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-2">
                      Checkup Status
                    </label>
                    <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 flex items-center h-[50px]">
                      <span className="text-gray-700">Pending</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons Section */}
              <div className="bg-white -mx-6 -mb-6 px-6 py-4 flex flex-col sm:flex-row justify-end gap-3 mt-6">
                {!isMeetingCreated ? (
                  <button
                    type="submit"
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${isLoading ? 'bg-blue-400 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating..." : "Create Meeting"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartMeeting}
                    className="flex items-center bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition duration-200"
                  >
                    <FaPhoneAlt className="mr-2" /> Start Meeting
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigate("/Dashboard")}
                  className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
};

export default MeetingPage;
