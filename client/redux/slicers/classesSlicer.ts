import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Class {
    id: number;
    class_name: string;
    status: string;
    description: string;
}

interface ClassState {
    classes: Class[];
}

const initialState: ClassState = {
    classes: [],
};

const classSlice = createSlice({
    name: "class",
    initialState,
    reducers: {
        addClass: (state, action: PayloadAction<Class>) => {
            state.classes.unshift(action.payload);
        },

        updateClass: (state, action: PayloadAction<Class>) => {
            console.log(action.payload, "Inside class redux");

            const index = state.classes.findIndex(
                (classItem) => classItem.id === action.payload.id
            );

            if (index !== -1) {
                state.classes[index] = action.payload;
            }
        },

        deleteClass: (state, action: PayloadAction<number>) => {
            state.classes = state.classes.filter(
                (classItem) => classItem.id !== action.payload
            );
        },

        setClasses: (state, action: PayloadAction<Class[]>) => {
            state.classes = action.payload;
        },
    },
});

export const {
    addClass,
    updateClass,
    deleteClass,
    setClasses,
} = classSlice.actions;

export default classSlice.reducer;