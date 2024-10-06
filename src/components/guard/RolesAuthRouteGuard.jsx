import { Navigate } from "react-router-dom";
import { Spinner } from "@nextui-org/react";
import { useMCAuth } from "../../lib/mconnect/hooks/useMCAuth.jsx";

export default function RolesAuthRouteGuard({ children, roles }) {
  const { user, isUserLoading } = useMCAuth();

  const canAccess = roles.includes(user?.role);

  if (canAccess) return children;

  if (!user || isUserLoading)
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Spinner size="md" color="primary" />
      </div>
    );

  return <Navigate to="/" />;
}
