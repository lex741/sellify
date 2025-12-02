import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export function RequireAuth({ children }) {
    const { token } = useAuth();
    if (!token) return <Navigate to="/login" replace />;
    return children;
}
