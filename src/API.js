// Function to fetch the auth token from the backend
export const getToken = async () => {
  try {
    const res = await fetch(`http://localhost:5000/get-token`, {
      method: "GET",
    });
    // Extracting the token from the response
    const { token } = await res.json();
    console.log("Token received:", token);
    return token;
  } catch (error) {
    console.error("Error fetching token:", error);
    return null;
  }
};

// Fetch the token for use in other API requests
export const authToken = await getToken();

// API call to create a meeting
export const createMeeting = async (region = "us") => {
  try {
    const res = await fetch(`http://localhost:5000/create-meeting/`, {
      method: "POST",
      headers: {
        Authorization: authToken, // Use the token fetched from the backend
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: authToken, region }), // Pass the region and token
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
    const res = await fetch(`http://localhost:5000/validate-meeting/${meetingId}`, {
      method: "POST",
      headers: {
        Authorization: authToken, // Use the token fetched from the backend
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: authToken }), // Pass the token
    });

    const result = await res.json();
    console.log("Meeting validation result:", result);
    return result;
  } catch (error) {
    console.error("Error validating meeting:", error);
    return null;
  }
};
