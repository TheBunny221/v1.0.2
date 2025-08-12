import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import complaintsSlice from "./slices/complaintsSlice";
import languageSlice from "./slices/languageSlice";
import uiSlice from "./slices/uiSlice";
import guestSlice from "./slices/guestSlice";
import dataSlice from "./slices/dataSlice";
import { baseApi } from "./api/baseApi";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    complaints: complaintsSlice,
    language: languageSlice,
    ui: uiSlice,
    guest: guestSlice,
    data: dataSlice,
    // Add RTK Query reducer
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          // RTK Query action types to ignore
          "api/executeQuery/pending",
          "api/executeQuery/fulfilled",
          "api/executeQuery/rejected",
          "api/executeMutation/pending",
          "api/executeMutation/fulfilled",
          "api/executeMutation/rejected",
        ],
        ignoredActionsPaths: ["meta.arg", "payload.timestamp"],
        ignoredPaths: ["api.queries", "api.mutations"],
      },
    })
      // Add RTK Query middleware
      .concat(baseApi.middleware),
  devTools: process.env.NODE_ENV !== "production",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
