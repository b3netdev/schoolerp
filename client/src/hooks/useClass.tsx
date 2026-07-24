import api from "@/lib/api";
import { useAppDispatch } from "../../redux/hooks";
import {
    setClasses,
    addClass,
    updateClass,
    deleteClass,
} from "../../redux/slicers/classesSlicer";

interface AddClassPayload {
    id?: number;
    class_name: string;
    status?: string;
    description: string;
}

const useClass = () => {
    const dispatch = useAppDispatch();

    const getClasses = async (status: string = "all") => {
        try {
            const result = await api.get(`/class/get-classes?status=${status}`);

            if (result?.data?.success) {
                dispatch(setClasses(result.data.data));
            }
        } catch (error) {
            console.log(error);
        }
    };

    const addclass = async (payload: AddClassPayload) => {
        try {
            const result = await api.post("/class/add-class", payload);

            if (result?.data?.success) {
                dispatch(addClass(result.data.data));
            }
        } catch (error) {
            console.log(error);
        }
    };

    const updateclass = async (payload: AddClassPayload) => {
        try {
            const result = await api.post("/class/update-class", payload);

            if (result?.data?.success) {
                dispatch(updateClass(result.data.data));
            }
        } catch (error) {
            console.log(error);
        }
    };

    const deleteclass = async (id: number) => {
        try {
            const result = await api.delete(`/class/delete-class/${id}`);

            if (result?.data?.success) {
                dispatch(deleteClass(id));
            }
        } catch (error) {
            console.log(error);
        }
    };

    const restoreclass = async (id: number) => {
        try {
            const result = await api.patch(`/class/restore-class/${id}`);

            if (result?.data?.success) {
                dispatch(updateClass(result.data.data));
            }
        } catch (error) {
            console.log(error);
        }
    };

    const hardDeleteclass = async (id: number) => {
        try {
            const result = await api.delete(`/class/hard-delete-class/${id}`);

            if (result?.data?.success) {
                dispatch(deleteClass(id));
            }
        } catch (error) {
            console.log(error);
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

export default useClass;