import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ user, roles, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user.role || "student")) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
