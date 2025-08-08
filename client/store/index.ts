import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import complaintsSlice from './slices/complaintsSlice';
import languageSlice from './slices/languageSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    complaints: complaintsSlice,
    language: languageSlice,
    ui: uiSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
