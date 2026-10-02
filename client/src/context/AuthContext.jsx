import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "../api/services.js";
import { useToast } from "./ToastContext.jsx";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// One provider handles both the customer session and the (separate) admin session.
export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const isAdminArea = window.location.pathname.startsWith("/admin");
    const calls = [
      authApi
        .me()
        .then((r) => alive && setUser(r.user))
        .catch(() => {}),
    ];
    if (isAdminArea)
      calls.push(
        authApi
          .adminMe()
          .then((r) => alive && setAdmin(r.user))
          .catch(() => {}),
      );
    Promise.all(calls).finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onExpired = (e) => {
      if (e.detail?.admin) {
        setAdmin(null);
      } else {
        setUser(null);
      }
    };
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [toast]);

  const login = useCallback(async (creds) => {
    const r = await authApi.login(creds);

    setUser(r.user);

    // Normal login can also authenticate an admin.
    // The backend creates admin_token for admin accounts.
    if (r.user?.role === "admin") {
      try {
        const adminSession = await authApi.adminMe();
        setAdmin(adminSession.user);
      } catch {
        setAdmin(null);
      }
    }

    return r.user;
  }, []);
  const register = useCallback(async (data) => {
    const r = await authApi.register(data);
    setUser(r.user);
    return r.user;
  }, []);
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* cookie may already be gone */
    }
    setUser(null);
  }, []);
  const adminLogin = useCallback(async (creds) => {
    const r = await authApi.adminLogin(creds);
    setAdmin(r.user);
    return r.user;
  }, []);
  const adminLogout = useCallback(async () => {
    try {
      await authApi.adminLogout();
    } catch {
      /* ignore */
    }
    setAdmin(null);
  }, []);
  const ensureAdmin = useCallback(async () => {
    try {
      const r = await authApi.adminMe();
      setAdmin(r.user);
    } catch {
      setAdmin(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      admin,
      loading,
      login,
      register,
      logout,
      adminLogin,
      adminLogout,
      ensureAdmin,
      setUser,
    }),
    [
      user,
      admin,
      loading,
      login,
      register,
      logout,
      adminLogin,
      adminLogout,
      ensureAdmin,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
