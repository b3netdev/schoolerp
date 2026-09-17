import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import {
  CheckCircle,
  ClipboardList,
  LoaderCircle,
  RotateCcw,
  Save,
} from "lucide-react";

import { Avatar } from "@/components/common/Avatar";
import { Badge } from "@/components/common/Badge";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { ProgressBar } from "@/components/common/ProgressBar";
import { SectionTitle } from "@/components/common/SectionTitle";
import api from "@/lib/api";

type AttendanceStatus = "present" | "absent";

type ExamAssignment = {
  id: number;
  teacher_id: number;
  teacher_name: string;
  employee_code?: string | null;

  exam_id: number;
  exam_name: string;

  subject_id: number;
  subject_name: string;

  class_id: number;
  class_name: string;

  assign_till?: string | null;
};

type Student = {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  roll_number?: string | null;
  roll_no?: string | null;
  student_unique_id?: string | null;
};

type MarksEntry = {
  id: number;
  exam_assign_id: number;
  student_id: number;
  mark_obtained: number | null;
  attendance_status: AttendanceStatus;
  remarks?: string | null;
};

type StudentMarkState = {
  entry_id?: number;
  mark_obtained: string;
  attendance_status: AttendanceStatus;
  remarks: string;
};

type Grade = {
  letter: string;
  color: string;
  bg: string;
  min: number;
};

// Change this when you add full marks configuration in your exam module.
const MAX_MARKS = 100;
const PASS_MARKS = 33;

const GRADE_SCALE: Grade[] = [
  { letter: "A+", color: "text-emerald-700", bg: "bg-emerald-100", min: 90 },
  { letter: "A", color: "text-emerald-600", bg: "bg-emerald-50", min: 80 },
  { letter: "B+", color: "text-blue-700", bg: "bg-blue-100", min: 70 },
  { letter: "B", color: "text-blue-600", bg: "bg-blue-50", min: 60 },
  { letter: "C+", color: "text-amber-700", bg: "bg-amber-100", min: 50 },
  { letter: "C", color: "text-amber-600", bg: "bg-amber-50", min: 40 },
  { letter: "D", color: "text-orange-600", bg: "bg-orange-50", min: 33 },
  { letter: "F", color: "text-red-700", bg: "bg-red-100", min: 0 },
];

