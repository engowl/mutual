import { useContext } from "react";
import { sessionContext } from "../contexts/SessionContext";

export const useSession = () => {
  const context = useContext(sessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};
