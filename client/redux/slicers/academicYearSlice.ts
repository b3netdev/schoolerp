import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AcademicYear {
  id: number;
  name: string;
  start_date?: string;
  end_date?: string;
  status?: string;
}

interface AcademicYearState {
  selectedAcademicYear: AcademicYear | null;
}

const initialState: AcademicYearState = {
  selectedAcademicYear: null,
};

const academicYearSlice = createSlice({
  name: "academicYear",
  initialState,
  reducers: {
    setAcademicYear: (
      state,
      action: PayloadAction<AcademicYear | null>,
    ) => {
      state.selectedAcademicYear = action.payload;
    },
  },
});

export const { setAcademicYear } = academicYearSlice.actions;

export default academicYearSlice.reducer;