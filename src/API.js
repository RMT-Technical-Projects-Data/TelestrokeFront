// Initialize authToken as null (will be lazy-loaded)
let authToken = null;

// Function to fetch the auth token from the backend
export const getToken = async () => {
  try {
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/get-token`, {
      method: "GET",
    });
    const { token } = await res.json();
    console.log("Token received:", token);
    return token;
  } catch (error) {
    console.error("Error fetching token:", error);
    return null;
  }
};

// Function to ensure the token is loaded only when needed
export const getAuthToken = async () => {
  if (!authToken) {
    console.log("Fetching token...");
    authToken = await getToken();
  }
  return authToken;
};

// API call to create a meeting
export const createMeeting = async (region = "us") => {
  try {
    const token = await getAuthToken(); // Ensure token is loaded before the call
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/create-meeting/`, {
      method: "POST",
      headers: {
        Authorization: token, // Use the fetched token
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token, region }),
    });

    const result = await res.json();
    const { meetingId } = result;
    console.log("Meeting created with ID:", meetingId);
    return meetingId;
  } catch (error) {
    console.error("Error creating meeting:", error);
    return null;
  }
};

// API call to validate a meeting
export const validateMeeting = async (meetingId) => {
  try {
    const token = await getAuthToken(); // Ensure token is loaded before the call
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/validate-meeting/${meetingId}`, {
      method: "POST",
      headers: {
        Authorization: token, // Use the fetched token
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }), // Pass the token
    });

    const result = await res.json();
    console.log("Meeting validation result:", result);
    return result;
  } catch (error) {
    console.error("Error validating meeting:", error);
    return null;
  }
};
