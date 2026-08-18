import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Users,
  XCircle,
} from "lucide-react";

import api from "@/lib/api";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import useClassSection from "@/hooks/useClassSection";
import useStudent from "@/hooks/useStudent";
import { useAppSelector } from "../../redux/hooks";

const ATTENDANCE_API = "/student-attendence";

type AttendanceStatus = "present" | "absent";
type AttendanceMap = Record<number, AttendanceStatus>;

type StudentRecord = {
  id: number | string;
  student_code?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  status?: string | null;
  deleted_at?: string | null;
  class_section_id?: number | string | null;
  class_name?: string | null;
  section_name?: string | null;
  roll_number?: string | number | null;
  admission_number?: string | null;
  meta?: Record<string, unknown> | null;
};

type ClassSectionRecord = {
  id: number | string;
  class_id?: number | string | null;
  class_name?: string | null;
  section_id?: number | string | null;
  section_name?: string | null;
  section_stream?: string | null;
  deleted_at?: string | null;
};

type ExistingAttendance = {
  student_id: number;
  attended: AttendanceStatus;
};

type ApiErrorLike = {
  message?: unknown;
  response?: {
    data?: {
      message?: unknown;
    };
  };
};

type SummaryTone = "default" | "success" | "danger" | "warning";

type SummaryCardProps = {
  icon: ReactNode;
  label: string;
  value: number | string;
  hint: string;
  tone?: SummaryTone;
};

const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toPositiveInteger = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  const apiError = error as ApiErrorLike;
  const responseMessage = apiError.response?.data?.message;

  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if (typeof apiError.message === "string" && apiError.message.trim()) {
    return apiError.message;
  }

  return fallback;
};

const getStudentName = (student: StudentRecord): string => {
  const fullName = [student.first_name, student.last_name]
    .filter(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    )
    .join(" ")
    .trim();

  return fullName || `Student #${String(student.id)}`;
};

const getClassSectionName = (relation: ClassSectionRecord): string => {
  const className = relation.class_name?.trim() || "Class";
  const sectionName = relation.section_name?.trim() || "";
  const stream = relation.section_stream?.trim() || "";

  if (!sectionName) return className;

  return `${className} - ${sectionName}${stream ? ` (${stream})` : ""}`;
};

const getStudentRoll = (student: StudentRecord): string => {
  if (student.roll_number !== undefined && student.roll_number !== null) {
    return String(student.roll_number);
  }

  const metaRoll = student.meta?.roll_number;
  if (typeof metaRoll === "string" || typeof metaRoll === "number") {
    return String(metaRoll);
  }

  return "-";
};

const normalizeAttendanceRows = (responseData: unknown): ExistingAttendance[] => {
  let payload: unknown = responseData;

  if (isRecord(payload) && "data" in payload) {
    payload = payload.data;
  }

  if (!Array.isArray(payload)) return [];

  return payload.flatMap((item): ExistingAttendance[] => {
    if (!isRecord(item)) return [];

    const studentId = toPositiveInteger(item.student_id);
    const attended = item.attended;

    if (
      !studentId ||
      (attended !== "present" && attended !== "absent")
    ) {
      return [];
    }

    return [{ student_id: studentId, attended }];
  });
};

