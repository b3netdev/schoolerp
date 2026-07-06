import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Section {
  id: number;
  name: string;
  stream: string;
  description: string
}

interface SectionState {
  sections: Section[];
}

const initialState: SectionState = {
  sections: [

  ],
};

const sectionSlice = createSlice({
  name: "section",
  initialState,
  reducers: {
    addSection: (state, action: PayloadAction<Omit<Section, "id">>) => {
      const newSection: Section = {
        id: Date.now(),
        name: action.payload.name,
        stream: action.payload.stream,
        description: action.payload.description
      };

      state.sections.unshift(newSection);
    },

    updateSection: (state, action: PayloadAction<Section>) => {
      console.log(action.payload, "Inside redux")
      const index = state.sections.findIndex(
        (section) => section.id === action.payload.id
      );

      if (index !== -1) {
        state.sections[index] = action.payload;
      }
    },

    deleteSection: (state, action: PayloadAction<number>) => {
      state.sections = state.sections.filter(
        (section) => section.id !== action.payload
      );
    },

    setSections: (state, action: PayloadAction<Section[]>) => {
      state.sections = action.payload;
    },
  },
});

export const {
  addSection,
  updateSection,
  deleteSection,
  setSections,
} = sectionSlice.actions;

export default sectionSlice.reducer;