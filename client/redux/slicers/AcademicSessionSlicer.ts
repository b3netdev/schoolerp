import { createSlice, PayloadAction } from "@reduxjs/toolkit";
export interface AcademicSession {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
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
        AcademicSessionDelete: (state, action: PayloadAction<number>) => {
            state.academicSessions = state.academicSessions.filter(
                (session) => session.id !== action.payload
            );
        },
        AcademicSessionRestore: (state, action: PayloadAction<number>) => {
            state.academicSessions = state.academicSessions.filter(
                (session) => session.id !== action.payload
            );
        },
        AcademicSessionPermanentDelete: (state, action: PayloadAction<number>) => {
            state.academicSessions = state.academicSessions.filter(
                (session) => session.id !== action.payload
            );
        }
    },
});

export const { addAcademicSession, updateAcademicSession, setAcademicSessions, AcademicSessionDelete, AcademicSessionRestore, AcademicSessionPermanentDelete } = academicSessionSlice.actions;
export default academicSessionSlice.reducer;