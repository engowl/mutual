import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "../components/shared/Navbar";
import { useMCAuth } from "../lib/mconnect/hooks/useMcAuth.jsx";
import { useEffect } from "react";

export default function RootLayout() {
  const { isLoggedIn } = useMCAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn && isLoggedIn === false) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  return (
    <div className="min-h-screen w-full bg-creamy overflow-hidden">
      <Navbar />
      <div className="h-[calc(100vh-3rem)] overflow-y-auto overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}
