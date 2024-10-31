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


// Function to submit the patient form data
export const PatientFormSubmit = async (values) => {
  try {
    const { data } = await client.post('/api/patients', { ...values });
    return data;
  } catch (error) {
    return catchError(error);
  }
};

// // New function to search for patient name and ID for appointment suggestions
// export const searchPatientByName = async (name) => {
//   try {
//     const { data } = await client.get(`/api/appointments/search`, {
//       params: { name },
//     });
//     return data; // This will return an array of patients with name and ID
//   } catch (error) {
//     return catchError(error);
//   }
// };

// Function to fetch all appointments
export const getAllAppointments = async () => {
  try {
    const { data } = await client.get('/api/appointments'); // Adjust the endpoint as necessary
    return data; // Return the fetched appointment data
  } catch (error) {
    return catchError(error); // Handle any errors
  }
};




export const getAllPatients = async () => {
  try {
    const { data } = await client.get('/api/patients'); // Adjust the endpoint as necessary
    return data; // Return the fetched appointment data
  } catch (error) {
    return catchError(error); // Handle any errors
  }
};



// utils/auth.js

export const saveUserInfo = async (user) => {
  try {
    console.log("Saving user info:", user); // Log the user data being sent
    const response = await client.post("/api/doctors", {
      email: user.email,
      name: user.name,
      userId: user.sub, // Assuming user.sub is the Auth0 user ID
    });
    console.log("Response from saveUserInfo:", response.data); // Log the response data
    return response.data; // Return the response data for further handling if needed
  } catch (error) {
    console.error("Error saving user info:", error);
    throw error; // Rethrow the error for handling in the calling function
  }
};


// Function to delete an appointment
export const deleteAppointment = async ({ patientId, appointmentDate }) => {
  try {
    // Format the date to match the expected API format (YYYY-MM-DDTHH:mm:ss.sssZ)
    const formattedDate = new Date(appointmentDate).toISOString(); // This will give you the required format

    // Sending the patient ID and formatted appointment date in the body of the DELETE request
    const response = await client.delete(`/api/appointments`, { 
      data: { 
        patientId, 
        appointmentDate: formattedDate // Use formatted date here
      } 
    }); 

    return response.data; // Return any relevant response data
  } catch (error) {
    console.error("Error deleting appointment:", error);
    // Return a standardized error response for handling in the calling component
    return { success: false, error: error.response ? error.response.data : "Unknown error occurred" };
  }
};
