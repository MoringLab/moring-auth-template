'use client';

import React, { createContext, useContext, useState } from 'react';
import { Language } from '@/types';

interface LanguageContextType {
  language: Language; // UI Language
  setLanguage: (lang: Language) => void;
  aiLanguage: Language; // AI Response Language
  setAiLanguage: (lang: Language) => void;
  t: (en: string, ko: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ko'); // Default UI to Korean
  const [aiLanguage, setAiLanguage] = useState<Language>('ko'); // Default AI to Korean

  const t = (en: string, ko: string) => {
    return language === 'en' ? en : ko;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, aiLanguage, setAiLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
