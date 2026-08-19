import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

export interface Subject {
  id: number;
  class_section_id: number;
  name: string;
  description: string | null;

  display_order: number | null;

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface SubjectState {
  subjects: Subject[];
}

const initialState: SubjectState = {
  subjects: [],
};

const subjectSlice = createSlice({
  name: "subject",

  initialState,

  reducers: {
    /**
     * Add Subject
     */
    addSubject: (
      state,
      action: PayloadAction<Subject>,
    ) => {
      state.subjects.unshift(
        action.payload,
      );
    },

    /**
     * Update Subject
     */
    updateSubject: (
      state,
      action: PayloadAction<Subject>,
    ) => {
      const index =
        state.subjects.findIndex(
          (subject) =>
            subject.id ===
            action.payload.id,
        );

      if (index !== -1) {
        state.subjects[index] =
          action.payload;
      }
    },

    /**
     * Remove Subject
     */
    deleteSubject: (
      state,
      action: PayloadAction<number>,
    ) => {
      state.subjects =
        state.subjects.filter(
          (subject) =>
            subject.id !==
            action.payload,
        );
    },

    /**
     * Set Subject List
     */
    setSubjects: (
      state,
      action: PayloadAction<Subject[]>,
    ) => {
      state.subjects =
        action.payload;
    },
  },
});

export const {
  addSubject,
  updateSubject,
  deleteSubject,
  setSubjects,
} = subjectSlice.actions;

export default subjectSlice.reducer;