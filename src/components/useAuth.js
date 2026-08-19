import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { toast } from 'react-toastify';

const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const checkTokenExpiration = () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return true;
    }

    try {
      const decodedToken = jwt_decode(token);
      if (!decodedToken || typeof decodedToken !== 'object') {
        return false;
      }
      if (decodedToken.exp) {
        const currentTime = Date.now() / 1000;
        return decodedToken.exp < currentTime;
      }
      return false;
    } catch (error) {
      // If token decoding fails (e.g. opaque string token), assume valid if token is non-empty
      return false;
    }
  };

  useEffect(() => {
    if (location.pathname === '/login') {
      return;
    }

    if (checkTokenExpiration()) {
      localStorage.clear();
      sessionStorage.removeItem("tsOverdueToastShown");
      toast.dismiss();
      navigate("/login");
    }
  }, [navigate, location.pathname]);
};

export default useAuth;
