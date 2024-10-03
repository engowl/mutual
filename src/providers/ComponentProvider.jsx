import { Toaster } from "react-hot-toast";

export default function ComponentProvider({ children }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
