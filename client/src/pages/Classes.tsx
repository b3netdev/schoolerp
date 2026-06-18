import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { StatusIndicator } from "@/components/common/StatusIndicator";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { classes } from "@/data/dummyData";
import { Users, BookOpen } from "lucide-react";

const statusOptions = ["All", "Active", "Inactive"];

export default function Classes() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = classes.filter(cls => {
    const matchSearch =
      cls.name.toLowerCase().includes(search.toLowerCase()) ||
      cls.teacher.toLowerCase().includes(search.toLowerCase()) ||
      cls.section.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || cls.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <Breadcrumb items={[{ label: "Classes & Sections" }]} />
      <PageHeader
        title="Classes & Sections"
        description={`${classes.length} classes configured`}
        action={
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add Class
          </button>
        }
      />

      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by class name or teacher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            data-testid="classes-search"
          />
        </div>
        <div className="flex gap-1">
          {statusOptions.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`filter-${s.toLowerCase()}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl">
          <EmptyState
            icon={<BookOpen className="w-7 h-7" />}
            title="No classes found"
            description="No classes match your current search or filter."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(cls => (
            <div
              key={cls.id}
              className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
              data-testid={`class-card-${cls.id}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <StatusIndicator status={cls.status.toLowerCase()} />
              </div>
              <h3 className="text-base font-semibold text-foreground">{cls.name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Section {cls.section}</p>
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Teacher:</span>
                  <span className="font-medium text-foreground truncate">{cls.teacher}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Students:</span>
                  <span className="font-bold text-foreground">{cls.totalStudents}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        Showing {filtered.length} of {classes.length} classes
      </p>
    </div>
  );
}
