import { Navigate, Outlet, useParams } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
import useAuth from "@/hooks/useAuth";
import { useEffect } from "react";
import LoadingPage from "@/components/common/Loading";

type UserRole = "admin" | "teacher" | "student";

interface Props {
    allowedRoles: UserRole[];
    checkPortal?: boolean;
    children?: React.ReactNode;
}

const validRoles: UserRole[] = ["admin", "teacher", "student"];

const ProtectedRoute = ({
    allowedRoles,
    checkPortal = false,
    children,
}: Props) => {
    const { portal } = useParams();

    const user = useAppSelector((state) => state.auth.user);

    const { checkAuth, loading } = useAuth();

    useEffect(() => {
        const verifyAuth = async () => {
            if (!user) {
                await checkAuth();
            }
        };

        verifyAuth();
    }, [user]);

    if (loading) {
        return <LoadingPage />;
    }

    if (!user) {
        return <Navigate to="/admin/signin" replace />;
    }

    if (checkPortal) {
        if (!portal || !validRoles.includes(portal as UserRole)) {
            return <Navigate to={`/${user.role}/dashboard`} replace />;
        }


        if (portal !== user.role) {
            return <Navigate to={`/${user.role}/dashboard`} replace />;
        }
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to={`/${user.role}/dashboard`} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;