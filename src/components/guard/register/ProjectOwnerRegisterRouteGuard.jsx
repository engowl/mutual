import { Navigate } from "react-router-dom";
import { useMCAuth } from "../../../lib/mconnect/hooks/useMcAuth";
import { Spinner } from "@nextui-org/react";

export default function ProjectOwnerRegisterRouteGuard({ children }) {
  const { user, isUserLoading } = useMCAuth();

  if (user && user?.projectOwner?.status === "APPROVED") {
    return <Navigate to="/project-owner/browse" />;
  }

  if (!user || isUserLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner size="md" color="primary" />
      </div>
    );
  }

  return <>{children}</>;
}
