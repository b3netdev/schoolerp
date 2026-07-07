import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Teacher {
  id: number;
  employee_code: string;

  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;

  gender?: string;
  date_of_birth?: string;
  blood_group?: string;
  marital_status?: string;

  current_address?: string;
  permanent_address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  qualification?: string;
  specialization?: string;
  experience_years?: number;
  joining_date?: string;
  employment_type?: string;
  status?: string;

  basic_salary?: number;
  bank_name?: string;
  bank_account_number?: string;
  ifsc_code?: string;
  pan_number?: string;

  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;

  profile_image?: string;
  remarks?: string;

  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface TeacherState {
  teachers: Teacher[];
}

const initialState: TeacherState = {
  teachers: [],
};

const teacherSlice = createSlice({
  name: "teacher",
  initialState,
  reducers: {
    addTeacher: (state, action: PayloadAction<Teacher>) => {
      state.teachers.unshift(action.payload);
    },

    updateTeacher: (state, action: PayloadAction<Teacher>) => {
      const index = state.teachers.findIndex(
        (teacher) => teacher.id === action.payload.id
      );

      if (index !== -1) {
        state.teachers[index] = action.payload;
      }
    },

    deleteTeacher: (state, action: PayloadAction<number>) => {
      state.teachers = state.teachers.filter(
        (teacher) => teacher.id !== action.payload
      );
    },

    setTeachers: (state, action: PayloadAction<Teacher[]>) => {
      state.teachers = action.payload;
    },
  },
});

export const {
  addTeacher,
  updateTeacher,
  deleteTeacher,
  setTeachers,
} = teacherSlice.actions;

export default teacherSlice.reducer;