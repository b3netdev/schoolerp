import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slicers/authslicer";
import settingsReducer from "./slicers/settingsSlicer";
import sectionReducer from "./slicers/sectionSlicer";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    section: sectionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
