import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ExamStatus =
  | "draft"
  | "published"
  | "completed"
  | "cancelled";

/** Exam data returned by the backend API. */
export interface Exam {
  id: number;
  name: string;
  exam_type: string;
  academic_year_id: number;
  start_date: string;
  end_date: string;
  status: ExamStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface ExamsState {
  exams: Exam[];
}

const initialState: ExamsState = {
  exams: [],
};

const examsSlice = createSlice({
  name: "exams",
  initialState,
  reducers: {
   
    setExams: (state, action: PayloadAction<Exam[]>) => {
      state.exams = action.payload;
    },

    
    addExam: (state, action: PayloadAction<Exam>) => {
      state.exams.unshift(action.payload);
    },

   
    updateExam: (state, action: PayloadAction<Exam>) => {
      const index = state.exams.findIndex(
        (exam) => exam.id === action.payload.id,
      );

      if (index === -1) {
        state.exams.unshift(action.payload);
        return;
      }

      state.exams[index] = action.payload;
    },

    
    deleteExam: (state, action: PayloadAction<number>) => {
      state.exams = state.exams.filter(
        (exam) => exam.id !== action.payload,
      );
    },

    
    clearExams: (state) => {
      state.exams = [];
    },
  },
});

export const {
  setExams,
  addExam,
  updateExam,
  deleteExam,
  clearExams,
} = examsSlice.actions;

export default examsSlice.reducer;