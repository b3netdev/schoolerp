import api from "@/lib/api";

import { useAppDispatch } from "../../redux/hooks";
import {
    addClass,
    deleteClass,
    setClasses,
    updateClass,
} from "../../redux/slicers/classesSlicer";

export interface ClassSectionPayload {
    /** Send id only for an already existing section. */
    id?: number;
    /** Required when creating a new section. */
    name?: string;
    display_order?: number | null;
    description?: string | null;
}

export interface AddClassPayload {
    class_name: string;
    status?: string;
    description: string;
    display_order?: number | null;
    sections?: ClassSectionPayload[];
}

export interface UpdateClassPayload extends AddClassPayload {
    id: number;
}

const useClass = () => {
    const dispatch = useAppDispatch();

    const getClasses = async (status = "all"): Promise<boolean> => {
        try {
            const result = await api.get("/class/get-classes", {
                params: { status },
            });

            if (result?.data?.success) {
                dispatch(setClasses(result.data.data));
                return true;
            }

            return false;
        } catch (error) {
            console.error("Get classes error:", error);
            return false;
        }
    };

    const addclass = async (
        payload: AddClassPayload,
    ): Promise<boolean> => {
        try {
            const result = await api.post("/class/add-class", payload);

            if (result?.data?.success) {
                dispatch(addClass(result.data.data));
                return true;
            }

            return false;
        } catch (error) {
            console.error("Add class error:", error);
            return false;
        }
    };

    const updateclass = async (
        payload: UpdateClassPayload,
    ): Promise<boolean> => {
        try {
            const { id, ...updateData } = payload;

            const result = await api.post(
                `/class/update-class/${id}`,
                updateData,
            );

            if (result?.data?.success) {
                dispatch(updateClass(result.data.data));
                return true;
            }

            return false;
        } catch (error) {
            console.error("Update class error:", error);
            return false;
        }
    };

    const deleteclass = async (id: number): Promise<boolean> => {
        try {
            const result = await api.delete(`/class/delete-class/${id}`);

            if (result?.data?.success) {
                dispatch(deleteClass(id));
                return true;
            }

            return false;
        } catch (error) {
            console.error("Delete class error:", error);
            return false;
        }
    };

    const restoreclass = async (id: number): Promise<boolean> => {
        try {
            const result = await api.patch(`/class/restore-class/${id}`);

            if (result?.data?.success) {
                dispatch(updateClass(result.data.data));
                return true;
            }

            return false;
        } catch (error) {
            console.error("Restore class error:", error);
            return false;
        }
    };

    const hardDeleteclass = async (id: number): Promise<boolean> => {
        try {
            const result = await api.delete(`/class/hard-delete-class/${id}`);

            if (result?.data?.success) {
                dispatch(deleteClass(id));
                return true;
            }

            return false;
        } catch (error) {
            console.error("Permanent delete class error:", error);
            return false;
        }
    };

    return {
        getClasses,
        addclass,
        updateclass,
        deleteclass,
        restoreclass,
        hardDeleteclass,
    };
};

export default useClass