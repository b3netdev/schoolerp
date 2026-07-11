import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type StreamStatus = "active" | "inactive";

export interface Stream {
    id: number;
    name: string;
    status: StreamStatus;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

interface StreamState {
    streams: Stream[];
}

const initialState: StreamState = {
    streams: [],
};

const streamSlice = createSlice({
    name: "stream",
    initialState,
    reducers: {
        setStreams: (state, action: PayloadAction<Stream[]>) => {
            state.streams = action.payload;
        },

        addStream: (state, action: PayloadAction<Stream>) => {
            state.streams.unshift(action.payload);
        },

        updateStream: (state, action: PayloadAction<Stream>) => {
            const index = state.streams.findIndex(
                (stream) => stream.id === action.payload.id
            );

            if (index !== -1) {
                state.streams[index] = action.payload;
            }
        },

        deleteStream: (state, action: PayloadAction<number>) => {
            state.streams = state.streams.filter(
                (stream) => stream.id !== action.payload
            );
        },
    },
});

export const {
    setStreams,
    addStream,
    updateStream,
    deleteStream,
} = streamSlice.actions;

export default streamSlice.reducer;