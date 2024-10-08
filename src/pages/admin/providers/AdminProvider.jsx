import { createContext } from "react";
import { CHAINS } from "../../../config.js";

export const AdminContext = createContext();

export const AdminProvider = ({ chainId, children }) => {
  const selectedChainConfig = CHAINS.find((c) => c.id === chainId);
  console.log("Admin Selected Chain Config: ", selectedChainConfig);

  return (
    <AdminContext.Provider value={{ chain: selectedChainConfig }}>
      {children}
    </AdminContext.Provider>
  );
};
