import { useState } from "react";
import { Search } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { DataTable, Column } from "@/components/tables/DataTable";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { SectionTitle } from "@/components/common/SectionTitle";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { attendance, attendanceSummary } from "@/data/dummyData";
import { CheckCircle, XCircle, Clock, ClipboardCheck } from "lucide-react";

const columns: Column[] = [
  { key: "studentName", label: "Student", type: "avatar-text" },
  { key: "class", label: "Class" },
  { key: "date", label: "Date" },
  { key: "status", label: "Status", type: "badge" },
];

const statusOptions = ["All", "Present", "Absent", "Late"];
const classOptions = ["All Classes", ...Array.from(new Set(attendance.map(a => a.class)))];

export default function Attendance() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All Classes");

  const filtered = attendance.filter(a => {
    const matchSearch = a.studentName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    const matchClass = classFilter === "All Classes" || a.class === classFilter;
    return matchSearch && matchStatus && matchClass;
  });

  const presentCount = attendance.filter(a => a.status === "Present").length;
  const absentCount = attendance.filter(a => a.status === "Absent").length;
  const lateCount = attendance.filter(a => a.status === "Late").length;

  return (
    <div>
      <Breadcrumb items={[{ label: "Attendance" }]} />
      <PageHeader title="Attendance" description="Track and manage student attendance records" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<CheckCircle className="w-5 h-5" />} title="Present Today" value={presentCount} change="87% attendance rate" trend="up" color="emerald" />
        <StatCard icon={<XCircle className="w-5 h-5" />} title="Absent Today" value={absentCount} change="-2 from yesterday" trend="down" color="rose" />
        <StatCard icon={<Clock className="w-5 h-5" />} title="Late Arrivals" value={lateCount} change="Same as yesterday" trend="neutral" color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          {/* Search & Filter */}
          <div className="p-5 border-b border-border space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search by student name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="attendance-search"
                />
              </div>
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="h-9 px-3 bg-muted border-0 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="class-filter"
              >
                {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-1 flex-wrap">
              {statusOptions.map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`status-filter-${s.toLowerCase()}`}
                >
                  {s}
                  {s !== "All" && (
                    <span className="ml-1.5 opacity-70">
                      ({attendance.filter(a => a.status === s).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<ClipboardCheck className="w-7 h-7" />}
                title="No records found"
                description="No attendance records match your current filters."
              />
            ) : (
              <DataTable
                columns={columns}
                data={filtered.map(a => ({ ...a, name: a.studentName })) as unknown as Record<string, unknown>[]}
              />
            )}
          </div>
          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Showing {filtered.length} of {attendance.length} records
              </span>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <SectionTitle title="Attendance by Class" subtitle="Today's summary" />
          <div className="space-y-5">
            {attendanceSummary.map(row => (
              <div key={row.class}>
                <p className="text-sm font-medium text-foreground mb-2">{row.class}</p>
                <ProgressBar
                  value={row.present}
                  max={row.total}
                  color={row.percentage >= 90 ? "emerald" : row.percentage >= 80 ? "blue" : "amber"}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
