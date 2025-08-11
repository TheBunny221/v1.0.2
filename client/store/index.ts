import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import complaintsSlice from "./slices/complaintsSlice";
import languageSlice from "./slices/languageSlice";
import uiSlice from "./slices/uiSlice";
import guestSlice from "./slices/guestSlice";
import dataSlice from "./slices/dataSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    complaints: complaintsSlice,
    language: languageSlice,
    ui: uiSlice,
    guest: guestSlice,
    data: dataSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
