import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";

declare module "axios" {
    export interface AxiosRequestConfig {
        skipErrorToast?: boolean;
        skipSuccessToast?: boolean;
        _retry?: boolean;
    }
}

/**
 * Separate axios instance for the student portal. It carries its own
 * cookies (student_authtoken / student_refreshtoken) and, unlike the admin
 * `api` instance, silently rotates the refresh token and retries the
 * original request once when the access token has expired — that's the
 * whole point of student_refresh_tokens existing.
 */
const studentApi = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 20000,
    withCredentials: true,
});

const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
    403: "You don't have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "This action conflicts with existing data.",
    422: "The submitted data is invalid.",
    500: "Something went wrong on our end. Please try again later.",
};

const MUTATING_METHODS = new Set(["post", "put", "patch", "delete"]);

// Only one refresh call in flight at a time; concurrent 401s share it.
let refreshPromise: Promise<boolean> | null = null;

const refreshSession = (): Promise<boolean> => {
    if (!refreshPromise) {
        refreshPromise = studentApi
            .post("/student-auth/refresh", null, { skipErrorToast: true })
            .then(() => true)
            .catch(() => false)
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

studentApi.interceptors.response.use(
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
    async (error: AxiosError<any>) => {
        const config = error.config as
            | (InternalAxiosRequestConfig & { skipErrorToast?: boolean; _retry?: boolean })
            | undefined;

        const status = error.response?.status;
        const isAuthEndpoint =
            config?.url?.includes("/student-auth/login") ||
            config?.url?.includes("/student-auth/refresh");

        if (status === 401 && config && !config._retry && !isAuthEndpoint) {
            config._retry = true;

            const refreshed = await refreshSession();

            if (refreshed) {
                return studentApi(config);
            }
        }

        if (error.config?.skipErrorToast) {
            return Promise.reject(error);
        }

        const backendMessage = error.response?.data?.message;

        const message =
            backendMessage ||
            (status && DEFAULT_STATUS_MESSAGES[status]) ||
            (status === 401 ? "Please sign in again." : null) ||
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

export default studentApi;
