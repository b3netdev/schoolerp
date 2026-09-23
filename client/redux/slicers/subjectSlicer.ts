import {
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

export interface Subject {
  id: number;
  class_section_id: number;

  subject_type_id: number | null;
  subject_type_title?: string | null;

  name: string;
  description: string | null;
  display_order: number | null;

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface SubjectPaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SubjectState {
  subjects: Subject[];
  pagination: SubjectPaginationState;
}

const initialState: SubjectState = {
  subjects: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
};

const subjectSlice = createSlice({
  name: "subject",
  initialState,

  reducers: {
    addSubject: (
      state,
      action: PayloadAction<Subject>,
    ) => {
      state.subjects.unshift(action.payload);
    },

    updateSubject: (
      state,
      action: PayloadAction<Subject>,
    ) => {
      const index = state.subjects.findIndex(
        (subject) =>
          subject.id === action.payload.id,
      );

      if (index !== -1) {
        state.subjects[index] = action.payload;
      }
    },

    deleteSubject: (
      state,
      action: PayloadAction<number>,
    ) => {
      state.subjects = state.subjects.filter(
        (subject) =>
          subject.id !== action.payload,
      );
    },

    setSubjects: (
      state,
      action: PayloadAction<
        Subject[] | { subjects?: Subject[] }
      >,
    ) => {
      state.subjects = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.subjects ?? [];
    },

    setSubjectsPageData: (
      state,
      action: PayloadAction<{
        subjects: Subject[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }>,
    ) => {
      state.subjects = action.payload.subjects;

      state.pagination = {
        page: action.payload.page,
        limit: action.payload.limit,
        total: action.payload.total,
        totalPages: action.payload.totalPages,
      };
    },
  },
});

export const {
  addSubject,
  updateSubject,
  deleteSubject,
  setSubjects,
  setSubjectsPageData,
} = subjectSlice.actions;

export default subjectSlice.reducer;