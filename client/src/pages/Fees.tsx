import { useState } from "react";
import { Search } from "lucide-react";
import { DataTable, Column } from "@/components/tables/DataTable";
import { ProgressBar } from "@/components/common/ProgressBar";
import { StatCard } from "@/components/dashboard/StatCard";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { SectionTitle } from "@/components/common/SectionTitle";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { fees } from "@/data/dummyData";
import { CheckCircle, Clock, AlertCircle, Plus, CreditCard } from "lucide-react";

const columns: Column[] = [
  { key: "studentName", label: "Student", type: "avatar-text" },
  { key: "amount", label: "Amount" },
  { key: "dueDate", label: "Due Date" },
  { key: "paidDate", label: "Paid Date" },
  { key: "status", label: "Status", type: "badge" },
  { key: "actions", label: "Actions", type: "actions" },
];

const statusOptions = ["All", "Paid", "Pending", "Unpaid"];

export default function Fees() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const paid = fees.filter(f => f.status === "Paid").length;
  const pending = fees.filter(f => f.status === "Pending").length;
  const unpaid = fees.filter(f => f.status === "Unpaid").length;

  const filtered = fees.filter(f => {
    const matchSearch = f.studentName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || f.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <Breadcrumb items={[{ label: "Fees Management" }]} />
      <PageHeader
        title="Fees Management"
        description="Track fee collection and payment status"
        action={
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<CheckCircle className="w-5 h-5" />} title="Paid" value={`${paid} students`} change="$18,500 collected" trend="up" color="emerald" />
        <StatCard icon={<Clock className="w-5 h-5" />} title="Pending" value={`${pending} students`} change="$4,200 pending" trend="neutral" color="amber" />
        <StatCard icon={<AlertCircle className="w-5 h-5" />} title="Unpaid / Overdue" value={`${unpaid} students`} change="$2,300 overdue" trend="down" color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          {/* Search & Filter */}
          <div className="p-5 border-b border-border space-y-3">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search by student name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-4 bg-muted rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                data-testid="fees-search"
              />
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
                  data-testid={`fee-filter-${s.toLowerCase()}`}
                >
                  {s}
                  {s !== "All" && (
                    <span className="ml-1.5 opacity-70">
                      ({fees.filter(f => f.status === s).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="px-6">
            {filtered.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="w-7 h-7" />}
                title="No records found"
                description="No fee records match your current filters."
              />
            ) : (
              <DataTable
                columns={columns}
                data={filtered.map(f => ({
                  ...f,
                  name: f.studentName,
                  amount: `$${f.amount.toLocaleString()}`,
                  paidDate: f.paidDate || "—",
                })) as unknown as Record<string, unknown>[]}
              />
            )}
          </div>
          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Showing {filtered.length} of {fees.length} records
              </span>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <SectionTitle title="Collection Summary" subtitle="Monthly breakdown" />
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Paid ({Math.round((paid / fees.length) * 100)}%)</span>
                <span className="font-semibold text-emerald-600">$18,500</span>
              </div>
              <ProgressBar value={paid} max={fees.length} color="emerald" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Pending ({Math.round((pending / fees.length) * 100)}%)</span>
                <span className="font-semibold text-amber-600">$4,200</span>
              </div>
              <ProgressBar value={pending} max={fees.length} color="amber" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Unpaid ({Math.round((unpaid / fees.length) * 100)}%)</span>
                <span className="font-semibold text-red-600">$2,300</span>
              </div>
              <ProgressBar value={unpaid} max={fees.length} color="red" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
