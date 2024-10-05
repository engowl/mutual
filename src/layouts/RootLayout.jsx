import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/shared/Navbar";
import { useMCAuth } from "../lib/mconnect/hooks/useMcAuth.jsx";
import { useEffect } from "react";
import RootProvider from "../providers/RootProvider.jsx";

function RootLayout() {
  const { isLoggedIn, isCheckingSession, isUserLoading, user } = useMCAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");

  useEffect(() => {
    if (code) return;
    if (!isCheckingSession && !isUserLoading) {
      if (!isLoggedIn || !user) {
        navigate("/");
      }
    }
  }, [isCheckingSession, isLoggedIn, isUserLoading, navigate, user, code]);

  return (
    <div className="min-h-screen w-full bg-creamy overflow-hidden">
      <Navbar />
      <div className="h-[calc(100vh-3rem)] overflow-y-auto overflow-x-hidden">
        <Outlet />
      </div>
    </div>
  );
}

export default function RootestLayout() {
  return (
    <RootProvider>
      <RootLayout />
    </RootProvider>
  );
}
