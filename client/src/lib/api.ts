import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
} from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 20000,
    withCredentials: true,
});



api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error: AxiosError<any>) => {
        const status = error.response?.status;

        switch (status) {
            case 401:
                console.error("Unauthorized");
                break;

            case 403:
                console.error("Forbidden");
                break;

            case 404:
                console.error("Resource Not Found");
                break;

            case 500:
                console.error("Internal Server Error");
                break;

            default:
                console.error(
                    error.response?.data?.message ||
                    error.message
                );
        }

        return Promise.reject(error);
    }
);

export default api;