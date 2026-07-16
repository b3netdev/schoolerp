import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useAppSelector } from "../../../redux/hooks";
import useAuth from "@/hooks/useAuth";


const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/academic-session": "Academic Session",
  "/students": "Students",
  "/teachers": "Teachers",
  "/parents": "Parents",
  "/classes": "Classes & Sections",
  "/subjects": "Subjects",
  "/attendance": "Attendance",
  "/fees": "Fees Management",
  "/exams": "Exams & Results",
  "/marks-entry": "Marks Entry",
  "/marksheet": "Marksheet Download",
  "/timetable": "Timetable",
  "/notices": "Notice Board",
  "/settings": "Settings",
};

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);
  const { user } = useAppSelector(state => state.auth)
  const { logOut } = useAuth()

  const location = useLocation();

  const navigate = useNavigate()
  const handleLogout = async () => {
    const data = await logOut()
    if (data) {
      navigate("/")
    }

  };
  const title =
    pageTitles[location.pathname] ||
    "EduAdmin";

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar
          onMenuClick={() =>
            setSidebarOpen(true)
          }
          pageTitle={title}
          onLogout={handleLogout}
          user={user}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}