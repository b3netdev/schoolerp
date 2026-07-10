import { useState } from "react";
import api from "../lib/api";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
    setSettings,
    updateSettings,
    type Setting,
} from "../../redux/slicers/settingsSlicer"

export type SettingsPayload = {
    name: string;
    setting_group: string;
    type: string;
    value: string;
    key?: string;
};

const useSettings = () => {
    const dispatch = useAppDispatch();

    const { settings } = useAppSelector((state) => state.settings);

    const [loading, setLoading] = useState<boolean>(false);
    const [getLoading, setGetLoading] = useState<boolean>(false);
    const [updateLoading, setUpdateLoading] = useState<boolean>(false);
    const [error, setError] = useState<any>(null);

    const getSettings = async () => {
        setLoading(true);
        setGetLoading(true);
        setError(null);

        try {
            const response = await api.get("/settings");

            if (response?.data?.success === true) {
                dispatch(setSettings(response.data.data));
                return response.data.data as Setting[];
            }

            return [];
        } catch (error) {
            setError(error);
            return [];
        } finally {
            setLoading(false);
            setGetLoading(false);
        }
    };

    const updateSettingsData = async (
        payload: SettingsPayload | SettingsPayload[]
    ) => {
        setLoading(true);
        setUpdateLoading(true);
        setError(null);

        try {
            const response = await api.post("/settings/update-settings", payload);

            if (response?.data?.success === true) {
                dispatch(updateSettings(response.data.data));
                return response.data.data;
            }

            return null;
        } catch (error) {
            setError(error);
            return null;
        } finally {
            setLoading(false);
            setUpdateLoading(false);
        }
    };


    const searchSettingsOptions = async (key: string) => {
        setLoading(true);
        setUpdateLoading(true);
        setError(null);
        try {
            const response = await api.post("/settings/getBykey", { key });
            if (response?.data?.success === true) {

                return response?.data?.data
            }
        }
        catch (error) {

        }
    }

    return {
        settings,
        loading,
        getLoading,
        updateLoading,
        error,
        getSettings,
        updateSettingsData,
        searchSettingsOptions
    };
};

export default useSettings;