import {
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

/**
 * Teacher data received from normal backend APIs.
 * Password is intentionally never returned or stored in Redux.
 */
export interface Teacher {
  id: number;
  employee_code: string;

  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  alternate_phone?: string | null;

  gender?: string | null;
  date_of_birth?: string | null;
  blood_group?: string | null;
  marital_status?: string | null;

  current_address?: string | null;
  permanent_address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pincode?: string | null;

  qualification?: string | null;
  specialization?: string | null;
  experience_years?: number | null;
  joining_date?: string | null;
  employment_type?: string | null;
  status?: string | null;

  basic_salary?: number | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  ifsc_code?: string | null;
  pan_number?: string | null;

  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_relation?: string | null;

  profile_image?: string | null;
  remarks?: string | null;

  created_at?: string | null;
  updated_at?: string | null;
  deleted_at?: string | null;
}

export interface TeacherPaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TeacherState {
  teachers: Teacher[];
  pagination: TeacherPaginationState;
}

const initialState: TeacherState = {
  teachers: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  },
};

const teacherSlice = createSlice({
  name: "teacher",
  initialState,

  reducers: {
    addTeacher: (
      state,
      action: PayloadAction<Teacher>,
    ) => {
      state.teachers.unshift(action.payload);
    },

    updateTeacher: (
      state,
      action: PayloadAction<Teacher>,
    ) => {
      const index = state.teachers.findIndex(
        (teacher) =>
          teacher.id === action.payload.id,
      );

      if (index !== -1) {
        state.teachers[index] = action.payload;
      }
    },

    deleteTeacher: (
      state,
      action: PayloadAction<number>,
    ) => {
      state.teachers = state.teachers.filter(
        (teacher) =>
          teacher.id !== action.payload,
      );
    },

    setTeachers: (
      state,
      action: PayloadAction<Teacher[]>,
    ) => {
      state.teachers = action.payload;
    },

    setTeachersPageData: (
      state,
      action: PayloadAction<{
        teachers: Teacher[];
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      }>,
    ) => {
      state.teachers = action.payload.teachers;
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
  addTeacher,
  updateTeacher,
  deleteTeacher,
  setTeachers,
  setTeachersPageData,
} = teacherSlice.actions;

export default teacherSlice.reducer;