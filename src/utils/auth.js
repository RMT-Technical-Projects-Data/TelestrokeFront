import client from "../api/client";

const catchError = (error) => {
  return error?.response?.data || { success: false, error: error.message };
};

// Function to submit the appointment form data
export const AppointmentFormSubmit = async (values) => {
  try {
    const { data } = await client.post('/api/appointments', { ...values });
    return data;
  } catch (error) {
    return catchError(error);
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
