import client from "../api/client";

const catchError = (error) => {
  return error?.response?.data || { success: false, error: error.message };
};

// Function to submit the appointment form data

export const AppointmentFormSubmit = async (appointmentData) => {
  try {
    const response = await client.post("/api/appointments", appointmentData);
    return response.data; // Return the response data
  } catch (error) {
    console.error("Error saving appointment:", error);
    throw error; // Rethrow the error for handling in the calling function
  }
};


// Function to fetch all appointments with optional doctor name
export const getAllAppointments = async (Doctor = '') => {
  try {
    // If a doctor name is provided, include it as a query parameter
    const url = Doctor ? `/api/appointments?Doctor=${Doctor}` : '/api/appointments';
    
    // Make the GET request to the backend
    const { data } = await client.get(url); // Adjust the endpoint as necessary
    return data; // Return the fetched appointment data
  } catch (error) {
    return catchError(error); // Handle any errors
  }
};



export const deleteAppointment = async ({ patientId }) => {
  try {
    // Sending the patientId in the body of the DELETE request
    const response = await client.delete("/api/appointments", { 
      data: { patientId } 
    });

    return response.data; // Return the relevant response data
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return { success: false, error: error.response ? error.response.data : "Unknown error occurred" };
  }
};


// Function to update an existing appointment
export const UpdateAppointment = async ({ _id, appointmentDate, appointmentTime }) => {
  try {
    const response = await client.put(`/api/appointments/${_id}`, {
      AppointmentDate: appointmentDate,
      AppointmentTime: appointmentTime,
      
    });
    return { success: true, data: response.data }; // Return the updated appointment data
  } catch (error) {
    console.error("Error updating appointment:", error);
    return { success: false, error: error.message }; // Adjusted to handle errors
  }
};


// Function to submit exam data
export const submitExamData = async (examData) => {
  try {
    // Ensure the data is sent as three separate objects
    const { patientData, bedsideExamData, teleStrokeExamData, trackingSessions } = examData;

    // Construct the payload
    const payload = {
      patientData,
      bedsideExamData,
      teleStrokeExamData,
      trackingSessions
    };

    // Send the data to the backend using fetch
    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/examdatas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Parse the response
    const result = await response.json();

    // Check if the response status is 201 (Created) and contains success information
    if (response.status === 201 && result) {
      return result; // Return the response data if successful
    } else {
      throw new Error(result.error || "Unexpected response format or error from backend");
    }
  } catch (error) {
    console.error("Error submitting exam data:", error);

    // Handle specific error response from the backend
    if (error.message.includes("Unexpected response")) {
      return {
        error: "Unexpected response format or error from backend",
      };
    }

    // Check if the error is from a failed response
    if (error.message.includes("Failed to fetch")) {
      return {
        error: "An unexpected error occurred. Please check your network and try again.",
      };
    }

    // General error handling
    return {
      error: error.message || "An error occurred while saving the data. Please try again.",
    };
  }
};

// Function to submit a tracking session incrementally
export const submitTrackingSession = async (examId, session) => {
  try {
    const payload = { session };

    const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/examdatas/${examId}/add-session`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.status === 200 && result) {
      return result;
    } else {
      throw new Error(result.error || "Unexpected response format or error from backend");
    }
  } catch (error) {
    console.error("Error submitting tracking session:", error);

    if (error.message.includes("Unexpected response")) {
      return {
        error: "Unexpected response format or error from backend",
      };
    }

    if (error.message.includes("Failed to fetch")) {
      return {
        error: "An unexpected error occurred. Please check your network and try again.",
      };
    }

    return {
      error: error.message || "An error occurred while saving the session.",
    };
  }
};