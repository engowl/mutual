import { Navigate } from "react-router-dom";
import { useMCAuth } from "../../lib/mconnect/hooks/useMcAuth";

export default function RolesAuthRouteGuard({ children, roles }) {
  const { user } = useMCAuth();

  const canAccess = roles.includes(user?.role);

  if (canAccess) return children;

  return <Navigate to="/" />;
}
