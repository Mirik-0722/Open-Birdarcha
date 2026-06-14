import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { setRedirect } from "../auth";

/** Token bo'lmasa /login ga yo'naltiradi va kelingan sahifani eslab qoladi. */
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth();
  const location = useLocation();

  if (!authenticated) {
    setRedirect(location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
