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


// Function to fetch all appointments
export const getAllAppointments = async () => {
  try {
    const { data } = await client.get('/api/appointments'); // Adjust the endpoint as necessary
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

    return response.data; // Return the response data
  } catch (error) {
    console.error("Error submitting exam data:", error);
    if (error.response) {
      console.log("Backend response error:", error.response.data); // Log backend error response details
    }

    return catchError(error); // Handle and return a standardized error response
  }
};

