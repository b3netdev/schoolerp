import { useState, useMemo } from "react";
import { Save, CheckCircle, RotateCcw, ClipboardList } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/common/Badge";
import { Avatar } from "@/components/common/Avatar";
import { ProgressBar } from "@/components/common/ProgressBar";
import { SectionTitle } from "@/components/common/SectionTitle";
import { students } from "@/data/dummyData";

const EXAMS = ["Mid Term", "Final Exam", "Unit Test", "Quarterly"];
const SUBJECTS = [
  "Mathematics", "Physics", "Biology", "English Literature",
  "Computer Science", "History", "Art & Design", "Health Sciences",
];
const CLASSES = ["Grade 10", "Grade 11", "Grade 12", "Grade 9"];
const SECTIONS = ["A", "B", "C"];
const MAX_MARKS = 100;

interface Grade {
  letter: string;
  color: string;
  bg: string;
  min: number;
}

const GRADE_SCALE: Grade[] = [
  { letter: "A+", color: "text-emerald-700", bg: "bg-emerald-100", min: 90 },
  { letter: "A",  color: "text-emerald-600", bg: "bg-emerald-50",  min: 80 },
  { letter: "B+", color: "text-blue-700",    bg: "bg-blue-100",    min: 70 },
  { letter: "B",  color: "text-blue-600",    bg: "bg-blue-50",     min: 60 },
  { letter: "C+", color: "text-amber-700",   bg: "bg-amber-100",   min: 50 },
  { letter: "C",  color: "text-amber-600",   bg: "bg-amber-50",    min: 40 },
  { letter: "D",  color: "text-orange-600",  bg: "bg-orange-50",   min: 33 },
  { letter: "F",  color: "text-red-700",     bg: "bg-red-100",     min: 0  },
];

