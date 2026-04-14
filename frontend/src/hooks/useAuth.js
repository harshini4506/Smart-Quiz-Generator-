import { useEffect, useMemo, useState } from "react";

const USER_KEY = "auth_user";

const normalizeRole = (value) => {
  const role = String(value || "").trim().toLowerCase();
  if (role === "faculty" || role === "student") return role;
  return "student";
};

export function useAuthState() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setUser({ ...parsed, role: normalizeRole(parsed?.role) });
      } catch {
        setUser(null);
      }
    }
  }, []);

  const loginState = (token, profile) => {
    const normalized = { ...profile, role: normalizeRole(profile?.role) };
    localStorage.setItem("token", token);
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    setUser(normalized);
  };

  const logoutState = () => {
    localStorage.removeItem("token");
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return useMemo(() => ({ user, loginState, logoutState }), [user]);
}
