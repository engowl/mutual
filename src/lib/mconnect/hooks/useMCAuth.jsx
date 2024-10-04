import { useContext } from "react";
import { AuthContext } from "../AuthProvider.jsx";

export const useMCAuth = () => useContext(AuthContext);