function getGrade(marks: number | ""): Grade | null {
  if (marks === "" || marks < 0) return null;
  return GRADE_SCALE.find(g => marks >= g.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
}

function getMarksBg(marks: number | ""): string {
  if (marks === "") return "";
  if (marks >= 80) return "bg-emerald-50 border-emerald-200 text-emerald-800";
  if (marks >= 60) return "bg-blue-50 border-blue-200 text-blue-800";
  if (marks >= 40) return "bg-amber-50 border-amber-200 text-amber-800";
  return "bg-red-50 border-red-200 text-red-800";
}

export default function MarksEntry() {
  const [selectedClass, setSelectedClass] = useState("Grade 10");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [selectedExam, setSelectedExam] = useState("Mid Term");
  const [marks, setMarks] = useState<Record<number, number | "">>({});
  const [saved, setSaved] = useState(false);

  const classStudents = useMemo(
    () => students.filter(s => s.class === selectedClass && s.section === selectedSection),
    [selectedClass, selectedSection]
  );

  const handleMarkChange = (id: number, value: string) => {
    setSaved(false);
    const num = value === "" ? "" : Math.min(MAX_MARKS, Math.max(0, Number(value)));
    setMarks(prev => ({ ...prev, [id]: num }));
  };

  const handleSave = () => {
    // In a real app this would POST to backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setMarks({});
    setSaved(false);
  };

  // Summary stats
  const entered = classStudents.filter(s => marks[s.id] !== undefined && marks[s.id] !== "");
  const allMarks = entered.map(s => marks[s.id] as number);
  const avg = allMarks.length ? Math.round(allMarks.reduce((a, b) => a + b, 0) / allMarks.length) : null;
  const highest = allMarks.length ? Math.max(...allMarks) : null;
  const lowest = allMarks.length ? Math.min(...allMarks) : null;
  const passCount = allMarks.filter(m => m >= 33).length;

  const gradeDist = GRADE_SCALE.map(g => ({
    ...g,
    count: allMarks.filter(m => {
      const nextIdx = GRADE_SCALE.indexOf(g) - 1;
      const upper = nextIdx >= 0 ? GRADE_SCALE[nextIdx].min : MAX_MARKS + 1;
      return m >= g.min && m < upper;
    }),
  })).filter(g => g.count > 0);

  return (
    <div>
      <Breadcrumb items={[{ label: "Exams & Results" }, { label: "Marks Entry" }]} />
      <PageHeader
        title="Marks Entry"
        description="Enter and save student marks by class, section, subject and exam"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-colors"
              data-testid="reset-btn"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button
              onClick={handleSave}
              disabled={entered.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              data-testid="save-btn"
            >
              {saved
                ? <><CheckCircle className="w-4 h-4" /> Saved!</>
                : <><Save className="w-4 h-4" /> Save Marks</>
              }
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={e => { setSelectedClass(e.target.value); setMarks({}); setSaved(false); }}
              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="class-select"
            >
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={e => { setSelectedSection(e.target.value); setMarks({}); setSaved(false); }}
              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="section-select"
            >
              {SECTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="subject-select"
            >
              {SUBJECTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Exam
            </label>
            <select
              value={selectedExam}
              onChange={e => setSelectedExam(e.target.value)}
              className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="exam-select"
            >
              {EXAMS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Marks Table */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {selectedSubject} — {selectedExam}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedClass} Section {selectedSection} &nbsp;·&nbsp;
                Max marks: {MAX_MARKS} &nbsp;·&nbsp;
                <span className="text-primary font-medium">{entered.length}/{classStudents.length} entered</span>
              </p>
            </div>
            {saved && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle className="w-3.5 h-3.5" /> Marks saved
              </span>
            )}
          </div>

          {classStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <ClipboardList className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm font-medium">No students found</p>
              <p className="text-xs mt-1">Try a different class or section.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="marks-table">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">#</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Student</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Roll No</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Marks <span className="text-muted-foreground/60 normal-case font-normal">/ {MAX_MARKS}</span>
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Grade</th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {classStudents.map((student, idx) => {
                    const m = marks[student.id];
                    const grade = getGrade(m ?? "");
                    const isPassing = m !== "" && m !== undefined && (m as number) >= 33;
                    const isFailing = m !== "" && m !== undefined && (m as number) < 33;
                    const markBg = m !== undefined ? getMarksBg(m) : "";

                    return (
                      <tr key={student.id} className="hover:bg-muted/30 transition-colors" data-testid={`marks-row-${idx}`}>
                        <td className="px-5 py-3 text-sm text-muted-foreground">{idx + 1}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar initials={student.initials} name={student.name} size="sm" />
                            <span className="text-sm font-medium text-foreground">{student.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground font-mono">{student.rollNo}</td>
                        <td className="px-5 py-3">
                          <div className="flex justify-center">
                            <input
                              type="number"
                              min={0}
                              max={MAX_MARKS}
                              value={m ?? ""}
                              onChange={e => handleMarkChange(student.id, e.target.value)}
                              placeholder="—"
                              className={`w-20 h-9 text-center rounded-lg border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors ${
                                m !== undefined && m !== ""
                                  ? markBg
                                  : "bg-muted border-border text-foreground"
                              }`}
                              data-testid={`marks-input-${idx}`}
                            />
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          {grade ? (
                            <span className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-bold ${grade.bg} ${grade.color}`}>
                              {grade.letter}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40 text-sm">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {isPassing && <Badge variant="success">Pass</Badge>}
                          {isFailing && <Badge variant="danger">Fail</Badge>}
                          {!isPassing && !isFailing && <span className="text-muted-foreground/40 text-sm">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right summary panel */}
        <div className="space-y-4">

          {/* Quick stats */}
          <div className="bg-card border border-border rounded-xl p-5">
            <SectionTitle title="Class Summary" subtitle={entered.length > 0 ? `Based on ${entered.length} entries` : "Enter marks to see stats"} />
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Average", value: avg !== null ? `${avg}` : "—", sub: "marks" },
                { label: "Highest", value: highest !== null ? `${highest}` : "—", sub: "marks" },
                { label: "Lowest", value: lowest !== null ? `${lowest}` : "—", sub: "marks" },
                { label: "Pass Rate", value: allMarks.length ? `${Math.round((passCount / allMarks.length) * 100)}%` : "—", sub: `${passCount}/${allMarks.length}` },
              ].map(stat => (
                <div key={stat.label} className="bg-muted/50 rounded-xl p-3.5">
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground leading-none">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Grade distribution */}
          <div className="bg-card border border-border rounded-xl p-5">
            <SectionTitle title="Grade Distribution" />
            {gradeDist.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No data yet</p>
            ) : (
              <div className="space-y-3">
                {GRADE_SCALE.map(g => {
                  const count = allMarks.filter(m => {
                    const nextIdx = GRADE_SCALE.indexOf(g) - 1;
                    const upper = nextIdx >= 0 ? GRADE_SCALE[nextIdx].min : MAX_MARKS + 1;
                    return m >= g.min && m < upper;
                  }).length;
                  if (count === 0 && allMarks.length > 0) return null;
                  return (
                    <div key={g.letter} className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${g.bg} ${g.color}`}>
                        {g.letter}
                      </span>
                      <div className="flex-1">
                        <ProgressBar
                          value={count}
                          max={Math.max(allMarks.length, 1)}
                          color={
                            g.letter === "A+" || g.letter === "A" ? "emerald" :
                            g.letter === "B+" || g.letter === "B" ? "blue" :
                            g.letter === "C+" || g.letter === "C" ? "amber" : "red"
                          }
                          showPercent={false}
                          size="sm"
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground w-5 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grade scale reference */}
          <div className="bg-card border border-border rounded-xl p-5">
            <SectionTitle title="Grade Scale" />
            <div className="space-y-1.5">
              {GRADE_SCALE.map((g, i) => {
                const nextIdx = i - 1;
                const upper = nextIdx >= 0 ? GRADE_SCALE[nextIdx].min - 1 : MAX_MARKS;
                return (
                  <div key={g.letter} className="flex items-center justify-between text-xs">
                    <span className={`w-7 h-6 rounded-md flex items-center justify-center font-bold ${g.bg} ${g.color}`}>
                      {g.letter}
                    </span>
                    <span className="text-muted-foreground">
                      {g.min} – {upper} marks
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
