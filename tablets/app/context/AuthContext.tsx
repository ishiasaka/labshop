"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface AuthContextType {
  jwtToken: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const isAuthenticated = !!jwtToken;

  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    if (token) setJwtToken(token);
  }, []);

  const login = (token: string) => {
    setJwtToken(token);
    localStorage.setItem("jwtToken", token);
  };

  const logout = () => {
    setJwtToken(null);
    localStorage.removeItem("jwtToken");
  };

  return (
    <AuthContext.Provider value={{ jwtToken, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
