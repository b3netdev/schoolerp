import { useRef, useState } from "react";
import { Download, Eye, Printer } from "lucide-react";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/common/Badge";
import { students, subjects, generateMark } from "@/data/dummyData";

const EXAMS = ["Mid Term", "Final Exam", "Unit Test", "Quarterly"];
const SESSIONS = ["2024–25", "2023–24", "2022–23"];

const GRADE_SCALE = [
  { letter: "A+", min: 90, remark: "Outstanding" },
  { letter: "A",  min: 80, remark: "Excellent" },
  { letter: "B+", min: 70, remark: "Very Good" },
  { letter: "B",  min: 60, remark: "Good" },
  { letter: "C+", min: 50, remark: "Above Average" },
  { letter: "C",  min: 40, remark: "Average" },
  { letter: "D",  min: 33, remark: "Below Average" },
  { letter: "F",  min: 0,  remark: "Fail" },
];

function getGrade(marks: number) {
  return GRADE_SCALE.find(g => marks >= g.min) ?? GRADE_SCALE[GRADE_SCALE.length - 1];
}

function getOverallGrade(pct: number) {
  return getGrade(pct);
}

export default function Marksheet() {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0].id);
  const [selectedExam, setSelectedExam] = useState(EXAMS[0]);
  const [selectedSession, setSelectedSession] = useState(SESSIONS[0]);
  const marksheetRef = useRef<HTMLDivElement>(null);

  const student = students.find(s => s.id === selectedStudentId)!;
  const activeSubjects = subjects.filter(s => s.status === "Active");

  // Generate marks for each subject
  const subjectMarks = activeSubjects.map((sub, idx) => {
    const obtained = generateMark(student.id, idx);
    const grade = getGrade(obtained);
    return {
      subject: sub.name,
      code: sub.code,
      maxMarks: sub.maxMarks,
      passMarks: sub.passMarks,
      obtained,
      grade: grade.letter,
      remark: grade.remark,
      status: obtained >= sub.passMarks ? "Pass" : "Fail",
    };
  });

  const totalMax = subjectMarks.reduce((a, b) => a + b.maxMarks, 0);
  const totalObtained = subjectMarks.reduce((a, b) => a + b.obtained, 0);
  const percentage = Math.round((totalObtained / totalMax) * 100);
  const overallGrade = getOverallGrade(percentage);
  const overallResult = subjectMarks.every(s => s.status === "Pass") ? "PASS" : "FAIL";

  const printMarksheet = () => {
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return;

    const rows = subjectMarks.map((row, i) => `
      <tr style="background:${i % 2 === 0 ? "#f9fafb" : "#ffffff"}">
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center">${i + 1}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:500">${row.subject}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;color:#6b7280">${row.code}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center">${row.maxMarks}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center">${row.passMarks}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:700;font-size:15px;color:${row.obtained >= 80 ? "#059669" : row.obtained >= 40 ? "#1d4ed8" : "#dc2626"}">${row.obtained}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;font-weight:700">${row.grade}</td>
        <td style="padding:8px 12px;border:1px solid #e5e7eb;text-align:center;color:${row.status === "Pass" ? "#059669" : "#dc2626"}">${row.remark}</td>
      </tr>
    `).join("");

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Marksheet – ${student.name}</title>
        <style>
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size:13px; color:#111827; background:#fff; }
          .page { max-width:800px; margin:0 auto; padding:32px; }
          @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Header -->
          <div style="text-align:center;border-bottom:3px solid #3b82f6;padding-bottom:16px;margin-bottom:20px">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:52px;height:52px;background:#3b82f6;border-radius:12px;margin-bottom:8px">
              <span style="color:#fff;font-size:22px;font-weight:bold">E</span>
            </div>
            <h1 style="font-size:22px;font-weight:800;color:#1e3a8a;letter-spacing:-0.5px">Riverside Academy</h1>
            <p style="font-size:12px;color:#6b7280;margin-top:2px">123 Education Blvd, Springfield, IL 62701 · admin@riverside.edu</p>
            <div style="margin-top:12px;background:#1e3a8a;color:#fff;display:inline-block;padding:4px 24px;border-radius:20px;font-size:13px;font-weight:600;letter-spacing:0.5px">
              ACADEMIC MARKSHEET — ${selectedExam.toUpperCase()}
            </div>
          </div>

          <!-- Student Info -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px">
            <div>
              <div style="margin-bottom:8px"><span style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase">Student Name</span><br><span style="font-weight:700;font-size:15px">${student.name}</span></div>
              <div style="margin-bottom:8px"><span style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase">Class & Section</span><br><span style="font-weight:600">${student.class} – Section ${student.section}</span></div>
              <div><span style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase">Roll Number</span><br><span style="font-weight:600;font-family:monospace">${student.rollNo}</span></div>
            </div>
            <div>
              <div style="margin-bottom:8px"><span style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase">Academic Session</span><br><span style="font-weight:600">${selectedSession}</span></div>
              <div style="margin-bottom:8px"><span style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase">Exam</span><br><span style="font-weight:600">${selectedExam}</span></div>
              <div><span style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase">Parent / Guardian</span><br><span style="font-weight:600">${student.parentName}</span></div>
            </div>
          </div>

          <!-- Marks Table -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
            <thead>
              <tr style="background:#1e3a8a;color:#fff">
                <th style="padding:10px 12px;border:1px solid #1e40af;text-align:center;width:36px">#</th>
                <th style="padding:10px 12px;border:1px solid #1e40af;text-align:left">Subject</th>
                <th style="padding:10px 12px;border:1px solid #1e40af;text-align:center">Code</th>
                <th style="padding:10px 12px;border:1px solid #1e40af;text-align:center">Max</th>
                <th style="padding:10px 12px;border:1px solid #1e40af;text-align:center">Pass</th>
                <th style="padding:10px 12px;border:1px solid #1e40af;text-align:center">Obtained</th>
                <th style="padding:10px 12px;border:1px solid #1e40af;text-align:center">Grade</th>
                <th style="padding:10px 12px;border:1px solid #1e40af;text-align:center">Remarks</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr style="background:#f0fdf4;font-weight:700">
                <td colspan="3" style="padding:10px 12px;border:1px solid #e5e7eb;text-align:right;font-size:13px">TOTAL</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:center">${totalMax}</td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb"></td>
                <td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:center;font-size:15px;color:#059669">${totalObtained}</td>
                <td colspan="2" style="padding:10px 12px;border:1px solid #e5e7eb;text-align:center">Percentage: <strong>${percentage}%</strong></td>
              </tr>
            </tfoot>
          </table>

          <!-- Result Summary -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px">
            ${[
              { label: "Total Marks", value: `${totalObtained} / ${totalMax}` },
              { label: "Percentage", value: `${percentage}%` },
              { label: "Overall Grade", value: overallGrade.letter },
              { label: "Result", value: overallResult },
            ].map(s => `
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;text-align:center">
                <p style="font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase;margin-bottom:4px">${s.label}</p>
                <p style="font-size:20px;font-weight:800;color:${s.label === "Result" ? (s.value === "PASS" ? "#059669" : "#dc2626") : "#1e3a8a"}">${s.value}</p>
              </div>
            `).join("")}
          </div>

          <!-- Signatures -->
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:12px">
            ${["Class Teacher", "Examination Controller", "Principal"].map(sig => `
              <div style="text-align:center">
                <div style="border-top:1.5px solid #9ca3af;padding-top:8px;margin-top:40px">
                  <p style="font-size:11px;font-weight:600;color:#374151">${sig}</p>
                  <p style="font-size:10px;color:#9ca3af">Signature & Seal</p>
                </div>
              </div>
            `).join("")}
          </div>

          <p style="text-align:center;margin-top:24px;font-size:10px;color:#9ca3af;border-top:1px solid #f3f4f6;padding-top:12px">
            This is a computer-generated marksheet. · Riverside Academy · ${selectedSession}
          </p>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 300);
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Exams & Results" }, { label: "Marksheet Download" }]} />
      <PageHeader
        title="Marksheet Download"
        description="Generate and print student marksheets by exam and session"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={printMarksheet}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
              data-testid="print-btn"
            >
              <Printer className="w-4 h-4" /> Print / Download PDF
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — filters */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Select Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Student</label>
                <select
                  value={selectedStudentId}
                  onChange={e => setSelectedStudentId(Number(e.target.value))}
                  className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="student-select"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Exam</label>
                <select
                  value={selectedExam}
                  onChange={e => setSelectedExam(e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="exam-select"
                >
                  {EXAMS.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Academic Session</label>
                <select
                  value={selectedSession}
                  onChange={e => setSelectedSession(e.target.value)}
                  className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="session-select"
                >
                  {SESSIONS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Summary card */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Result Summary</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Total Marks", value: `${totalObtained}/${totalMax}` },
                { label: "Percentage", value: `${percentage}%` },
                { label: "Overall Grade", value: overallGrade.letter },
                { label: "Subjects", value: subjectMarks.length },
              ].map(stat => (
                <div key={stat.label} className="bg-muted/50 rounded-lg p-2.5">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-base font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Final Result</span>
              <Badge variant={overallResult === "PASS" ? "success" : "danger"}>
                {overallResult}
              </Badge>
            </div>
          </div>

          <button
            onClick={printMarksheet}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" /> Download PDF / Print
          </button>
        </div>

        {/* Right — marksheet preview */}
        <div className="lg:col-span-2" ref={marksheetRef}>
          <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm" data-testid="marksheet-preview">
            {/* School header */}
            <div className="bg-[#1e3a8a] text-white px-8 py-6 text-center">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold">E</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight">Riverside Academy</h1>
              <p className="text-blue-200 text-xs mt-1">123 Education Blvd, Springfield, IL · admin@riverside.edu</p>
              <div className="mt-3 inline-block bg-white/20 rounded-full px-5 py-1 text-xs font-semibold tracking-widest uppercase">
                Academic Marksheet — {selectedExam}
              </div>
            </div>

            {/* Student info */}
            <div className="bg-blue-50 border-b border-blue-100 px-8 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: "Student Name", value: student.name },
                  { label: "Roll Number", value: student.rollNo },
                  { label: "Class & Section", value: `${student.class} – ${student.section}` },
                  { label: "Academic Session", value: selectedSession },
                  { label: "Exam Type", value: selectedExam },
                  { label: "Parent / Guardian", value: student.parentName },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-semibold text-foreground mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Marks table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="marksheet-table">
                <thead>
                  <tr className="bg-slate-700 text-white">
                    <th className="px-4 py-3 text-center font-semibold text-xs w-8">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-xs">Subject</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs">Code</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs">Max</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs">Pass</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs">Obtained</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs">Grade</th>
                    <th className="px-4 py-3 text-center font-semibold text-xs">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subjectMarks.map((row, i) => (
                    <tr key={row.subject} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                      <td className="px-4 py-2.5 text-center text-muted-foreground text-xs">{i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-foreground">{row.subject}</td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground text-xs font-mono">{row.code}</td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground">{row.maxMarks}</td>
                      <td className="px-4 py-2.5 text-center text-muted-foreground">{row.passMarks}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`font-bold text-base ${
                          row.obtained >= 80 ? "text-emerald-600"
                          : row.obtained >= 60 ? "text-blue-600"
                          : row.obtained >= 33 ? "text-amber-600"
                          : "text-red-600"
                        }`}>
                          {row.obtained}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="font-bold text-foreground">{row.grade}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`text-xs font-medium ${row.status === "Pass" ? "text-emerald-600" : "text-red-600"}`}>
                          {row.remark}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-emerald-50 border-t-2 border-emerald-200 font-semibold">
                    <td colSpan={3} className="px-4 py-3 text-right text-sm">TOTAL</td>
                    <td className="px-4 py-3 text-center">{totalMax}</td>
                    <td></td>
                    <td className="px-4 py-3 text-center text-emerald-700 font-bold text-base">{totalObtained}</td>
                    <td colSpan={2} className="px-4 py-3 text-center text-sm">
                      Percentage: <span className="font-bold text-foreground">{percentage}%</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Result bar */}
            <div className="px-8 py-4 border-t border-border">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                  { label: "Total Marks", value: `${totalObtained} / ${totalMax}`, accent: false },
                  { label: "Percentage", value: `${percentage}%`, accent: false },
                  { label: "Overall Grade", value: overallGrade.letter, accent: false },
                  { label: "Result", value: overallResult, accent: true },
                ].map(stat => (
                  <div key={stat.label} className="bg-muted/50 border border-border rounded-xl p-3 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">{stat.label}</p>
                    <p className={`text-lg font-bold ${stat.accent ? (overallResult === "PASS" ? "text-emerald-600" : "text-red-600") : "text-foreground"}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 mt-2 pt-4">
                {["Class Teacher", "Examination Controller", "Principal"].map(sig => (
                  <div key={sig} className="text-center">
                    <div className="h-10 border-b-2 border-dashed border-border mb-2" />
                    <p className="text-xs font-semibold text-foreground">{sig}</p>
                    <p className="text-xs text-muted-foreground">Signature & Seal</p>
                  </div>
                ))}
              </div>

              <p className="text-center text-xs text-muted-foreground mt-5 pt-3 border-t border-border">
                Computer-generated marksheet · Riverside Academy · {selectedSession}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
