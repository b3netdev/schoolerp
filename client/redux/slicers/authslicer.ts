import { createSlice } from "@reduxjs/toolkit";

interface user {
  name?: string;
  id?: string;
  role?: string;
  email?: string;
}

const initialState: user = {
  name: "",
  email: "",
  id: "",
  role: "",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action) => {
       return action.payload;
    },
    clearAuth: (state) => {
      state = {};
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
