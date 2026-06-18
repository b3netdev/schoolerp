import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { MainLayout } from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Teachers from "@/pages/Teachers";
import Parents from "@/pages/Parents";
import Classes from "@/pages/Classes";
import Attendance from "@/pages/Attendance";
import Fees from "@/pages/Fees";
import Exams from "@/pages/Exams";
import MarksEntry from "@/pages/MarksEntry";
import Marksheet from "@/pages/Marksheet";
import Subjects from "@/pages/Subjects";
import Timetable from "@/pages/Timetable";
import NoticeBoard from "@/pages/NoticeBoard";
import Settings from "@/pages/Settings";
import Home from "@/pages/home/Home";

const queryClient = new QueryClient();

function AppRoutes({ onLogout }: { onLogout: () => void }) {
  return (
    <MainLayout onLogout={onLogout}>
      <Routes>
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/parents" element={<Parents />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/marks-entry" element={<MarksEntry />} />
        <Route path="/marksheet" element={<Marksheet />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/notices" element={<NoticeBoard />} />
        <Route path="/settings" element={<Settings />} />

        <Route
          path="*"
          element={
            <div className="flex h-64 items-center justify-center text-muted-foreground">
              Page not found
            </div>
          }
        />
      </Routes>
    </MainLayout>
  );
}

function App() {
  const [authed, setAuthed] = useState(() => {
    return localStorage.getItem("edu_auth") === "true";
  });

  const handleLogin = () => {
    localStorage.setItem("edu_auth", "true");
    setAuthed(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("edu_auth");
    setAuthed(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {!authed ? (
          <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        ) : (
          <AppRoutes onLogout={handleLogout} />
        )}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;