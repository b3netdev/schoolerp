import axios, {
    AxiosError,
} from "axios";
import { toast } from "sonner";

declare module "axios" {
    export interface AxiosRequestConfig {
        /** Suppress the global error toast for this request (e.g. silent session checks). */
        skipErrorToast?: boolean;
        /** Suppress the global success toast for this request (e.g. background/search fetches). */
        skipSuccessToast?: boolean;
    }
}

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 20000,
    withCredentials: true,
});

const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
    401: "You are not authorized. Please sign in again.",
    403: "You don't have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "This action conflicts with existing data.",
    422: "The submitted data is invalid.",
    500: "Something went wrong on our end. Please try again later.",
};

// Methods that represent a mutation (add/update/delete). GET/HEAD/OPTIONS
// requests are reads and never trigger a success toast on their own.
const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

api.interceptors.response.use(
    (response) => {
        const method = response.config.method?.toLowerCase();
        const isMutation = method ? MUTATING_METHODS.has(method) : false;

        if (
            isMutation &&
            !response.config.skipSuccessToast &&
            response.data?.success &&
            response.data?.message
        ) {
            toast.success(response.data.message);
        }

        return response;
    },
    (error: AxiosError<any>) => {
        if (error.config?.skipErrorToast) {
            return Promise.reject(error);
        }

        const status = error.response?.status;
        const backendMessage = error.response?.data?.message;

        const message =
            backendMessage ||
            (status && DEFAULT_STATUS_MESSAGES[status]) ||
            (error.code === "ECONNABORTED"
                ? "Request timed out. Please try again."
                : null) ||
            (!error.response
                ? "Unable to reach the server. Please check your connection."
                : null) ||
            error.message ||
            "Something went wrong. Please try again.";

        toast.error(message);

        return Promise.reject(error);
    }
);

export default api;
