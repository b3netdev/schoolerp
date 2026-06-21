import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ProtectedRoute from "./pages/ProtectedRoute";

import Home from "./pages/home/Home";
import AdminSignin from "./pages/admin/AdminSignin";

import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Parents from "./pages/Parents";
import Classes from "./pages/Classes";
import Attendance from "./pages/Attendance";
import Fees from "./pages/Fees";
import Exams from "./pages/Exams";
import MarksEntry from "./pages/MarksEntry";
import Marksheet from "./pages/Marksheet";
import Subjects from "./pages/Subjects";
import Timetable from "./pages/Timetable";
import NoticeBoard from "./pages/NoticeBoard";
import Settings from "./pages/Settings";
import { MainLayout } from "./components/layout/MainLayout";

const queryClient = new QueryClient();

function App() {
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem(
      "accessToken"
    );
  };

  return (
    <QueryClientProvider
      client={queryClient}
    >
      <BrowserRouter>
        <Routes>

          {/* Public */}
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/admin/signin"
            element={<AdminSignin />}
          />

          {/* Layout Route */}
          <Route
            element={
              <MainLayout
                onLogout={handleLogout}
              />
            }
          >

            {/* Everyone */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ADMIN",
                    "TEACHER",
                    "STUDENT",
                  ]}
                />
              }
            >
              <Route
                path="/dashboard"
                element={<Dashboard />}
              />

              <Route
                path="/subjects"
                element={<Subjects />}
              />

              <Route
                path="/timetable"
                element={<Timetable />}
              />
              <Route
                path="/students"
                element={<Students />}
              />
              <Route
                path="/classes"
                element={<Classes />}
              />
              <Route
                path="/exams"
                element={<Exams />}
              />
            </Route>

            {/* Admin + Teacher */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ADMIN",
                    "TEACHER",
                  ]}
                />
              }
            >
              <Route
                path="/attendance"
                element={<Attendance />}
              />

              <Route
                path="/marks-entry"
                element={<MarksEntry />}
              />
            </Route>

            {/* Admin Only */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={[
                    "ADMIN",
                  ]}
                />
              }
            >
              <Route
                path="/teachers"
                element={<Teachers />}
              />

              <Route
                path="/fees"
                element={<Fees />}
              />

              <Route
                path="/settings"
                element={<Settings />}
              />
            </Route>

          </Route>

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
export default App;