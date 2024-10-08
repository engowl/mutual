import { useContext } from "react";
import { AdminContext } from "../providers/AdminProvider.jsx";

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useChain must be used within a ChainProvider");
  }
  return context;
};
