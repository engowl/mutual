import { Outlet, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/shared/Navbar";
import { useMCAuth } from "../lib/mconnect/hooks/useMcAuth.jsx";
import { useEffect } from "react";
import RootProvider from "../providers/RootProvider.jsx";
import { Spinner } from "@nextui-org/react";

function RootLayout() {
  const { isLoggedIn, isCheckingSession, isUserLoading, user } = useMCAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || isUserLoading) return;
    if (!isLoggedIn) {
      navigate("/");
    }
  }, [isCheckingSession, isLoggedIn, isUserLoading, navigate, user]);

  if (isUserLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Spinner size="md" color="primary" />
      </div>
    );
  }

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
