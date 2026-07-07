import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slicers/authslicer";
import settingsReducer from "./slicers/settingsSlicer";
import sectionReducer from "./slicers/sectionSlicer";
import classReducer from "./slicers/classesSlicer";
import teacherReducer from "./slicers/teacherSlice"
export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    section: sectionReducer,
    class: classReducer,
    teacher:teacherReducer
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
