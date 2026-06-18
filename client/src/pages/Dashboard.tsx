import { GraduationCap, Users, UsersRound, BookOpen, TrendingUp, Plus } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { NoticeCard } from "@/components/dashboard/NoticeCard";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { ProgressBar } from "@/components/common/ProgressBar";
import { SectionTitle } from "@/components/common/SectionTitle";
import { PageHeader } from "@/components/common/PageHeader";
import { activities, notices, events, attendanceSummary } from "@/data/dummyData";

export default function Dashboard() {
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
        <StatCard icon={<GraduationCap className="w-5 h-5" />} title="Total Students" value="1,240" change="+48 this month" trend="up" color="blue" />
        <StatCard icon={<Users className="w-5 h-5" />} title="Total Teachers" value="86" change="+3 this month" trend="up" color="purple" />
        <StatCard icon={<UsersRound className="w-5 h-5" />} title="Total Parents" value="1,034" change="+12 this month" trend="up" color="emerald" />
        <StatCard icon={<BookOpen className="w-5 h-5" />} title="Total Classes" value="42" change="Same as last term" trend="neutral" color="amber" />
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
            {notices.slice(0, 4).map(notice => (
              <NoticeCard key={notice.id} {...notice} />
            ))}
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
