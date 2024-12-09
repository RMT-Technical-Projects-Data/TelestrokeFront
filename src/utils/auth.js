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
    const { patientData, bedsideExamData, teleStrokeExamData } = examData;

    // Construct the payload
    const payload = {
      patientData,
      bedsideExamData,
      teleStrokeExamData,
    };

    // Send the data to the backend
    const response = await client.post("/api/examdatas", payload); // Adjust the endpoint as necessary

    // Check if the response status is 201 (Created) and contains success information
    if (response.status === 201 && response.data) {
      return response.data; // Return the response data if successful
    } else {
      // Handle any unexpected response format or status
      throw new Error("Unexpected response format or error from backend");
    }
  } catch (error) {
    console.error("Error submitting exam data:", error);

    // Handle specific error response from the backend
    if (error.response) {
      // If the error is from the backend (e.g., validation failure or missing fields)
      console.log("Backend response error:", error.response.data); // Log backend error response details

      // Return the backend error details for further handling
      if (error.response.status === 400) {
        // Handle bad request error (e.g., validation errors like missing sections)
        return {
          error: error.response.data.error || "There was an issue with the data. Please check and try again."
        };
      }
      
      // General backend error handling for other statuses
      return {
        error: error.response.data.error || "An error occurred while saving the data. Please try again."
      };
    } else {
      // If the error is not related to the response (e.g., network issues)
      return {
        error: "An unexpected error occurred. Please check your network and try again."
      };
    }
  }
};
