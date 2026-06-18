import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient();

function Router({ onLogout }: { onLogout: () => void }) {
  return (
    <MainLayout onLogout={onLogout}>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/teachers" component={Teachers} />
        <Route path="/parents" component={Parents} />
        <Route path="/classes" component={Classes} />
        <Route path="/subjects" component={Subjects} />
        <Route path="/attendance" component={Attendance} />
        <Route path="/fees" component={Fees} />
        <Route path="/exams" component={Exams} />
        <Route path="/marks-entry" component={MarksEntry} />
        <Route path="/marksheet" component={Marksheet} />
        <Route path="/timetable" component={Timetable} />
        <Route path="/notices" component={NoticeBoard} />
        <Route path="/settings" component={Settings} />
        <Route>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Page not found
          </div>
        </Route>
      </Switch>
    </MainLayout>
  );
}

function App() {
  const [authed, setAuthed] = useState(() => !!localStorage.getItem("edu_auth"));

  const handleLogin = () => setAuthed(true);
  const handleLogout = () => {
    localStorage.removeItem("edu_auth");
    setAuthed(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      {!authed ? (
        <Login onLogin={handleLogin} />
      ) : (
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router onLogout={handleLogout} />
        </WouterRouter>
      )}
    </QueryClientProvider>
  );
}

export default App;
