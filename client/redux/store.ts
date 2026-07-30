import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slicers/authslicer";
import settingsReducer from "./slicers/settingsSlicer";
import sectionReducer from "./slicers/sectionSlicer";
import classReducer from "./slicers/classesSlicer";
import teacherReducer from "./slicers/teacherSlice"
import classSectionRelationReducer from "./slicers/classSectionRelationSlicer"
import StreamReducer from "./slicers/stream.Slicer"
import academicSessionReducer from "./slicers/AcademicSessionSlicer"
import studentReducer from "./slicers/studentSlicer"
import studentAuthReducer from "./slicers/studentAuthSlicer"
export const store = configureStore({
  reducer: {
    auth: authReducer,
    settings: settingsReducer,
    section: sectionReducer,
    class: classReducer,
    teacher: teacherReducer,
    classSection: classSectionRelationReducer,
    stream: StreamReducer,
    academicSession: academicSessionReducer,
    student: studentReducer,
    studentAuth: studentAuthReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
