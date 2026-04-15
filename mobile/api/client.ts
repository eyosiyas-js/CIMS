import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For physical device testing, use your computer's local IP address.
// Based on your ipconfig, it looks like: 172.20.83.212 (or 192.168.137.1 if on hotspot)
export const BASE_URL = 'http://192.168.137.1:8000'; // Computer's local IP address for Expo testing
const API_URL = `${BASE_URL}/api/v1`;
// const API_URL = 'http://127.0.0.1:8000/api/v1'; // Use this for web/emulator ONLY

const apiClient = axios.create({
    baseURL: API_URL,
});

// Interceptor to add token to requests
apiClient.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;
