import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface StudentAuthUser {
  id: number;
  student_code: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface StudentAuthState {
  student: StudentAuthUser | null;
  isAuthenticated: boolean;
}

const initialState: StudentAuthState = {
  student: null,
  isAuthenticated: false,
};

const studentAuthSlice = createSlice({
  name: "studentAuth",
  initialState,
  reducers: {
    setStudentAuth: (state, action: PayloadAction<StudentAuthUser>) => {
      state.student = action.payload;
      state.isAuthenticated = true;
    },
    clearStudentAuth: (state) => {
      state.student = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setStudentAuth, clearStudentAuth } = studentAuthSlice.actions;
export default studentAuthSlice.reducer;
