import { useState } from "react";
import { Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { exams, results } from "@/data/dummyData";
import { FileText, Trophy, TrendingUp, Plus } from "lucide-react";

const examColumns: Column[] = [
  { key: "name", label: "Exam Name" },
  { key: "subject", label: "Subject" },
  { key: "date", label: "Date" },
  { key: "time", label: "Time" },
  { key: "room", label: "Room" },
  { key: "actions", label: "Actions", type: "actions" },
];

const resultColumns: Column[] = [
  { key: "studentName", label: "Student", type: "avatar-text" },
  { key: "subject", label: "Subject" },
  { key: "marks", label: "Marks" },
  { key: "grade", label: "Grade" },
  { key: "status", label: "Status", type: "badge" },
];

const examTypeOptions = ["All", "Mid Term", "Final Exam", "Unit Test"];
const resultStatusOptions = ["All", "Pass", "Fail"];

export default function Exams() {
  const [examSearch, setExamSearch] = useState("");
  const [examTypeFilter, setExamTypeFilter] = useState("All");
  const [resultSearch, setResultSearch] = useState("");
  const [resultStatusFilter, setResultStatusFilter] = useState("All");

  const passCount = results.filter(r => r.status === "Pass").length;

  const filteredExams = exams.filter(e => {
    const matchSearch =
      e.name.toLowerCase().includes(examSearch.toLowerCase()) ||
      e.subject.toLowerCase().includes(examSearch.toLowerCase()) ||
      e.room.toLowerCase().includes(examSearch.toLowerCase());
    const matchType = examTypeFilter === "All" || e.name === examTypeFilter;
    return matchSearch && matchType;
  });

  const filteredResults = results.filter(r => {
    const matchSearch =
      r.studentName.toLowerCase().includes(resultSearch.toLowerCase()) ||
      r.subject.toLowerCase().includes(resultSearch.toLowerCase());
    const matchStatus = resultStatusFilter === "All" || r.status === resultStatusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <Breadcrumb items={[{ label: "Exams & Results" }]} />
      <PageHeader
        title="Exams & Results"
        description="Exam schedules and student performance"
        action={
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Schedule Exam
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<FileText className="w-5 h-5" />} title="Total Exams" value={exams.length} change="This term" trend="neutral" color="blue" />
        <StatCard icon={<Trophy className="w-5 h-5" />} title="Pass Rate" value={`${Math.round((passCount / results.length) * 100)}%`} change="+5% from last term" trend="up" color="emerald" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} title="Avg. Score" value="74.2" change="+2.1 from last term" trend="up" color="purple" />
      </div>

      <div className="space-y-6">
        {/* Exam Schedule */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Exam Schedule</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filteredExams.length} of {exams.length} exams
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search exams..."
                    value={examSearch}
                    onChange={e => setExamSearch(e.target.value)}
                    className="w-full sm:w-52 h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="exam-search"
                  />
                </div>
                <select
                  value={examTypeFilter}
                  onChange={e => setExamTypeFilter(e.target.value)}
                  className="h-9 px-3 bg-muted border-0 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="exam-type-filter"
                >
                  {examTypeOptions.map(t => <option key={t} value={t}>{t === "All" ? "All Types" : t}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="px-6">
            {filteredExams.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-7 h-7" />}
                title="No exams found"
                description="No exams match your current filters."
              />
            ) : (
              <DataTable columns={examColumns} data={filteredExams as unknown as Record<string, unknown>[]} />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Results Overview</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {filteredResults.length} of {results.length} results
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search results..."
                    value={resultSearch}
                    onChange={e => setResultSearch(e.target.value)}
                    className="w-full sm:w-52 h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    data-testid="result-search"
                  />
                </div>
                <div className="flex gap-1">
                  {resultStatusOptions.map(s => (
                    <button
                      key={s}
                      onClick={() => setResultStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        resultStatusFilter === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      data-testid={`result-filter-${s.toLowerCase()}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="px-6">
            {filteredResults.length === 0 ? (
              <EmptyState
                icon={<Trophy className="w-7 h-7" />}
                title="No results found"
                description="No results match your current filters."
              />
            ) : (
              <DataTable
                columns={resultColumns}
                data={filteredResults.map(r => ({ ...r, name: r.studentName })) as unknown as Record<string, unknown>[]}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