const getInitials = (student: Student) => {
  const fullName =
    student.name ||
    [student.first_name, student.last_name].filter(Boolean).join(" ");

  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const getStudentName = (student: Student) => {
  return (
    student.name ||
    [student.first_name, student.last_name].filter(Boolean).join(" ") ||
    "Unnamed Student"
  );
};

const getRollNumber = (student: Student) => {
  return (
    student.roll_number ||
    student.roll_no ||
    student.student_unique_id ||
    "—"
  );
};

const getGrade = (marks: number | ""): Grade | null => {
  if (marks === "" || marks < 0) return null;

  return (
    GRADE_SCALE.find((grade) => marks >= grade.min) ||
    GRADE_SCALE[GRADE_SCALE.length - 1]
  );
};

const getMarksBackground = (marks: number | "") => {
  if (marks === "") return "";

  if (marks >= 80) {
    return "bg-emerald-50 border-emerald-200 text-emerald-800";
  }

  if (marks >= 60) {
    return "bg-blue-50 border-blue-200 text-blue-800";
  }

  if (marks >= 40) {
    return "bg-amber-50 border-amber-200 text-amber-800";
  }

  return "bg-red-50 border-red-200 text-red-800";
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return apiError.response?.data?.message || fallback;
};

export default function MarksEntry() {
  const [assignments, setAssignments] = useState<ExamAssignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [markValues, setMarkValues] = useState<
    Record<number, StudentMarkState>
  >({});

  const [selectedExamAssignId, setSelectedExamAssignId] = useState("");
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const selectedAssignment = useMemo(
    () =>
      assignments.find(
        (assignment) => assignment.id === Number(selectedExamAssignId),
      ) || null,
    [assignments, selectedExamAssignId],
  );

  const loadAssignments = async () => {
    try {
      setIsLoadingAssignments(true);
      setError("");

      // academic_year_id is taken automatically from JWT middleware.
      const response = await api.get("/exam-assign");

      setAssignments(response.data?.data || []);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to load exam assignments.",
        ),
      );
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const loadStudentsAndMarks = async (assignment: ExamAssignment) => {
    try {
      setIsLoadingStudents(true);
      setError("");
      setStudents([]);
      setMarkValues({});

      // academic_year_id is NOT sent from frontend.
      const [studentResponse, marksResponse] = await Promise.all([
        api.get("/student/get-students", {
          params: {
            class_id: assignment.class_id,
            status: "active",
          },
        }),
        api.get("/marks-entry", {
          params: {
            exam_assign_id: assignment.id,
          },
        }),
      ]);

      const loadedStudents: Student[] = studentResponse.data?.data || [];
      const savedMarks: MarksEntry[] = marksResponse.data?.data || [];

      const savedMarksMap = savedMarks.reduce<
        Record<number, StudentMarkState>
      >((result, mark) => {
        result[mark.student_id] = {
          entry_id: mark.id,
          mark_obtained:
            mark.mark_obtained === null ? "" : String(mark.mark_obtained),
          attendance_status: mark.attendance_status,
          remarks: mark.remarks || "",
        };

        return result;
      }, {});

      setStudents(loadedStudents);
      setMarkValues(savedMarksMap);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to load students and saved marks.",
        ),
      );
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    void loadAssignments();
  }, []);

  useEffect(() => {
    if (!selectedAssignment) {
      setStudents([]);
      setMarkValues({});
      return;
    }

    void loadStudentsAndMarks(selectedAssignment);
  }, [selectedAssignment]);

  const getStudentMark = (studentId: number): StudentMarkState => {
    return (
      markValues[studentId] || {
        mark_obtained: "",
        attendance_status: "present",
        remarks: "",
      }
    );
  };

  const updateStudentMark = (
    studentId: number,
    changes: Partial<StudentMarkState>,
  ) => {
    setSaved(false);

    setMarkValues((current) => ({
      ...current,
      [studentId]: {
        ...getStudentMark(studentId),
        ...changes,
      },
    }));
  };

  const handleMarkChange = (
    studentId: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;

    if (value === "") {
      updateStudentMark(studentId, {
        mark_obtained: "",
        attendance_status: "present",
      });

      return;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) return;

    const safeMark = Math.min(MAX_MARKS, Math.max(0, numericValue));

    updateStudentMark(studentId, {
      mark_obtained: String(safeMark),
      attendance_status: "present",
    });
  };

  const handleAttendanceChange = (
    studentId: number,
    attendanceStatus: AttendanceStatus,
  ) => {
    updateStudentMark(studentId, {
      attendance_status: attendanceStatus,
      mark_obtained:
        attendanceStatus === "absent"
          ? ""
          : getStudentMark(studentId).mark_obtained,
    });
  };

  const handleReset = () => {
    if (!selectedAssignment) return;

    void loadStudentsAndMarks(selectedAssignment);
    setSaved(false);
    setError("");
  };

  const handleSave = async () => {
    if (!selectedAssignment) {
      setError("Please select an exam assignment first.");
      return;
    }

    setError("");
    setSaved(false);

    const rowsToSave = students.filter((student) => {
      const row = getStudentMark(student.id);

      return (
        row.attendance_status === "absent" ||
        row.mark_obtained !== ""
      );
    });

    if (!rowsToSave.length) {
      setError("Enter at least one mark or mark a student as absent.");
      return;
    }

    try {
      setIsSaving(true);

      await Promise.all(
        rowsToSave.map(async (student) => {
          const row = getStudentMark(student.id);

          const payload = {
            mark_obtained:
              row.attendance_status === "absent"
                ? null
                : Number(row.mark_obtained),
            attendance_status: row.attendance_status,
            remarks: row.remarks.trim() || null,
          };

          if (row.entry_id) {
            // academic year, role, and entered-by fields come from middleware.
            await api.patch(`/marks-entry/${row.entry_id}`, payload);
          } else {
            await api.post("/marks-entry", {
              exam_assign_id: selectedAssignment.id,
              student_id: student.id,
              ...payload,
            });
          }
        }),
      );

      await loadStudentsAndMarks(selectedAssignment);
      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, "Unable to save marks."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const enteredRows = students.filter((student) => {
    const row = getStudentMark(student.id);

    return row.attendance_status === "absent" || row.mark_obtained !== "";
  });

  const allMarks = students
    .map((student) => getStudentMark(student.id))
    .filter(
      (row) =>
        row.attendance_status === "present" &&
        row.mark_obtained !== "",
    )
    .map((row) => Number(row.mark_obtained));

  const average = allMarks.length
    ? Math.round(
        allMarks.reduce((total, mark) => total + mark, 0) /
          allMarks.length,
      )
    : null;

  const highest = allMarks.length ? Math.max(...allMarks) : null;
  const lowest = allMarks.length ? Math.min(...allMarks) : null;

  const passCount = allMarks.filter((mark) => mark >= PASS_MARKS).length;
  const absentCount = students.filter(
    (student) =>
      getStudentMark(student.id).attendance_status === "absent",
  ).length;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Exams & Results" },
          { label: "Marks Entry" },
        ]}
      />

      <PageHeader
        title="Marks Entry"
        description="Enter and save marks for assigned exams and subjects."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={!selectedAssignment || isLoadingStudents || isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw className="size-4" />
              Reset
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={
                !selectedAssignment ||
                isLoadingStudents ||
                isSaving ||
                enteredRows.length === 0
              }
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <CheckCircle className="size-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Save Marks
                </>
              )}
            </button>
          </div>
        }
      />

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded p-1 transition hover:bg-destructive/10"
            aria-label="Close error"
          >
            ×
          </button>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="max-w-xl">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Exam Assignment
          </label>

          <select
            value={selectedExamAssignId}
            onChange={(event) => {
              setSelectedExamAssignId(event.target.value);
              setSaved(false);
              setError("");
            }}
            disabled={isLoadingAssignments}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="">
              {isLoadingAssignments
                ? "Loading assignments..."
                : "Select exam assignment"}
            </option>

            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.exam_name} — {assignment.subject_name} (
                {assignment.class_name})
              </option>
            ))}
          </select>

          <p className="mt-2 text-xs text-muted-foreground">
            Exam, subject, class, teacher, and academic year come from the
            selected assignment and JWT middleware.
          </p>
        </div>
      </div>

      {selectedAssignment && (
        <div className="mb-6 grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 xl:grid-cols-4">
          <InfoCard label="Exam" value={selectedAssignment.exam_name} />
          <InfoCard label="Subject" value={selectedAssignment.subject_name} />
          <InfoCard label="Class" value={selectedAssignment.class_name} />
          <InfoCard
            label="Assigned Teacher"
            value={selectedAssignment.teacher_name}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-border bg-card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {selectedAssignment
                  ? `${selectedAssignment.subject_name} — ${selectedAssignment.exam_name}`
                  : "Student Marks"}
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {selectedAssignment
                  ? `${selectedAssignment.class_name} · Maximum marks: ${MAX_MARKS} · `
                  : ""}
                <span className="font-medium text-primary">
                  {enteredRows.length}/{students.length} entered
                </span>
              </p>
            </div>

            {saved && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600">
                <CheckCircle className="size-3.5" />
                Marks saved
              </span>
            )}
          </div>

          {!selectedAssignment ? (
            <EmptyState
              title="Select an exam assignment"
              description="Choose an assigned exam and subject to load students."
            />
          ) : isLoadingStudents ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <LoaderCircle className="mb-3 size-9 animate-spin text-primary" />
              <p className="text-sm font-medium">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <EmptyState
              title="No students found"
              description="No active students were found in this exam class."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      #
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Student
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Roll No.
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Marks / {MAX_MARKS}
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Grade
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Result
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {students.map((student, index) => {
                    const row = getStudentMark(student.id);
                    const marks =
                      row.mark_obtained === ""
                        ? ""
                        : Number(row.mark_obtained);

                    const grade =
                      row.attendance_status === "absent"
                        ? null
                        : getGrade(marks);

                    const isPassing =
                      row.attendance_status === "present" &&
                      marks !== "" &&
                      marks >= PASS_MARKS;

                    const isFailing =
                      row.attendance_status === "present" &&
                      marks !== "" &&
                      marks < PASS_MARKS;

                    return (
                      <tr
                        key={student.id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <td className="px-5 py-3 text-sm text-muted-foreground">
                          {index + 1}
                        </td>

                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              initials={getInitials(student)}
                              name={getStudentName(student)}
                              size="sm"
                            />

                            <span className="text-sm font-medium text-foreground">
                              {getStudentName(student)}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3 font-mono text-sm text-muted-foreground">
                          {getRollNumber(student)}
                        </td>

                        <td className="px-5 py-3">
                          <div className="flex justify-center">
                            <select
                              value={row.attendance_status}
                              onChange={(event) =>
                                handleAttendanceChange(
                                  student.id,
                                  event.target.value as AttendanceStatus,
                                )
                              }
                              className="h-9 rounded-lg border border-border bg-background px-2 text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                            </select>
                          </div>
                        </td>

                        <td className="px-5 py-3">
                          <div className="flex justify-center">
                            <input
                              type="number"
                              min={0}
                              max={MAX_MARKS}
                              value={row.mark_obtained}
                              disabled={row.attendance_status === "absent"}
                              onChange={(event) =>
                                handleMarkChange(student.id, event)
                              }
                              placeholder="—"
                              className={`h-9 w-20 rounded-lg border text-center text-sm font-semibold outline-none transition-colors focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50 ${
                                row.mark_obtained !== ""
                                  ? getMarksBackground(marks)
                                  : "border-border bg-muted text-foreground"
                              }`}
                            />
                          </div>
                        </td>

                        <td className="px-5 py-3 text-center">
                          {row.attendance_status === "absent" ? (
                            <span className="text-sm font-medium text-orange-600">
                              Absent
                            </span>
                          ) : grade ? (
                            <span
                              className={`inline-flex size-9 items-center justify-center rounded-lg text-sm font-bold ${grade.bg} ${grade.color}`}
                            >
                              {grade.letter}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground/40">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-3 text-center">
                          {row.attendance_status === "absent" && (
                            <Badge variant="warning">Absent</Badge>
                          )}

                          {isPassing && <Badge variant="success">Pass</Badge>}

                          {isFailing && <Badge variant="danger">Fail</Badge>}

                          {row.attendance_status === "present" &&
                            !isPassing &&
                            !isFailing && (
                              <span className="text-sm text-muted-foreground/40">
                                —
                              </span>
                            )}
                        </td>

                        <td className="px-5 py-3">
                          <input
                            type="text"
                            value={row.remarks}
                            onChange={(event) =>
                              updateStudentMark(student.id, {
                                remarks: event.target.value,
                              })
                            }
                            placeholder="Optional note"
                            maxLength={500}
                            className="h-9 w-36 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-none transition focus:ring-2 focus:ring-primary/30"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <SectionTitle
              title="Class Summary"
              subtitle={
                enteredRows.length
                  ? `Based on ${enteredRows.length} entries`
                  : "Enter marks to see statistics"
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Average"
                value={average !== null ? String(average) : "—"}
                sub="marks"
              />
              <StatCard
                label="Highest"
                value={highest !== null ? String(highest) : "—"}
                sub="marks"
              />
              <StatCard
                label="Lowest"
                value={lowest !== null ? String(lowest) : "—"}
                sub="marks"
              />
              <StatCard
                label="Pass Rate"
                value={
                  allMarks.length
                    ? `${Math.round((passCount / allMarks.length) * 100)}%`
                    : "—"
                }
                sub={`${passCount}/${allMarks.length}`}
              />
            </div>

            <div className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Absent students:{" "}
              <span className="font-semibold text-foreground">
                {absentCount}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <SectionTitle title="Grade Distribution" />

            {!allMarks.length ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No marks entered yet.
              </p>
            ) : (
              <div className="space-y-3">
                {GRADE_SCALE.map((grade, index) => {
                  const upperLimit =
                    index === 0
                      ? MAX_MARKS
                      : GRADE_SCALE[index - 1].min - 1;

                  const count = allMarks.filter(
                    (mark) =>
                      mark >= grade.min && mark <= upperLimit,
                  ).length;

                  if (!count) return null;

                  return (
                    <div key={grade.letter} className="flex items-center gap-3">
                      <span
                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${grade.bg} ${grade.color}`}
                      >
                        {grade.letter}
                      </span>

                      <div className="flex-1">
                        <ProgressBar
                          value={count}
                          max={Math.max(allMarks.length, 1)}
                          color={
                            grade.letter === "A+" || grade.letter === "A"
                              ? "emerald"
                              : grade.letter === "B+" ||
                                  grade.letter === "B"
                                ? "blue"
                                : grade.letter === "C+" ||
                                    grade.letter === "C"
                                  ? "amber"
                                  : "red"
                          }
                          showPercent={false}
                          size="sm"
                        />
                      </div>

                      <span className="w-5 text-right text-sm font-semibold text-foreground">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <SectionTitle title="Grade Scale" />

            <div className="space-y-1.5">
              {GRADE_SCALE.map((grade, index) => {
                const upperLimit =
                  index === 0
                    ? MAX_MARKS
                    : GRADE_SCALE[index - 1].min - 1;

                return (
                  <div
                    key={grade.letter}
                    className="flex items-center justify-between text-xs"
                  >
                    <span
                      className={`flex h-6 w-7 items-center justify-center rounded-md font-bold ${grade.bg} ${grade.color}`}
                    >
                      {grade.letter}
                    </span>

                    <span className="text-muted-foreground">
                      {grade.min} – {upperLimit} marks
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <ClipboardList className="mb-3 size-10 opacity-40" />
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs">{description}</p>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-3.5">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold leading-none text-foreground">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}