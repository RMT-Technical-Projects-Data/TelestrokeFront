import axios from "axios";

export const getApiBaseUrl = () => {
  if (process.env.REACT_APP_BACKEND_URL && process.env.REACT_APP_BACKEND_URL !== "http://localhost:5000") {
    return process.env.REACT_APP_BACKEND_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return window.location.origin;
  }
  return process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";
};

const client = axios.create({
  baseURL: getApiBaseUrl()
});

export default client;