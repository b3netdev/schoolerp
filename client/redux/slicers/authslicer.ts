import { createSlice } from "@reduxjs/toolkit";

interface authuser {
  name?: string;
  id?: string;
  role?: string;
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
    },
    clearAuth: (state) => {
      state.user = null;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
