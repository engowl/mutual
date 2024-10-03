import axios from "axios";
import Cookies from "js-cookie";

export const apiWithToken = () => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
  });

  instance.interceptors.request.use(
    (config) => {
      const token = Cookies.get("session_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        throw new Error("No session token found");
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
};

export const api = () => {
  return axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
  });
};

export const mutualAPI = apiWithToken();
export const mutualPublicAPI = api();
