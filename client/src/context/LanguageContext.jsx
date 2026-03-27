import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import i18n from "../i18n";

const STORAGE_KEY = "urban_prism_language";
const SUPPORTED_LANGUAGES = ["en", "ta", "hi"];

export const LanguageContext = createContext(null);

const getInitialLanguage = () => {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;
  return "en";
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);
  const [isTranslating, setIsTranslating] = useState(false);

  const setLanguage = useCallback(async (lang) => {
    if (!SUPPORTED_LANGUAGES.includes(lang)) return;
    setIsTranslating(true);
    try {
      await i18n.changeLanguage(lang);
      setLanguageState(lang);
    } finally {
      setIsTranslating(false);
    }
  }, []);

  const reapplyLanguage = useCallback(async () => {
    setIsTranslating(true);
    try {
      await i18n.changeLanguage(language);
    } finally {
      setIsTranslating(false);
    }
  }, [language]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      reapplyLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES,
      isTranslating,
    }),
    [language, setLanguage, reapplyLanguage, isTranslating]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
