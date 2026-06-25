import { createSlice } from "@reduxjs/toolkit";
export type UserRole = "admin" | "teacher" | "student";
interface authuser {
  name?: string;
  id?: string;
  role: UserRole;
  email?: string;
}
interface authState{
  user: authuser | null,
  isAuthenticated :boolean
}

const initialState: authState = {
  user:null,
  isAuthenticated:false
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
       state.user = action.payload
        state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
       state.isAuthenticated = false
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
