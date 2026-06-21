import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface MainLayoutProps {
  onLogout: () => void;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
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

export function MainLayout({
  onLogout,
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const location = useLocation();

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
          onLogout={onLogout}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}