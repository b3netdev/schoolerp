import { useEffect, useState } from "react";
import { GraduationCap, Users, BookOpen, Plus } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { NoticeCard } from "@/components/dashboard/NoticeCard";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { ProgressBar } from "@/components/common/ProgressBar";
import { SectionTitle } from "@/components/common/SectionTitle";
import { PageHeader } from "@/components/common/PageHeader";
import { activities, events, attendanceSummary } from "@/data/dummyData";
import api from "@/lib/api";
import DOMPurify from "dompurify";
import { noticeApi, type NoticeFor } from "@/lib/noticeApi";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";

type StudentListResponse = {
  total?: number;
};

type TeacherListResponse = {
  total?: number;
};

type ClassItem = {
  id: number;
};

type DashboardNotice = {
  id: number;
  title: string;
  description: string;
  date: string;
  audience: string;
};

type ApiNotice = {
  id: number;
  title: string;
  description: string;
  notice_for: NoticeFor[];
  created_at: string;
};

const formatNoticeDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const mapAudience = (noticeFor: NoticeFor[]) => {
  if (!Array.isArray(noticeFor) || noticeFor.length === 0) {
    return "All";
  }

  const normalized = [...new Set(noticeFor.map((item) => item.toLowerCase()))];

  if (
    normalized.includes("student") &&
    normalized.includes("teacher") &&
    normalized.includes("admin")
  ) {
    return "All";
  }

  return normalized
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(", ");
};

const toPlainDescription = (html: string) => {
  const sanitized = DOMPurify.sanitize(html || "");
  const plainText = sanitized.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return plainText || "No description available.";
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state).auth;

  const portal = user?.role || "admin";
  const navigateToPortalRoute = (route: string) => {
    navigate(`/${portal}/${route}`);
  };

  const [totals, setTotals] = useState({
    students: 0,
    teachers: 0,
    classes: 0,
  });
  const [dashboardNotices, setDashboardNotices] = useState<DashboardNotice[]>([]);

  const [isTotalsLoading, setIsTotalsLoading] = useState(true);
  const [isNoticesLoading, setIsNoticesLoading] = useState(true);

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        setIsTotalsLoading(true);

        const [studentsResult, teachersResult, classesResult] = await Promise.all([
          api.get("/student/get-students", {
            params: { status: "active", page: 1, limit: 10 },
            skipErrorToast: true,
          }),
          api.get("/teacher/get-teachers", {
            params: { status: "active", page: 1, limit: 10 },
            skipErrorToast: true,
          }),
          api.get("/class/get-classes", {
            params: { status: "active" },
            skipErrorToast: true,
          }),
        ]);

        const studentsData = studentsResult.data?.data as StudentListResponse | undefined;
        const teachersData = teachersResult.data?.data as TeacherListResponse | undefined;
        const classesData = classesResult.data?.data as ClassItem[] | undefined;

        setTotals({
          students: Number(studentsData?.total ?? 0),
          teachers: Number(teachersData?.total ?? 0),
          classes: Array.isArray(classesData) ? classesData.length : 0,
        });
      } catch {
        setTotals({ students: 0, teachers: 0, classes: 0 });
      } finally {
        setIsTotalsLoading(false);
      }
    };

    void fetchTotals();
  }, []);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setIsNoticesLoading(true);

        const result = await noticeApi.getAll({ status: "active" });

        if (result.data?.status !== "success" || !Array.isArray(result.data?.data)) {
          setDashboardNotices([]);
          return;
        }

        const mappedNotices = (result.data.data as ApiNotice[])
          .slice(0, 4)
          .map((notice) => ({
            id: notice.id,
            title: notice.title,
            date: formatNoticeDate(notice.created_at),
            audience: mapAudience(notice.notice_for),
            description: toPlainDescription(notice.description),
          }));

        setDashboardNotices(mappedNotices);
      } catch {
        setDashboardNotices([]);
      } finally {
        setIsNoticesLoading(false);
      }
    };

    void fetchNotices();
  }, []);

  const studentsCount = isTotalsLoading ? "..." : totals.students.toLocaleString("en-IN");
  const teachersCount = isTotalsLoading ? "..." : totals.teachers.toLocaleString("en-IN");
  const classesCount = isTotalsLoading ? "..." : totals.classes.toLocaleString("en-IN");

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Welcome back, John. Here's what's happening today."
        action={
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            Quick Add
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<GraduationCap className="w-5 h-5" />} title="Total Students" value={studentsCount} color="blue" onClick={() => navigateToPortalRoute("students")} />
        <StatCard icon={<Users className="w-5 h-5" />} title="Total Teachers" value={teachersCount} color="purple" onClick={() => navigateToPortalRoute("teachers")} />
        
        <StatCard icon={<BookOpen className="w-5 h-5" />} title="Total Classes" value={classesCount} color="amber" onClick={() => navigateToPortalRoute("classes")} />
      </div>

      {/* Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Attendance Summary */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <SectionTitle title="Attendance Summary" subtitle="Today's overview by class" />
          <div className="space-y-4">
            {attendanceSummary.map(row => (
              <div key={row.class}>
                <div className="flex items-center justify-between mb-1.5 text-sm">
                  <span className="font-medium text-foreground">{row.class}</span>
                  <span className="text-muted-foreground text-xs">
                    {row.present} present · {row.absent} absent · {row.late} late
                  </span>
                </div>
                <ProgressBar
                  value={row.present}
                  max={row.total}
                  showPercent
                  color={row.percentage >= 90 ? "emerald" : row.percentage >= 80 ? "blue" : "amber"}
                  size="sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Fees Summary */}
        <div className="bg-card border border-border rounded-xl p-6">
          <SectionTitle title="Fee Collection" subtitle="November 2024" />
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Collected</span>
                <span className="font-semibold text-foreground">$18,500</span>
              </div>
              <ProgressBar value={74} color="emerald" size="md" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-semibold text-foreground">$4,200</span>
              </div>
              <ProgressBar value={17} color="amber" size="md" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Overdue</span>
                <span className="font-semibold text-foreground">$2,300</span>
              </div>
              <ProgressBar value={9} color="red" size="md" />
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Due</span>
                <span className="font-bold text-foreground">$25,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity */}
        <div className="bg-card border border-border rounded-xl p-6">
          <SectionTitle title="Recent Activity" />
          <ActivityList activities={activities} />
        </div>

        {/* Notice Board */}
        <div className="bg-card border border-border rounded-xl p-6">
          <SectionTitle title="Notice Board" subtitle="Latest announcements" />
          <div className="space-y-3">
            {isNoticesLoading ? (
              <p className="text-sm text-muted-foreground">Loading notices...</p>
            ) : dashboardNotices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notices available.</p>
            ) : (
              dashboardNotices.map((notice) => (
                <NoticeCard key={notice.id} {...notice} />
              ))
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-card border border-border rounded-xl p-6">
          <SectionTitle title="Upcoming Events" />
          <div className="space-y-2.5">
            {events.map(event => (
              <CalendarCard key={event.id} {...event} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
