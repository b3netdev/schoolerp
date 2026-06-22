import { Navigate, Outlet } from "react-router-dom";

type UserRole =
    | "ADMIN"
    | "TEACHER"
    | "STUDENT";

interface Props {
    allowedRoles: UserRole[];
}

const ProtectedRoute = ({
    allowedRoles,
}: Props) => {
    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

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