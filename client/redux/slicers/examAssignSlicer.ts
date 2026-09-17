import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ExamAssignFilter = "all" | "trash";

export interface ExamAssignment {
  id: number;
  teacher_id: number;
  teacher_name?: string | null;
  employee_code?: string | null;
  exam_id: number;
  exam_name?: string | null;
  subject_id: number;
  subject_name?: string | null;
  assign_till?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

interface ExamAssignState {
  assignmentsByFilter: Record<ExamAssignFilter, ExamAssignment[]>;
  loadedFilters: Record<ExamAssignFilter, boolean>;
}

const initialState: ExamAssignState = {
  assignmentsByFilter: {
    all: [],
    trash: [],
  },
  loadedFilters: {
    all: false,
    trash: false,
  },
};

const upsertAssignment = (
  assignments: ExamAssignment[],
  nextAssignment: ExamAssignment,
) => {
  const index = assignments.findIndex(
    (assignment) => assignment.id === nextAssignment.id,
  );

  if (index === -1) {
    assignments.unshift(nextAssignment);
    return assignments;
  }

  assignments[index] = nextAssignment;
  return assignments;
};

const examAssignSlice = createSlice({
  name: "examAssign",
  initialState,
  reducers: {
    setExamAssignments: (
      state,
      action: PayloadAction<{
        filter: ExamAssignFilter;
        assignments: ExamAssignment[];
      }>,
    ) => {
      state.assignmentsByFilter[action.payload.filter] = action.payload.assignments;
      state.loadedFilters[action.payload.filter] = true;
    },

    upsertExamAssignment: (state, action: PayloadAction<ExamAssignment>) => {
      const nextAssignment = action.payload;

      if (nextAssignment.deleted_at) {
        state.assignmentsByFilter.all = state.assignmentsByFilter.all.filter(
          (assignment) => assignment.id !== nextAssignment.id,
        );

        if (state.loadedFilters.trash) {
          state.assignmentsByFilter.trash = upsertAssignment(
            [...state.assignmentsByFilter.trash],
            nextAssignment,
          );
        }

        return;
      }

      state.assignmentsByFilter.trash = state.assignmentsByFilter.trash.filter(
        (assignment) => assignment.id !== nextAssignment.id,
      );

      if (state.loadedFilters.all) {
        state.assignmentsByFilter.all = upsertAssignment(
          [...state.assignmentsByFilter.all],
          nextAssignment,
        );
      }
    },

    removeExamAssignment: (state, action: PayloadAction<number>) => {
      state.assignmentsByFilter.all = state.assignmentsByFilter.all.filter(
        (assignment) => assignment.id !== action.payload,
      );
      state.assignmentsByFilter.trash = state.assignmentsByFilter.trash.filter(
        (assignment) => assignment.id !== action.payload,
      );
    },

    resetExamAssignments: (state) => {
      state.assignmentsByFilter = {
        all: [],
        trash: [],
      };
      state.loadedFilters = {
        all: false,
        trash: false,
      };
    },
  },
});

export const {
  setExamAssignments,
  upsertExamAssignment,
  removeExamAssignment,
  resetExamAssignments,
} = examAssignSlice.actions;

export default examAssignSlice.reducer;