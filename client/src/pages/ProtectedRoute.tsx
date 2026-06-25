import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";
type UserRole =
    | "admin"
    | "teacher"
    | "student";

interface Props {
    allowedRoles: UserRole[];
}

const ProtectedRoute = ({
    allowedRoles,
}: Props) => {
    const user = useAppSelector(state=>state.auth.user)
  
    console.log(user)

    if (!user) {
        return (
            <Navigate to="/admin/signin" replace />
        );
    }

    if (
        !allowedRoles.includes(user.role)
    ) {
        return (
            <Navigate to="/dashboard"replace />
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;