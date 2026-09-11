import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface StudentClassSnapshot {
  id: number;
  class_section_id: number;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  section_stream?: string | null;
  teacher_id: number | null;
  teacher_name: string;
  academic_year_id: number;
}

/** student_meta is a dynamic key/value store — whatever keys were saved for this student. */
export type StudentMeta = Record<string, string | number | boolean | null>;

export interface Student {
  id: number;
  student_code: string;

  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
  is_active: boolean;
  class_section_id: 1;
  class_name: "1";
  section_name: "A";

  meta: StudentMeta;
  current_class?: StudentClassSnapshot | null;

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface StudentPaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StudentState {
  students: Student[];
  pagination: StudentPaginationState;
}

const initialState: StudentState = {
  students: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
};

const studentSlice = createSlice({
  name: "student",
  initialState,
  reducers: {
    addStudent: (state, action: PayloadAction<Student>) => {
      const exists = state.students.some((student) => student.id === action.payload.id);

      if (!exists) {
        state.students = [action.payload, ...state.students].slice(0, state.pagination.limit || 10);
        state.pagination.total = Math.max(0, state.pagination.total + 1);
        state.pagination.totalPages = Math.max(1, Math.ceil(state.pagination.total / state.pagination.limit));
      } else {
        const index = state.students.findIndex((student) => student.id === action.payload.id);
        if (index !== -1) {
          state.students[index] = action.payload;
        }
      }
    },

    updateStudent: (state, action: PayloadAction<Student>) => {
      const index = state.students.findIndex(
        (student) => student.id === action.payload.id,
      );

      if (index !== -1) {
        state.students[index] = action.payload;
      } else {
        state.students = [action.payload, ...state.students].slice(0, state.pagination.limit || 10);
        state.pagination.total = Math.max(0, state.pagination.total + 1);
        state.pagination.totalPages = Math.max(1, Math.ceil(state.pagination.total / state.pagination.limit));
      }
    },

    deleteStudent: (state, action: PayloadAction<number>) => {
      const existed = state.students.some((student) => student.id === action.payload);
      state.students = state.students.filter(
        (student) => student.id !== action.payload,
      );

      if (existed) {
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        state.pagination.totalPages = Math.max(1, Math.ceil(state.pagination.total / state.pagination.limit));
      }
    },

    setStudents: (state, action: PayloadAction<Student[]>) => {
      state.students = action.payload;
    },

    setStudentsPageData: (
      state,
      action: PayloadAction<{
        students: Student[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }>,
    ) => {
      state.students = action.payload.students;
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
  addStudent,
  updateStudent,
  deleteStudent,
  setStudents,
  setStudentsPageData,
} = studentSlice.actions;

export default studentSlice.reducer;
