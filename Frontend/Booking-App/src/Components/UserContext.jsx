// src/Components/UserContext.jsx
import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);

  useEffect(() => {
    // keep localStorage in sync
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");

    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [user, token]);

  // Helper: returns headers including auth if token exists
  function authHeaders(extra = {}) {
    const headers = { "Content-Type": "application/json", ...extra };
    if (token) headers["Authorization"] = `Token ${token}`; // or `Bearer ${token}` if JWT
    return headers;
  }

  // Login -> POST /login/  (backend shows login/ endpoint)
  async function login({ username, password }) {
    const res = await fetch(`${API}/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Login failed: ${res.status}`);
    }

    const data = await res.json();
    // backend might return { token, user } or { user } or { key } depending on setup
    if (data.token) setToken(data.token);
    if (data.key) setToken(data.key); // some auth packages use `key`
    if (data.user) setUser(data.user);
    // fallback: if backend returns user fields directly (e.g. username/email)
    if (!data.user && (data.username || data.email)) {
      setUser(data);
    }
    return data;
  }

  // Register -> POST /register/
  async function register({ username, email, password }) {
    const res = await fetch(`${API}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `Register failed: ${res.status}`);
    }

    const data = await res.json();
    if (data.token) setToken(data.token);
    if (data.key) setToken(data.key);
    if (data.user) setUser(data.user);
    return data;
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  // small wrapper that sends auth header automatically
  async function authedFetch(path, options = {}) {
    const url = path.startsWith("http") ? path : `${API}${path.startsWith("/") ? "" : "/"}${path}`;
    const headers = { ...(options.headers || {}), ...authHeaders() };
    return fetch(url, { ...options, headers });
  }

  return (
    <UserContext.Provider value={{ user, token, login, register, logout, authedFetch, API }}>
      {children}
    </UserContext.Provider>
  );
}

