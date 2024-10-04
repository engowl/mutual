import { Outlet } from "react-router-dom";
import Navbar from "../components/shared/Navbar";

export default function RootLayout() {
  return (
    <div className="min-h-screen w-full bg-creamy">
      <Navbar />
      <div className="h-[calc(100vh-3rem)] overflow-y-auto overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}
