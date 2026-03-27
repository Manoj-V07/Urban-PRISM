import { useCallback, useRef } from "react";
import api from "../api/axios";
import ENDPOINTS from "../api/endpoints";
import useLanguage from "./useLanguage";

const globalCache = new Map();

const makeKey = (lang, text) => `${lang}::${text}`;

const useLiveTranslator = () => {
  const { language } = useLanguage();
  const inflightRef = useRef(new Map());

  const translateBatch = useCallback(
    async (texts = []) => {
      const clean = Array.from(
        new Set(
          (texts || [])
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        )
      );

      const passthrough = {};
      if (language === "en") {
        for (const text of clean) passthrough[text] = text;
        return passthrough;
      }

      const missing = clean.filter((text) => !globalCache.has(makeKey(language, text)));
      if (missing.length) {
        const requestKey = `${language}::${missing.join("||")}`;
        if (!inflightRef.current.has(requestKey)) {
          inflightRef.current.set(
            requestKey,
            api.post(ENDPOINTS.PUBLIC.TRANSLATE, {
              texts: missing,
              targetLang: language,
            })
          );
        }

        try {
          const { data } = await inflightRef.current.get(requestKey);
          const translations = data?.translations || {};
          for (const source of missing) {
            const translated = translations[source] || source;
            globalCache.set(makeKey(language, source), translated);
          }
        } catch {
          for (const source of missing) {
            globalCache.set(makeKey(language, source), source);
          }
        } finally {
          inflightRef.current.delete(requestKey);
        }
      }

      const result = {};
      for (const text of clean) {
        result[text] = globalCache.get(makeKey(language, text)) || text;
      }
      return result;
    },
    [language]
  );

  const translateOne = useCallback(
    async (text) => {
      const value = String(text || "");
      if (!value.trim() || language === "en") return value;
      const map = await translateBatch([value]);
      return map[value] || value;
    },
    [language, translateBatch]
  );

  return { translateBatch, translateOne, language };
};

export default useLiveTranslator;