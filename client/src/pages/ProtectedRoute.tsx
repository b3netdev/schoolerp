import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import useAuth from "@/hooks/useAuth";
import { useEffect, } from "react";
import LoadingPage from "@/components/common/Loading";
type UserRole = "admin" | "teacher" | "student";

interface Props {
    allowedRoles: UserRole[];
}

const ProtectedRoute = ({ allowedRoles }: Props) => {
    const user = useAppSelector((state) => state.auth.user);
    const { checkAuth, loading } = useAuth();

    useEffect(() => {
        const verifyAuth = async () => {
            console.log("CALLING",2)
            if (!user) {
                await checkAuth();
            }
        };
         console.log("CALLING",1)

        verifyAuth();
    }, [user]);

    if (loading) {
        return <LoadingPage />;
    }

    if (!user) {
        return <Navigate to="/admin/signin" replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;