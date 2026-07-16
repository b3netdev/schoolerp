import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export interface AcademicSession {
  id: number;
  session_name: string;
  status: string;
  description: string;
}

interface AcademicSessionState {
  academicSessions: AcademicSession[];
}

const initialState: AcademicSessionState = {
  academicSessions: [],
};

const academicSessionSlice = createSlice({
  name: "academicSession",
  initialState,
    reducers: {
        addAcademicSession: (state, action: PayloadAction<AcademicSession>) => {
            state.academicSessions.unshift(action.payload);
        },

        updateAcademicSession: (state, action: PayloadAction<AcademicSession>) => {
            const index = state.academicSessions.findIndex(
                (session) => session.id === action.payload.id
            );
            if (index !== -1) {
                state.academicSessions[index] = action.payload;
            }
        },
        setAcademicSessions: (state, action: PayloadAction<AcademicSession[]>) => {
            state.academicSessions = action.payload;
        },
    },
});

export const { addAcademicSession, updateAcademicSession, setAcademicSessions } = academicSessionSlice.actions;
export default academicSessionSlice.reducer;