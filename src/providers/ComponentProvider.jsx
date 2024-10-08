import { Toaster } from "react-hot-toast";
import SupportAndHelpDrawer from "../components/support/SupportAndHelpDrawer";

export default function ComponentProvider({ children }) {
  return (
    <>
      {children}
      <Toaster />
      <SupportAndHelpDrawer />
    </>
  );
}
