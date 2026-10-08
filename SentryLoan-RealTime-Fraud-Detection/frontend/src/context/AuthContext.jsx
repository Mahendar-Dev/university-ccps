// context/AuthContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "../utils/api";
import { connectSocket, disconnectSocket } from "../socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) connectSocket(token);
    setReady(true);
  }, []);

  const persist = (token, nextUser) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
    connectSocket(token);
  };

  const login = useCallback(async (email, password) => {
    const { token, user: loggedInUser } = await api.login({ email, password });
    persist(token, loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    const { token, user: newUser } = await api.register({ name, email, password, role });
    persist(token, newUser);
    return newUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Even if the server call fails, still clear the local session.
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    disconnectSocket();
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside an AuthProvider");
  return ctx;
}
