import api from "@/lib/api";
import { useAppDispatch } from "../../redux/hooks";
import {
    setStreams,
    addStream,
    updateStream,
    deleteStream,
    type Stream,
    type StreamStatus,
} from "../../redux/slicers/stream.Slicer";

export interface StreamPayload {
    id?: number;
    name: string;
    status?: StreamStatus;
}
type StreamStatusFilter = "all" | "active" | "inactive";
const useStream = () => {
    const dispatch = useAppDispatch();

    const getStreams = async (status: StreamStatusFilter = "all") => {
        try {
            const result = await api.get("/stream/get-streams", {
                params: {
                    status,
                },
            });

            if (result?.data?.success) {
                dispatch(setStreams(result.data.data));
                return result.data.data;
            }
        } catch (error) {
            console.log(error);
        }
    };

    const addstream = async (payload: StreamPayload) => {
        try {
            const result = await api.post("/stream/add-stream", payload);

            if (result?.data?.success) {
                dispatch(addStream(result.data.data));
                return result.data.data as Stream;
            }
        } catch (error) {
            console.log(error);
        }
    };

    const updatestream = async (payload: StreamPayload) => {
        try {
            const result = await api.post("/stream/update-stream", payload);

            if (result?.data?.success) {
                dispatch(updateStream(result.data.data));
                return result.data.data as Stream;
            }
        } catch (error) {
            console.log(error);
        }
    };

    const deletestream = async (id: number) => {
        try {
            const result = await api.delete(`/stream/delete-stream/${id}`);

            if (result?.data?.success) {
                dispatch(deleteStream(id));
                return true;
            }
        } catch (error) {
            console.log(error);
        }
    };

    return {
        getStreams,
        addstream,
        updatestream,
        deletestream,
    };
};

export default useStream;