import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DICTIONARIES,
  en,
  LANGUAGES,
  type LanguageCode,
  type TranslationKey,
} from "./translations";

const STORAGE_KEY = "tripcraft.lang.v1";

export type TranslateVars = Record<string, string | number>;

export type Translate = (key: TranslationKey, vars?: TranslateVars) => string;

interface I18nContextValue {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: Translate;
}

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

function translateWith(language: LanguageCode, key: TranslationKey, vars?: TranslateVars): string {
  const dictionary = DICTIONARIES[language];
  const value = dictionary[key] ?? en[key];
  return interpolate(value, vars);
}

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  setLanguage: () => undefined,
  t: (key, vars) => translateWith("en", key, vars),
});

const isLanguage = (value: string): value is LanguageCode =>
  LANGUAGES.some((l) => l.code === value);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isLanguage(stored)) setLanguageState(stored);
    } catch {
      // storage unavailable — English stays the default
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: LanguageCode) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore write failures
    }
  }, []);

  const t = useCallback<Translate>(
    (key, vars) => translateWith(language, key, vars),
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
