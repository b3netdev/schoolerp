import { useEffect, useState } from "react";
import { GraduationCap, Users, BookOpen, Plus } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { NoticeCard } from "@/components/dashboard/NoticeCard";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { ProgressBar } from "@/components/common/ProgressBar";
import { SectionTitle } from "@/components/common/SectionTitle";
import { PageHeader } from "@/components/common/PageHeader";
import {
  activities,
  notices,
  events,
  attendanceSummary,
} from "@/data/dummyData";
import api from "@/lib/api";

type StudentListResponse = {
  total?: number;
};

type TeacherListResponse = {
  total?: number;
};

type ClassItem = {
  id: number;
};

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div className="h-4 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
        </div>

        <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [totals, setTotals] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
  });

  const [isTotalsLoading, setIsTotalsLoading] = useState(true);

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        setIsTotalsLoading(true);

        const [studentsResult, teachersResult, classesResult] =
          await Promise.all([
            api.get("/student/get-students", {
              params: { status: "active", page: 1, limit: 1 },
              skipErrorToast: true,
            }),
            api.get("/teacher/get-teachers", {
              params: { status: "active", page: 1, limit: 1 },
              skipErrorToast: true,
            }),
            api.get("/class/get-classes", {
              params: { status: "active" },
              skipErrorToast: true,
            }),
          ]);

        const studentsData = studentsResult.data
          ?.data as StudentListResponse | undefined;

        const teachersData = teachersResult.data
          ?.data as TeacherListResponse | undefined;

        const classesData = classesResult.data
          ?.data as ClassItem[] | undefined;

        setTotals({
          students: Number(studentsData?.total ?? 0),
          teachers: Number(teachersData?.total ?? 0),
          classes: Array.isArray(classesData) ? classesData.length : 0,
        });
      } catch {
        setTotals({
          students: 0,
          teachers: 0,
          classes: 0,
        });
      } finally {
        setIsTotalsLoading(false);
      }
    };

    void fetchTotals();
  }, []);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome back, John. Here's what's happening today."
        action={
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            <Plus className="h-4 w-4" />
            Quick Add
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isTotalsLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={<GraduationCap className="h-5 w-5" />}
              title="Total Students"
              value={totals.students.toLocaleString("en-IN")}
              color="blue"
            />

            <StatCard
              icon={<Users className="h-5 w-5" />}
              title="Total Teachers"
              value={totals.teachers.toLocaleString("en-IN")}
              color="purple"
            />

            <StatCard
              icon={<BookOpen className="h-5 w-5" />}
              title="Total Classes"
              value={totals.classes.toLocaleString("en-IN")}
              color="amber"
            />
          </>
        )}
      </div>

      {/* Middle Row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <SectionTitle
            title="Attendance Summary"
            subtitle="Today's overview by class"
          />

          <div className="space-y-4">
            {attendanceSummary.map((row) => (
              <div key={row.class}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {row.class}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    {row.present} present · {row.absent} absent · {row.late} late
                  </span>
                </div>

                <ProgressBar
                  value={row.present}
                  max={row.total}
                  showPercent
                  color={
                    row.percentage >= 90
                      ? "emerald"
                      : row.percentage >= 80
                        ? "blue"
                        : "amber"
                  }
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <SectionTitle title="Fee Collection" subtitle="November 2024" />

          <div className="space-y-5">
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-muted-foreground">Collected</span>
                <span className="font-semibold text-foreground">$18,500</span>
              </div>
              <ProgressBar value={74} color="emerald" size="md" />
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-semibold text-foreground">$4,200</span>
              </div>
              <ProgressBar value={17} color="amber" size="md" />
            </div>

            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-muted-foreground">Overdue</span>
                <span className="font-semibold text-foreground">$2,300</span>
              </div>
              <ProgressBar value={9} color="red" size="md" />
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Due</span>
                <span className="font-bold text-foreground">$25,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <SectionTitle title="Recent Activity" />
          <ActivityList activities={activities} />
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <SectionTitle title="Notice Board" subtitle="Latest announcements" />
          <div className="space-y-3">
            {notices.slice(0, 4).map((notice) => (
              <NoticeCard key={notice.id} {...notice} />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <SectionTitle title="Upcoming Events" />
          <div className="space-y-2.5">
            {events.map((event) => (
              <CalendarCard key={event.id} {...event} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}