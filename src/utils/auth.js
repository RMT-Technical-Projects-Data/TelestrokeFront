import client from "../api/client";

const catchError = (error) => {
  return error?.response?.data || { success: false, error: error.message };
};

export const AppointmentFormSubmit = async (values) => {
  try {
    const { data } = await client.post('/api/appointments', { ...values });
    return data;
  } catch (error) {
    return catchError(error);
  }
};
export const PatientFormSubmit = async (values) => {
  try {
    const { data } = await client.post('/api/patients', { ...values });
    return data;
  } catch (error) {
    return catchError(error);
  }
};