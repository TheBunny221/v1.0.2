import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Translation, translations } from "../../resource/translations";

export type Language = "en" | "hi" | "ml";

export interface LanguageState {
  currentLanguage: Language;
  translations: Translation;
  isRTL: boolean;
}

const initialState: LanguageState = {
  currentLanguage: "en",
  translations: translations.en,
  isRTL: false,
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.currentLanguage = action.payload;
      state.translations = translations[action.payload];
      state.isRTL = false; // None of our supported languages are RTL, but can be extended

      // Save to localStorage
      localStorage.setItem("language", action.payload);
    },
    initializeLanguage: (state) => {
      // Initialize from localStorage or browser language
      const savedLanguage = localStorage.getItem("language") as Language;
      const browserLanguage = navigator.language.split("-")[0] as Language;

      let selectedLanguage: Language = "en";

      if (savedLanguage && translations[savedLanguage]) {
        selectedLanguage = savedLanguage;
      } else if (browserLanguage && translations[browserLanguage]) {
        selectedLanguage = browserLanguage;
      }

      state.currentLanguage = selectedLanguage;
      state.translations = translations[selectedLanguage];
      state.isRTL = false;
    },
  },
});

export const { setLanguage, initializeLanguage } = languageSlice.actions;
export default languageSlice.reducer;

// Selector hook for easy access to translations
export const useTranslations = () => {
  return (state: { language: LanguageState }) => state.language.translations;
};
