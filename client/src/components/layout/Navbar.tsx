import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Bell,
  ChevronDown,
  LogOut,
  User,
  Settings,
  CalendarDays,
} from "lucide-react";

import { Avatar } from "@/components/common/Avatar";


import api from "@/lib/api";
import { AcademicYear, setAcademicYear } from "../../../redux/slicers/academicYearSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/hooks";
import { setAuth } from "../../../redux/slicers/authslicer";

// Add your API class import here.
// Example:
// import api from "@/services/api";

interface NavbarUser {
  name?: string;
  email?: string;
  role?: string;
  academic_year_id?: number;
  default_academic_session?: string;
}

interface NavbarProps {
  onMenuClick: () => void;
  pageTitle: string;
  onLogout: () => void;
  user?: NavbarUser | null;
}

export function Navbar({
  onMenuClick,
  pageTitle,
  onLogout,
  user,
}: NavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const selectedAcademicYear = useAppSelector(
    (state: any) => state.academicYear.selectedAcademicYear,
  );

  const portal = user?.role || "admin";
  const displayName = user?.name || "Admin";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    const fetchAcademicSessions = async () => {
      try {
        setLoadingSessions(true);

        // Replace "api" with the name of your imported API class.
        const response = await api.get(
          "/academic-session/get-academic-sessions",
        );

        const sessions: AcademicYear[] = response.data?.data || [];

        setAcademicYears(sessions);

        // Set the session from logged-in user data as default.
        if (user?.academic_year_id) {
          const currentSession = sessions.find(
            (session) => Number(session.id) === Number(user.academic_year_id),
          );

          if (currentSession) {
            dispatch(setAcademicYear(currentSession));
          }


        }
      } catch (error) {
        console.error("Academic session fetch error:", error);
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchAcademicSessions();
  }, [dispatch, user?.academic_year_id]);

  const handleAcademicYearChange = async (academicYearId: number) => {
    const selectedSession =
      academicYears.find(
        (session) => Number(session.id) === Number(academicYearId),
      ) || null;

    console.log(selectedSession, "SELECETED SESSION")
    const data = await api.post("/auth/switch-academic-session", {
      academic_session_id: selectedSession?.id,
    });

    if (data?.data?.success == true) {
      dispatch(setAuth(data.data.data))
       navigate(`/${data.data. data.role}/dashboard`);
    }

    dispatch(setAcademicYear(selectedSession));
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-4 sticky top-0 z-10">
      <button
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        data-testid="navbar-menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="hidden lg:block">
        <h1 className="text-sm font-semibold text-foreground">
          {pageTitle}
        </h1>
      </div>

      <div className="flex-1 max-w-xs mx-auto lg:mx-0 lg:ml-4">
        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />

          <select
            value={selectedAcademicYear?.id || ""}
            onChange={(event) =>
              handleAcademicYearChange(Number(event.target.value))
            }
            disabled={loadingSessions}
            className="w-full h-9 pl-9 pr-8 bg-muted border-0 rounded-lg text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed"
            data-testid="academic-year-dropdown"
          >
            <option value="" disabled>
              {loadingSessions ? "Loading sessions..." : "Select session"}
            </option>

            {academicYears.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </select>

          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          data-testid="navbar-notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-card" />
        </button>

        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-muted transition-colors"
            data-testid="navbar-profile"
          >
            <Avatar initials={initials} name={displayName} size="sm" />

            <span className="hidden sm:block text-sm font-medium text-foreground">
              {displayName}
            </span>

            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileOpen(false)}
              />

              <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-border rounded-xl shadow-lg z-20 py-1">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">
                    {displayName}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {user?.email || ""}
                  </p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      navigate(`/${portal}/profile`);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                    data-testid="navbar-profile-link"
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    My Profile
                  </button>

                  {portal === "admin" && (
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate(`/${portal}/settings`);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                      data-testid="navbar-settings-link"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      Settings
                    </button>
                  )}
                </div>

                <div className="border-t border-border py-1">
                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    data-testid="logout-btn"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}