const summaryToneClasses: Record<SummaryTone, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function SummaryCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${summaryToneClasses[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function EmptyPanel({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export default function Attendance() {
  const classSectionState = useAppSelector(
    (state) => state.classSection.classSectionRelations,
  );
  const studentState = useAppSelector((state) => state.student.students);

  const classSectionRelations =
    classSectionState as unknown as ClassSectionRecord[];
  const students = studentState as unknown as StudentRecord[];

  const { getClassSections } = useClassSection();
  const { getStudents } = useStudent();

  const today = useMemo(() => formatDateForInput(new Date()), []);

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedClassSectionId, setSelectedClassSectionId] = useState("");
  const [search, setSearch] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<AttendanceMap>({});

  const [initialLoading, setInitialLoading] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [hasExistingAttendance, setHasExistingAttendance] = useState(false);

  const attendanceRequestVersion = useRef(0);

  useEffect(() => {
    let mounted = true;

    const loadInitialData = async (): Promise<void> => {
      try {
        setInitialLoading(true);
        setErrorMessage("");

        await Promise.all([
          getClassSections("all"),
          getStudents("active"),
        ]);
      } catch (error: unknown) {
        console.error("Failed to load attendance dependencies:", error);

        if (mounted) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Unable to load classes or students.",
            ),
          );
        }
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };

    void loadInitialData();

    return () => {
      mounted = false;
    };
    // Hook methods are intentionally called once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeClassSections = useMemo(() => {
    return classSectionRelations
      .filter((relation) => !relation.deleted_at)
      .sort((a, b) =>
        getClassSectionName(a).localeCompare(getClassSectionName(b), undefined, {
          numeric: true,
        }),
      );
  }, [classSectionRelations]);

  const classStudents = useMemo(() => {
    const classSectionId = toPositiveInteger(selectedClassSectionId);
    if (!classSectionId) return [];

    return students
      .filter((student) => {
        const studentClassSectionId = toPositiveInteger(student.class_section_id);
        return (
          studentClassSectionId === classSectionId &&
          student.status !== "inactive" &&
          !student.deleted_at
        );
      })
      .sort((a, b) => {
        const rollA = Number(getStudentRoll(a));
        const rollB = Number(getStudentRoll(b));

        if (
          Number.isFinite(rollA) &&
          Number.isFinite(rollB) &&
          rollA !== rollB
        ) {
          return rollA - rollB;
        }

        return getStudentName(a).localeCompare(getStudentName(b));
      });
  }, [students, selectedClassSectionId]);

  const filteredStudents = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return classStudents;

    return classStudents.filter((student) => {
      const searchable = [
        getStudentName(student),
        student.student_code,
        student.admission_number,
        getStudentRoll(student),
      ]
        .filter((value) => value !== undefined && value !== null)
        .join(" ")
        .toLowerCase();

      return searchable.includes(keyword);
    });
  }, [classStudents, search]);

  const presentCount = useMemo(
    () =>
      classStudents.filter((student) => {
        const id = toPositiveInteger(student.id);
        return id ? attendanceMap[id] === "present" : false;
      }).length,
    [classStudents, attendanceMap],
  );

  const absentCount = useMemo(
    () =>
      classStudents.filter((student) => {
        const id = toPositiveInteger(student.id);
        return id ? attendanceMap[id] === "absent" : false;
      }).length,
    [classStudents, attendanceMap],
  );

  const markedCount = presentCount + absentCount;
  const notMarkedCount = Math.max(0, classStudents.length - markedCount);
  const attendancePercentage =
    classStudents.length > 0
      ? Math.round((presentCount / classStudents.length) * 100)
      : 0;

  const loadExistingAttendance = useCallback(async (): Promise<void> => {
    const classSectionId = toPositiveInteger(selectedClassSectionId);
    if (!classSectionId || !selectedDate) return;

    const requestVersion = ++attendanceRequestVersion.current;

    try {
      setAttendanceLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await api.get(
        `${ATTENDANCE_API}/class/${classSectionId}`,
        {
          params: { date: selectedDate },
        },
      );

      if (requestVersion !== attendanceRequestVersion.current) return;

      const rows = normalizeAttendanceRows(response.data);
      const nextMap: AttendanceMap = {};

      rows.forEach((row) => {
        nextMap[row.student_id] = row.attended;
      });

      setAttendanceMap(nextMap);
      setHasExistingAttendance(rows.length > 0);
    } catch (error: unknown) {
      if (requestVersion !== attendanceRequestVersion.current) return;

      console.error("Failed to load attendance:", error);
      setAttendanceMap({});
      setHasExistingAttendance(false);
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to load attendance for the selected class and date.",
        ),
      );
    } finally {
      if (requestVersion === attendanceRequestVersion.current) {
        setAttendanceLoading(false);
      }
    }
  }, [selectedClassSectionId, selectedDate]);

  useEffect(() => {
    attendanceRequestVersion.current += 1;
    setAttendanceMap({});
    setHasExistingAttendance(false);
    setSearch("");
    setSuccessMessage("");
    setErrorMessage("");

    if (selectedClassSectionId && selectedDate) {
      void loadExistingAttendance();
    }
  }, [selectedClassSectionId, selectedDate, loadExistingAttendance]);

  const setStudentAttendance = (
    studentId: number,
    status: AttendanceStatus,
  ): void => {
    setAttendanceMap((current) => ({
      ...current,
      [studentId]: status,
    }));
    setSuccessMessage("");
  };

  const markAll = (status: AttendanceStatus): void => {
    const nextMap: AttendanceMap = {};

    classStudents.forEach((student) => {
      const studentId = toPositiveInteger(student.id);
      if (studentId) nextMap[studentId] = status;
    });

    setAttendanceMap(nextMap);
    setSuccessMessage("");
    setErrorMessage("");
  };

  const clearAttendance = (): void => {
    setAttendanceMap({});
    setSuccessMessage("");
    setErrorMessage("");
  };

  const submitAttendance = async (): Promise<void> => {
    setErrorMessage("");
    setSuccessMessage("");

    const classSectionId = toPositiveInteger(selectedClassSectionId);

    if (!classSectionId) {
      setErrorMessage("Please select a class and section.");
      return;
    }

    if (!selectedDate) {
      setErrorMessage("Please select an attendance date.");
      return;
    }

    if (selectedDate > today) {
      setErrorMessage("Attendance cannot be submitted for a future date.");
      return;
    }

    if (classStudents.length === 0) {
      setErrorMessage("No students found for the selected class.");
      return;
    }

    if (markedCount !== classStudents.length) {
      setErrorMessage(
        `${notMarkedCount} student${notMarkedCount === 1 ? "" : "s"} still need an attendance status.`,
      );
      return;
    }

    const attendance = classStudents.flatMap((student) => {
      const studentId = toPositiveInteger(student.id);
      if (!studentId) return [];

      const attended = attendanceMap[studentId];
      if (!attended) return [];

      return [{ student_id: studentId, attended }];
    });

    if (attendance.length !== classStudents.length) {
      setErrorMessage("Unable to prepare attendance for all students.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post(
        `${ATTENDANCE_API}/submit-attendence`,
        {
          class_section_id: classSectionId,
          attendance_date: selectedDate,
          attendance,
        },
      );

      setHasExistingAttendance(true);
      setSuccessMessage(
        typeof response.data?.message === "string"
          ? response.data.message
          : hasExistingAttendance
            ? "Attendance updated successfully."
            : "Attendance submitted successfully.",
      );
    } catch (error: unknown) {
      console.error("Failed to save attendance:", error);
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Unable to save attendance. Please try again.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div>
        <Breadcrumb items={[{ label: "Attendance" }]} />
        <PageHeader
          title="Student Attendance"
          description="Take and manage daily student attendance"
        />

        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-border bg-card">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm">Loading attendance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Attendance" }]} />

      <PageHeader
        title="Student Attendance"
        description="Take and manage daily student attendance"
      />

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Take Attendance</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a date and class. The logged-in admin or teacher is recorded
            automatically by the backend.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="attendance-date"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Attendance Date
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="attendance-date"
                type="date"
                value={selectedDate}
                max={today}
                onChange={(event) => setSelectedDate(event.target.value)}
                disabled={submitting}
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="attendance-class-section"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Class / Section
            </label>

            <div className="relative">
              <Users className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                id="attendance-class-section"
                value={selectedClassSectionId}
                onChange={(event) =>
                  setSelectedClassSectionId(event.target.value)
                }
                disabled={submitting}
                className="h-10 w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-9 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">Select class & section</option>
                {activeClassSections.map((relation) => (
                  <option key={String(relation.id)} value={String(relation.id)}>
                    {getClassSectionName(relation)}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          {successMessage}
        </div>
      )}

      {hasExistingAttendance && selectedClassSectionId && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          Attendance already exists for this class and date. Saving again will
          update the existing records.
        </div>
      )}

      {selectedClassSectionId && classStudents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={<Users className="h-5 w-5" />}
            label="Total Students"
            value={classStudents.length}
            hint="Students in selected class"
          />
          <SummaryCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="Present"
            value={presentCount}
            hint={`${attendancePercentage}% attendance`}
            tone="success"
          />
          <SummaryCard
            icon={<XCircle className="h-5 w-5" />}
            label="Absent"
            value={absentCount}
            hint={`${absentCount} marked absent`}
            tone="danger"
          />
          <SummaryCard
            icon={<ClipboardCheck className="h-5 w-5" />}
            label="Not Marked"
            value={notMarkedCount}
            hint={`${markedCount}/${classStudents.length} completed`}
            tone="warning"
          />
        </div>
      )}

      {!selectedClassSectionId && (
        <div className="rounded-xl border border-border bg-card">
          <EmptyPanel
            icon={<ClipboardCheck className="h-7 w-7" />}
            title="Select a class"
            description="Choose a class and section above to load its students."
          />
        </div>
      )}

      {selectedClassSectionId && attendanceLoading && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading existing attendance...
          </div>
        </div>
      )}

      {selectedClassSectionId &&
        !attendanceLoading &&
        classStudents.length === 0 && (
          <div className="rounded-xl border border-border bg-card">
            <EmptyPanel
              icon={<Users className="h-7 w-7" />}
              title="No students found"
              description="There are no active students assigned to this class and section."
            />
          </div>
        )}

      {selectedClassSectionId &&
        !attendanceLoading &&
        classStudents.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search student, code or roll..."
                  className="h-9 w-full rounded-lg bg-muted pl-9 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => markAll("present")}
                  disabled={submitting}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark All Present
                </button>

                <button
                  type="button"
                  onClick={() => markAll("absent")}
                  disabled={submitting}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-400"
                >
                  <XCircle className="h-4 w-4" />
                  Mark All Absent
                </button>

                <button
                  type="button"
                  onClick={clearAttendance}
                  disabled={submitting}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear
                </button>
              </div>
            </div>

            <div className="hidden grid-cols-[80px_minmax(240px,1fr)_150px_280px] border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:grid">
              <div>Roll</div>
              <div>Student</div>
              <div>Student Code</div>
              <div>Attendance</div>
            </div>

            <div className="divide-y divide-border">
              {filteredStudents.map((student) => {
                const studentId = toPositiveInteger(student.id);
                if (!studentId) return null;

                const currentStatus = attendanceMap[studentId];
                const name = getStudentName(student);

                return (
                  <div
                    key={studentId}
                    className="grid grid-cols-1 gap-4 px-5 py-4 transition hover:bg-muted/30 md:grid-cols-[80px_minmax(240px,1fr)_150px_280px] md:items-center md:gap-0"
                  >
                    <div>
                      <span className="mr-2 text-xs font-medium text-muted-foreground md:hidden">
                        Roll:
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {getStudentRoll(student)}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {name}
                        </p>
                        {student.admission_number && (
                          <p className="text-xs text-muted-foreground">
                            Admission: {student.admission_number}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <span className="mr-2 text-xs font-medium md:hidden">
                        Code:
                      </span>
                      {student.student_code || studentId}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-pressed={currentStatus === "present"}
                        disabled={submitting}
                        onClick={() =>
                          setStudentAttendance(studentId, "present")
                        }
                        className={`inline-flex h-9 min-w-[110px] flex-1 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          currentStatus === "present"
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-600"
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Present
                      </button>

                      <button
                        type="button"
                        aria-pressed={currentStatus === "absent"}
                        disabled={submitting}
                        onClick={() =>
                          setStudentAttendance(studentId, "absent")
                        }
                        className={`inline-flex h-9 min-w-[100px] flex-1 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          currentStatus === "absent"
                            ? "border-rose-500 bg-rose-500 text-white shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-rose-500/50 hover:bg-rose-500/5 hover:text-rose-600"
                        }`}
                      >
                        <XCircle className="h-4 w-4" />
                        Absent
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredStudents.length === 0 && (
              <EmptyPanel
                icon={<Search className="h-7 w-7" />}
                title="No matching students"
                description="No student matches the current search."
              />
            )}

            <div className="flex flex-col gap-4 border-t border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {markedCount} of {classStudents.length} students marked
                </p>
                {notMarkedCount > 0 && (
                  <p className="mt-0.5 text-xs text-amber-600">
                    {notMarkedCount} student{notMarkedCount === 1 ? "" : "s"}{" "}
                    remaining
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => void submitAttendance()}
                disabled={
                  submitting ||
                  attendanceLoading ||
                  markedCount !== classStudents.length
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {hasExistingAttendance
                      ? "Update Attendance"
                      : "Submit Attendance"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}