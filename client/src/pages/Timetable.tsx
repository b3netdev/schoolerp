import { TimetableGrid } from "@/components/timetable/TimetableGrid";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { timetable } from "@/data/dummyData";

export default function Timetable() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Timetable" }]} />
      <PageHeader
        title="Weekly Timetable"
        description="Grade 10A — Academic Year 2024-25"
      />

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Class Schedule</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Monday through Friday</p>
        </div>
        <div className="p-6">
          <TimetableGrid timetable={timetable} />
        </div>
      </div>
    </div>
  );
}
