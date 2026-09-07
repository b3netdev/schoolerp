import { useEffect, useMemo, useState } from "react";

import {
  BookOpen,
  CalendarDays,
  Clock3,
  DoorOpen,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import api from "@/lib/api";

type Routine = {
  id: number;
  academic_year_id: number;
  class_id: number;
  class_name: string;
  section_id: number;
  section_name: string;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room_number?: string | null;
  remarks?: string | null;
};

type ApiResponse = {
  status?: string;
  data?: Routine[];
  message?: string;
};

const DAYS = [
  { id: 1, label: "Monday", shortLabel: "Mon" },
  { id: 2, label: "Tuesday", shortLabel: "Tue" },
  { id: 3, label: "Wednesday", shortLabel: "Wed" },
  { id: 4, label: "Thursday", shortLabel: "Thu" },
  { id: 5, label: "Friday", shortLabel: "Fri" },
  { id: 6, label: "Saturday", shortLabel: "Sat" },
] as const;

const formatTime = (time: string) => {
  const [hourText = "0", minuteText = "0"] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return time;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${String(minute).padStart(2, "0")} ${suffix}`;
};

const getCurrentSchoolDay = () => {
  const browserDay = new Date().getDay();

  // JavaScript: Sunday = 0, Monday = 1. Our database: Monday = 1.
  return browserDay >= 1 && browserDay <= 6 ? browserDay : 1;
};

const getApiErrorMessage = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return "Unable to load your routine. Please try again.";
};

export default function MyRoutine() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(getCurrentSchoolDay);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadRoutine = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await api.get<ApiResponse>("/routine/assigned-routine");
      setRoutines(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      setRoutines([]);
      setErrorMessage(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRoutine();
  }, []);

  const selectedDayInfo = DAYS.find((day) => day.id === selectedDay) ?? DAYS[0];

  const selectedDayRoutines = useMemo(
    () =>
      routines
        .filter((routine) => routine.day_of_week === selectedDay)
        .sort((first, second) => first.start_time.localeCompare(second.start_time)),
    [routines, selectedDay],
  );

  const assignedClasses = useMemo(() => {
    const assignments = new Map<string, Routine>();

    routines.forEach((routine) => {
      const key = `${routine.class_id}-${routine.section_id}-${routine.subject_id}`;
      assignments.set(key, routine);
    });

    return Array.from(assignments.values()).sort((first, second) => {
      const classCompare = first.class_name.localeCompare(second.class_name, undefined, {
        numeric: true,
      });

      return classCompare !== 0
        ? classCompare
        : first.section_name.localeCompare(second.section_name);
    });
  }, [routines]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2 text-indigo-100">
                <CalendarDays className="h-5 w-5" />
                <span className="text-sm font-medium">Teacher Portal</span>
              </div>
              <h1 className="text-2xl font-bold sm:text-3xl">My Class Routine</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                View your subject-wise class assignments and weekly teaching schedule.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadRoutine()}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh routine
            </button>
          </div>
        </section>

        {errorMessage ? (
          <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-slate-500">Subjects assigned</p>
                <p className="mt-0.5 text-2xl font-bold text-slate-900">
                  {assignedClasses.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
                <Clock3 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-slate-500">Periods this week</p>
                <p className="mt-0.5 text-2xl font-bold text-slate-900">
                  {routines.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-amber-50 p-3 text-amber-600">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm text-slate-500">Classes today</p>
                <p className="mt-0.5 text-2xl font-bold text-slate-900">
                  {routines.filter((routine) => routine.day_of_week === getCurrentSchoolDay()).length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Weekly routine</h2>
              <p className="mt-1 text-sm text-slate-500">
                Select a day to view your scheduled classes.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              {DAYS.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => setSelectedDay(day.id)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    selectedDay === day.id
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                  }`}
                >
                  <span className="sm:hidden">{day.shortLabel}</span>
                  <span className="hidden sm:inline">{day.label}</span>
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-slate-500">
              <LoaderCircle className="h-5 w-5 animate-spin text-indigo-600" />
              Loading your routine...
            </div>
          ) : selectedDayRoutines.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
              <div className="rounded-full bg-slate-100 p-4 text-slate-400">
                <CalendarDays className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-800">
                No classes on {selectedDayInfo.label}
              </h3>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                You do not have an assigned routine for this day yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-[760px] w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="rounded-l-lg px-4 py-3">Time</th>
                    <th className="px-4 py-3">Subject</th>
                    <th className="px-4 py-3">Class & section</th>
                    <th className="px-4 py-3">Room</th>
                    <th className="rounded-r-lg px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedDayRoutines.map((routine) => (
                    <tr key={routine.id} className="transition hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="font-semibold text-slate-800">
                          {formatTime(routine.start_time)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          until {formatTime(routine.end_time)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">{routine.subject_name}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700">
                          {routine.class_name} · Section {routine.section_name}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {routine.room_number ? (
                          <span className="inline-flex items-center gap-1.5">
                            <DoorOpen className="h-4 w-4 text-slate-400" />
                            {routine.room_number}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-sm text-slate-600">
                        {routine.remarks || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {!isLoading && assignedClasses.length > 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">My assigned subjects</h2>
            <p className="mt-1 text-sm text-slate-500">
              Subjects and class sections currently assigned to you.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assignedClasses.map((assignment) => (
                <article
                  key={`${assignment.class_id}-${assignment.section_id}-${assignment.subject_id}`}
                  className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/30"
                >
                  <p className="font-semibold text-slate-900">{assignment.subject_name}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {assignment.class_name} · Section {assignment.section_name}
                  </p>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
