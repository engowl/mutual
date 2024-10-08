import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import AdminNavbar from "../pages/admin/components/AdminNavbar.jsx";
import { Button, Input } from "@nextui-org/react";
import { Toaster } from "react-hot-toast";
import { AdminProvider } from "../pages/admin/providers/AdminProvider.jsx";

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isLoggedIn, setLoggedIn] = useState(false);
  const staticPassword = "12345";

  const handleLogin = (e) => {
    e.preventDefault();
    const password = e.target.password.value;
    if (password === staticPassword) {
      const expiryTime = new Date().getTime() + 3 * 60 * 60 * 1000; // 3 hours
      localStorage.setItem("sessionExpiry", expiryTime);
      setLoggedIn(true);
      navigate("/__admin/dashboard");
    } else {
      alert("Invalid password");
    }
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("sessionExpiry");
    setLoggedIn(false);
    navigate("/__admin");
  }, [navigate]);

  useEffect(() => {
    // Check for session on component mount
    const sessionExpiry = localStorage.getItem("sessionExpiry");
    if (sessionExpiry && new Date().getTime() < sessionExpiry) {
      setLoggedIn(true);
    } else {
      localStorage.removeItem("sessionExpiry");
    }

    // Polling to check session validity every 8 seconds
    const interval = setInterval(() => {
      const expiryTime = localStorage.getItem("sessionExpiry");
      if (expiryTime && new Date().getTime() >= expiryTime) {
        alert("Session expired. Logging out.");
        handleLogout();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [handleLogout, navigate]);

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center px-5 md:px-10 min-h-screen bg-[#F0EFEA]">
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-5 items-center justify-center w-full max-w-md text-[#161616] rounded-xl mx-auto bg-[#F7F8FA] p-6 drop-shadow-sm border-[#EDEEF0] border-[1px]"
        >
          <h2 className="text-xl mb-4">Admin Login</h2>

          <Input
            type="password"
            name="password"
            placeholder="Enter Password"
            variant="bordered"
            classNames={{
              inputWrapper: "h-12 rounded-lg border shadow-none",
              input: "placeholder:text-neutral-300",
            }}
          />

          <Button
            type="submit"
            className="bg-orangy text-white rounded-full font-medium px-6"
          >
            Login
          </Button>
        </form>
      </div>
    );
  }

  return (
    <>
      <AdminProvider chainId={"devnet"}>
        <div className="min-h-screen w-full bg-creamy overflow-hidden">
          <AdminNavbar handleLogout={handleLogout} />
          <div className="h-[calc(100vh-3rem)] overflow-y-auto overflow-x-hidden">
            <Outlet />
          </div>
        </div>
        <Toaster />
      </AdminProvider>
    </>
  );
}
