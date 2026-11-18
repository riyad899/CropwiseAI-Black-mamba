"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, AuthUserResponse } from "./apis/auth.api";

export interface AuthUser {
  id?: string;
  name: string;
  email: string;
  role?: string;
  image?: string | null;
  status?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: (redirectPath?: string) => void;
  refreshUser: () => Promise<void>;
}

const AUTH_SESSION_CACHE_KEY = "techstore.auth.session";
const LEGACY_USER_KEY = "fieldshift_current_user";

const AuthContext = createContext<AuthContextValue | null>(null);

function saveSession(accessToken?: string, refreshToken?: string, user?: AuthUser) {
  if (typeof window === "undefined") return;
  try {
    const sessionData = {
      accessToken: accessToken || "",
      refreshToken: refreshToken || "",
      user: user || null,
      cachedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(AUTH_SESSION_CACHE_KEY, JSON.stringify(sessionData));
    if (user) {
      window.localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
    }
  } catch {
    // ignore
  }
}

function clearSession() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_SESSION_CACHE_KEY);
    window.localStorage.removeItem(LEGACY_USER_KEY);
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  const fetchCurrentUser = useCallback(async () => {
    try {
      console.log("[CropWise Auth] 🔄 Step 5: Checking user session with backend (/auth/me)...");
      const res = await authApi.getMe();
      if (res?.data) {
        const u = res.data;
        const normalized: AuthUser = {
          id: u.id,
          name: u.name || nameFromEmail(u.email),
          email: u.email,
          role: u.role,
          image: u.image,
          status: u.status,
        };
        console.log("[CropWise Auth] 🎉 Step 6: User successfully authenticated via backend:", normalized);
        setUser(normalized);
        saveSession(undefined, undefined, normalized);
      } else {
        console.warn("[CropWise Auth] ⚠️ /auth/me returned no data payload. User remains unauthenticated.");
      }
    } catch (err: any) {
      console.warn("[CropWise Auth] ℹ️ /auth/me session check failed or user not signed in:", {
        status: err?.status,
        message: err?.message,
      });
      // If unauthorized and no stored user, ensure user is null
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.group("[CropWise Auth] 🔍 Step 4: AuthProvider Initializing");
      console.log("Current Window URL:", window.location.href);
      console.log("Current Pathname:", window.location.pathname);
      console.log("Current Search Params:", window.location.search);

      // Check URL for OAuth callback parameters (errors or tokens from Render)
      try {
        const params = new URLSearchParams(window.location.search);
        const error = params.get("error");
        const urlAccessToken = params.get("accessToken");
        const urlRefreshToken = params.get("refreshToken");

        if (error) {
          console.error("[CropWise Auth] ❌ OAuth Error detected in URL query parameters:", {
            error,
            possibleCause:
              error === "oauth_failed"
                ? "Backend did not receive OAuth state/session from Google. Check Google Cloud Console Redirect URIs."
                : error === "no_session_found"
                ? "Backend session token expired or could not be found."
                : error === "access_denied"
                ? "User cancelled Google login dialog."
                : "Unknown OAuth error returned from backend.",
          });
        }

        if (urlAccessToken) {
          console.log("[CropWise Auth] 🎁 Found accessToken in URL parameters! Storing session to localStorage...");
          saveSession(urlAccessToken, urlRefreshToken || undefined);

          // Clean URL parameters without reloading page
          params.delete("accessToken");
          params.delete("refreshToken");
          const remainingQuery = params.toString() ? `?${params.toString()}` : "";
          const cleanUrl = `${window.location.pathname}${remainingQuery}${window.location.hash}`;
          window.history.replaceState({}, document.title, cleanUrl);
          console.log("[CropWise Auth] 🧹 Cleaned URL parameters to protect tokens:", cleanUrl);
        }
      } catch (e) {
        console.error("[CropWise Auth] Error parsing URL search params:", e);
      }

      // 1. Eagerly read cached user from localStorage to prevent UI flicker
      try {
        const cachedSession = window.localStorage.getItem(AUTH_SESSION_CACHE_KEY);
        if (cachedSession) {
          const parsed = JSON.parse(cachedSession);
          if (parsed?.user) {
            console.log("[CropWise Auth] 📦 Restored user session from localStorage cache:", parsed.user.email);
            setUser(parsed.user);
          }
        } else {
          const legacy = window.localStorage.getItem(LEGACY_USER_KEY);
          if (legacy) {
            const parsed = JSON.parse(legacy);
            console.log("[CropWise Auth] 📦 Restored legacy user cache:", parsed.email);
            setUser(parsed);
          }
        }
      } catch {
        // ignore
      }
      console.groupEnd();
    }

    // 2. Validate session with the backend
    fetchCurrentUser().finally(() => {
      setReady(true);
    });
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const data = response?.data;
    if (data) {
      const u = data.user;
      const normalizedUser: AuthUser = {
        id: u?.id,
        name: u?.name || nameFromEmail(email),
        email: u?.email || email,
        role: u?.role || "USER",
        image: u?.image,
        status: u?.status,
      };
      saveSession(data.accessToken, data.refreshToken, normalizedUser);
      setUser(normalizedUser);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authApi.register({ name, email, password });
    const data = response?.data;
    if (data) {
      const u = data.user;
      const normalizedUser: AuthUser = {
        id: u?.id,
        name: u?.name || name,
        email: u?.email || email,
        role: u?.role || "USER",
        image: u?.image,
        status: u?.status,
      };
      saveSession(data.accessToken, data.refreshToken, normalizedUser);
      setUser(normalizedUser);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearSession();
      setUser(null);
    }
  };

  const googleLogin = (redirectPath = "/dashboard") => {
    console.group("[CropWise Auth] 🚀 Step 1: User Initiated Google Login");
    console.log("Current Origin:", typeof window !== "undefined" ? window.location.origin : "");
    console.log("Requested Redirect Destination:", redirectPath);
    const url = authApi.getGoogleLoginUrl(redirectPath);
    console.log("Final Destination URL for Browser Redirect:", url);
    console.groupEnd();

    if (typeof window !== "undefined") {
      console.log("[CropWise Auth] ⏩ Step 3: Redirecting window.location to backend...");
      window.location.href = url;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        login,
        register,
        logout,
        googleLogin,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Fallback display name derived from an email, e.g. "farmer@field.com" -> "Farmer" */
export function nameFromEmail(email: string): string {
  const prefix = email.split("@")[0] || "Farmer";
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

export function initials(name?: string): string {
  if (!name || !name.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
