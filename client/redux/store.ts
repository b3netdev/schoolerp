import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slicers/authslicer";
import settingsReducer from "./slicers/settingsSlicer"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
