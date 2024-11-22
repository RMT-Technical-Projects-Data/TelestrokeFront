import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Use useNavigate instead of useHistory
import jwt_decode from 'jwt-decode';

const useAuth = () => {
  const navigate = useNavigate(); // Initialize the navigate function

  // Function to check if the token is expired
  const checkTokenExpiration = () => {
    const token = localStorage.getItem('token'); // Or sessionStorage if you're using that
    
    if (!token) {
      return true; // No token found, consider expired or missing
    }

    try {
      const decodedToken = jwt_decode(token);
      const currentTime = Date.now() / 1000; // Current time in seconds

      if (decodedToken.exp < currentTime) {
        return true; // Token is expired
      }
      return false; // Token is still valid
    } catch (error) {
      return true; // If there's an error decoding, consider the token expired
    }
  };

  // Effect to check token expiration when the component mounts or when history changes
  useEffect(() => {
    if (checkTokenExpiration()) {
    localStorage.removeItem('patientName');
    localStorage.removeItem('token');
      navigate('/login'); // Redirect to the login page using useNavigate
    }
  }, [navigate]); // Re-run when the component mounts or on navigate change
};

export default useAuth;
