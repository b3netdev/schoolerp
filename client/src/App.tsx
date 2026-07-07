import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ProtectedRoute from "./pages/ProtectedRoute";

import Home from "./pages/home/Home";
import AdminSignin from "./pages/admin/AdminSignin";

import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Parents from "./pages/Parents";
import Section from "./pages/Section";
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
import NotFound from "./pages/NotFound";
import { Provider } from "react-redux";
import { store } from "../redux/store";
import AuthInitializer from "./components/common/AuthInitializer";
import ComingSoon from "./components/common/ommingSoon";

const queryClient = new QueryClient();

function App() {


  return (
    <Provider store={store}>
      <QueryClientProvider
        client={queryClient}
      >
        <AuthInitializer>

          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/admin/signin" element={<AdminSignin />} />

              {/* Role based protected area */}
              <Route
                path="/:portal"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "teacher", "student"]}
                    checkPortal={true}
                  >
                    <MainLayout />
                  </ProtectedRoute>
                }
              >

                <Route index element={<Navigate to="dashboard" replace />} />

                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={["admin", "teacher", "student"]}
                    />
                  }
                >
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="subjects" element={<ComingSoon />} />
                  <Route path="timetable" element={<ComingSoon />} />
                  <Route path="marksheet" element={<ComingSoon />} />
                </Route>

                <Route
                  element={
                    <ProtectedRoute allowedRoles={["teacher", "admin"]} />
                  }
                >
                  <Route path="classes" element={<Classes />} />
                  <Route path="exams" element={<ComingSoon />} />
                  <Route path="attendance" element={<ComingSoon />} />
                  <Route path="marks-entry" element={<ComingSoon />} />
                  <Route path="notices" element={<ComingSoon />} />
                </Route>

                <Route
                  element={<ProtectedRoute allowedRoles={["admin"]} />}
                >
                  <Route path="students" element={<ComingSoon />} />
                  <Route path="teachers" element={<Teachers />} />
                  <Route path="fees" element={<ComingSoon />} />
                  <Route path="section" element={<Section />} />
                  <Route path="class-section" element={<ComingSoon />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthInitializer>
      </QueryClientProvider>
    </Provider>
  );
}
export default App;