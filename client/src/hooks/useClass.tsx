import api from "@/lib/api";
import { useAppDispatch } from "../../redux/hooks";
import {
    setClasses,
    addClass,
    updateClass,
} from "../../redux/slicers/classesSlicer";

interface AddClassPayload {
    id?: number;
    class_name: string;
    status?: string;
    description: string;
}

const useClass = () => {
    const dispatch = useAppDispatch();

    const getClasses = async () => {
        try {
            const result = await api.get("/class/get-classes");

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

    return {
        getClasses,
        addclass,
        updateclass,
    };
};

export default useClass;