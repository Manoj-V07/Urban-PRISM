import useLanguage from "../../hooks/useLanguage";
import { useTranslation } from "react-i18next";

const LABELS = {
  en: "English",
  ta: "Tamil",
  hi: "Hindi",
};

const LanguageSelector = ({ className = "" }) => {
  const { language, setLanguage, isTranslating } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className={`language-switcher ${className}`.trim()}>
      <label htmlFor="language-select">{t("language")}</label>
      <select
        id="language-select"
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        disabled={isTranslating}
        style={{
          opacity: isTranslating ? 0.6 : 1,
          cursor: isTranslating ? "wait" : "pointer",
        }}
      >
        {Object.entries(LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
            {isTranslating && value === language ? " (translating...)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
