"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations, Translations } from "./translations";
import { ApiService } from "./api";

interface User {
  sub: string;
  email: string;
  role: "patient" | "doctor" | "admin";
  name: string;
  medikiosk_id?: string;
  doctor_id?: string;
  formatted_id?: string;
}

interface AppContextType {
  user: User | null;
  theme: "light" | "dark";
  language: Language;
  t: Translations;
  setTheme: (theme: "light" | "dark") => void;
  setLanguage: (lang: Language) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize theme, language, and user session from localStorage
  useEffect(() => {
    const savedTheme = (localStorage.getItem("medikiosk_theme") as "light" | "dark") || "light";
    const savedLang = (localStorage.getItem("medikiosk_lang") as Language) || "en";
    const savedUser = localStorage.getItem("medikiosk_user");

    setThemeState(savedTheme);
    setLanguageState(savedLang);

    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        // ignore
      }
    }
    setIsLoading(false);
  }, []);

  const setTheme = (newTheme: "light" | "dark") => {
    setThemeState(newTheme);
    localStorage.setItem("medikiosk_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem("medikiosk_lang", newLang);
  };

  const login = (token: string, newUser: User) => {
    ApiService.setToken(token);
    setUser(newUser);
    localStorage.setItem("medikiosk_user", JSON.stringify(newUser));
  };

  const logout = () => {
    ApiService.removeToken();
    setUser(null);
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const refreshUser = async () => {
    try {
      const me = await ApiService.getMe();
      const updatedUser: User = {
        sub: me.id,
        email: me.email,
        role: me.role,
        name: me.full_name,
        medikiosk_id: me.medikiosk_id,
        doctor_id: me.doctor_id,
        formatted_id: me.medikiosk_id || me.doctor_id,
      };
      setUser(updatedUser);
      localStorage.setItem("medikiosk_user", JSON.stringify(updatedUser));
    } catch {
      // ignore
    }
  };

  const t = translations[language];

  return (
    <AppContext.Provider
      value={{
        user,
        theme,
        language,
        t,
        setTheme,
        setLanguage,
        login,
        logout,
        refreshUser,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
