import axios from "axios";

const client = axios.create({
    baseURL: `${process.env.REACT_APP_BACKEND_URL}`
    // FOR LAPTOP AT HOME
    // baseURL: 'http://192.168.100.157:8000/'
    // baseURL: 'http://192.168.100.7:8000/'
    // OSAMA'S MOB
    // baseURL: 'http://192.168.252.146:8000/'
    // baseURL: 'http://192.168.72.146:8000/'
    // 192.168.252.146
    
})
export default client;