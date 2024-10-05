import { useContext } from "react";
import { AuthContext } from "../../../contexts/AuthContext.js";

export const useMCAuth = () => useContext(AuthContext);
