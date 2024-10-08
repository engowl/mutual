import axios from "axios";

export const apiWithToken = () => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
  });

  instance.interceptors.request.use(
    (config) => {
      let token = localStorage.getItem("session_key");

      if (token && token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
      }

      console.log("token from mutual: ", token);

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