import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Use useLocation to check current path
import jwt_decode from 'jwt-decode';

const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get current location

  const checkTokenExpiration = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return true;
    }

    try {
      const decodedToken = jwt_decode(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        return true;
      }
      return false;
    } catch (error) {
      return true;
    }
  };

  useEffect(() => {
    // If we're already on the login page, don't try to redirect there again
    if (location.pathname === '/login') {
      return;
    }

    if (checkTokenExpiration()) {
      localStorage.clear();
      navigate('/login');
    }
  }, [navigate, location.pathname]); // Add location.pathname to dependencies
};

export default useAuth;
