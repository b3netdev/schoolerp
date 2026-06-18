import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { NoticeCard } from "@/components/dashboard/NoticeCard";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { notices } from "@/data/dummyData";
import { EmptyState } from "@/components/common/EmptyState";
import { Bell } from "lucide-react";

const audiences = ["All", "Students", "Teachers", "Parents"];

export default function NoticeBoard() {
  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState("All");

  const filtered = notices.filter(n => {
    const matchAudience = audience === "All" || n.audience === audience;
    const matchSearch = n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.description.toLowerCase().includes(search.toLowerCase());
    return matchAudience && matchSearch;
  });

  return (
    <div>
      <Breadcrumb items={[{ label: "Notice Board" }]} />
      <PageHeader
        title="Notice Board"
        description="School-wide announcements and notices"
        action={
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Post Notice
          </button>
        }
      />

      <div className="bg-card border border-border rounded-xl">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search notices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              data-testid="notices-search"
            />
          </div>
          <div className="flex gap-1">
            {audiences.map(a => (
              <button
                key={a}
                onClick={() => setAudience(a)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  audience === a
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`filter-${a.toLowerCase()}`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-7 h-7" />}
              title="No notices found"
              description="No notices match your current filters."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(notice => (
                <NoticeCard key={notice.id} {...notice} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
