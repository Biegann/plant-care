import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import pl from "./locales/pl.json";

const deviceLanguage = getLocales()[0]?.languageCode ?? "en";

i18n.use(initReactI18next).init({
  resources: {
    pl: { translation: pl },
    en: { translation: en },
  },
  lng: deviceLanguage === "pl" ? "pl" : "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
