import { useEffect } from "react";
import useAuth from "@/hooks/useAuth";
import LoadingPage from "@/components/common/Loading";

const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
    const { checkAuth,  checkAuthLoading } = useAuth();


    useEffect(() => {
        checkAuth();
    }, []);

    if (checkAuthLoading) {
        return <LoadingPage />;
    }

    return <>{children}</>;
};

export default AuthInitializer;