import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slicers/authslicer";
import settingsReducer from "./slicers/settingsSlicer";
import sectionReducer from "./slicers/sectionSlicer";
import classReducer from "./slicers/classesSlicer";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    section: sectionReducer,
    class: classReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
