import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ExamStatus = "draft" | "published" | "completed" | "cancelled";

export interface Exam {
  id: number;
  name: string;
  exam_type: string;
  class_id: number;
  class_name: string;
  academic_year_id: number;
  start_date: string;
  end_date: string;
  status: ExamStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ExamState {
  exams: Exam[];
}

const initialState: ExamState = { exams: [] };

const examSlice = createSlice({
  name: "exam",
  initialState,
  reducers: {
    setExams: (state, action: PayloadAction<Exam[]>) => {
      state.exams = action.payload;
    },
    addExam: (state, action: PayloadAction<Exam>) => {
      state.exams.unshift(action.payload);
    },
    updateExam: (state, action: PayloadAction<Exam>) => {
      const index = state.exams.findIndex((exam) => exam.id === action.payload.id);
      if (index === -1) state.exams.unshift(action.payload);
      else state.exams[index] = action.payload;
    },
    deleteExam: (state, action: PayloadAction<number>) => {
      state.exams = state.exams.filter((exam) => exam.id !== action.payload);
    },
    clearExams: (state) => {
      state.exams = [];
    },
  },
});

export const { setExams, addExam, updateExam, deleteExam, clearExams } = examSlice.actions;
export default examSlice.reducer;