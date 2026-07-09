import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ClassSectionRelation {
  id: number;

  class_id: number;
  class_name: string;

  section_id: number;
  section_name: string;
  section_stream?: string | null;

  teacher_id: number;
  teacher_name: string;
  employee_code?: string | null;

  created_at?: string;
  updated_at?: string;
}

interface ClassSectionRelationState {
  classSectionRelations: ClassSectionRelation[];
}

const initialState: ClassSectionRelationState = {
  classSectionRelations: [],
};

const classSectionRelationSlice = createSlice({
  name: "classSectionRelation",
  initialState,
  reducers: {
    setClassSectionRelations: (
      state,
      action: PayloadAction<ClassSectionRelation[]>
    ) => {
      state.classSectionRelations = action.payload;
    },

    addClassSectionRelation: (
      state,
      action: PayloadAction<ClassSectionRelation>
    ) => {
      state.classSectionRelations.unshift(action.payload);
    },

    updateClassSectionRelation: (
      state,
      action: PayloadAction<ClassSectionRelation>
    ) => {
      const index = state.classSectionRelations.findIndex(
        (item) => item.id === action.payload.id
      );

      if (index !== -1) {
        state.classSectionRelations[index] = action.payload;
      }
    },

    deleteClassSectionRelation: (state, action: PayloadAction<number>) => {
      state.classSectionRelations = state.classSectionRelations.filter(
        (item) => item.id !== action.payload
      );
    },
  },
});

export const {
  setClassSectionRelations,
  addClassSectionRelation,
  updateClassSectionRelation,
  deleteClassSectionRelation,
} = classSectionRelationSlice.actions;

export default classSectionRelationSlice.reducer;