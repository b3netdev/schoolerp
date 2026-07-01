import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Setting {
    id?: number;
    name: string;
    setting_group: string;
    key?: string;
    type: string;
    value: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
}

interface SettingsState {
    settings: Setting[];
}

const initialState: SettingsState = {
    settings: [],
};

const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        // For GET settings API
        setSettings: (state, action: PayloadAction<Setting[]>) => {
            state.settings = action.payload;
        },

        // For ADD / UPDATE settings API
        updateSettings: (
            state,
            action: PayloadAction<Setting | Setting[]>
        ) => {
            const updatedSettings = Array.isArray(action.payload)
                ? action.payload
                : [action.payload];

            updatedSettings.forEach((updatedSetting) => {
                const existingIndex = state.settings.findIndex(
                    (setting) =>
                        setting.key === updatedSetting.key ||
                        setting.id === updatedSetting.id
                );

                if (existingIndex !== -1) {
                    state.settings[existingIndex] = updatedSetting;
                } else {
                    state.settings.unshift(updatedSetting);
                }
            });
        },
    },
});

export const { setSettings, updateSettings } = settingsSlice.actions;

export default settingsSlice.reducer;