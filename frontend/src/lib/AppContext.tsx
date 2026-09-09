'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, Translations } from './translations';

interface AppContextType {
  lang: Language;
  setLang: (l: Language) => void;
  t: Translations;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: any;
  setUser: (u: any) => void;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [user, setUserState] = useState<any>(null);

  useEffect(() => {
    // Load persisted settings
    const savedLang = localStorage.getItem('medikiosk_lang') as Language;
    if (savedLang && ['en', 'kn', 'ta', 'hi'].includes(savedLang)) {
      setLangState(savedLang);
    }

    const savedTheme = localStorage.getItem('medikiosk_theme') as 'light' | 'dark';
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const savedUser = localStorage.getItem('medikiosk_user');
    if (savedUser) {
      try {
        setUserState(JSON.parse(savedUser));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('medikiosk_lang', newLang);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(nextTheme);
    localStorage.setItem('medikiosk_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const setUser = (newUser: any) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('medikiosk_user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('medikiosk_user');
      localStorage.removeItem('medikiosk_token');
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t: translations[lang] || translations.en,
        theme,
        toggleTheme,
        user,
        setUser,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
