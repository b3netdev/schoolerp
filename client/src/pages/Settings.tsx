import { Tabs } from "@/components/common/Tabs";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar } from "@/components/common/Avatar";
import { Badge, statusToBadgeVariant } from "@/components/common/Badge";
import { users } from "@/data/dummyData";
import { Building2, User, Shield } from "lucide-react";

const tabs = [
  { id: "school", label: "School Profile", icon: <Building2 className="w-4 h-4" /> },
  { id: "admin", label: "Admin Profile", icon: <User className="w-4 h-4" /> },
  { id: "users", label: "Users & Roles", icon: <Shield className="w-4 h-4" /> },
];

function FormField({ label, value, type = "text" }: { label: string; value: string; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={value}
        className="w-full h-9 px-3 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        readOnly
      />
    </div>
  );
}

export default function Settings() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Settings" }]} />
      <PageHeader title="Settings" description="Manage school and account configuration" />

      <div className="bg-card border border-border rounded-xl p-6">
        <Tabs tabs={tabs} defaultTab="school">
          {(active) => {
            if (active === "school") {
              return (
                <div className="max-w-2xl space-y-5">
                  <h3 className="text-sm font-semibold text-foreground">School Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="School Name" value="Riverside Academy" />
                    <FormField label="School Code" value="RSA-2024" />
                    <FormField label="Principal" value="Dr. James Morton" />
                    <FormField label="Established Year" value="1998" />
                    <FormField label="Phone" value="+1 555-0100" />
                    <FormField label="Email" value="admin@riverside.edu" type="email" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Address</label>
                    <textarea
                      defaultValue="123 Education Blvd, Springfield, IL 62701"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      rows={2}
                      readOnly
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                      Save Changes
                    </button>
                    <button className="px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-muted/80 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            if (active === "admin") {
              return (
                <div className="max-w-2xl">
                  <div className="flex items-center gap-5 mb-6 pb-6 border-b border-border">
                    <Avatar initials="JA" name="John Admin" size="lg" />
                    <div>
                      <h3 className="text-base font-semibold text-foreground">John Admin</h3>
                      <p className="text-sm text-muted-foreground">Super Administrator</p>
                      <button className="mt-2 text-xs text-primary hover:underline">Change Photo</button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="First Name" value="John" />
                      <FormField label="Last Name" value="Admin" />
                      <FormField label="Email" value="john@school.edu" type="email" />
                      <FormField label="Phone" value="555-0001" />
                    </div>
                    <FormField label="Role" value="Super Administrator" />
                    <div className="flex gap-2 pt-2">
                      <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                        Update Profile
                      </button>
                      <button className="px-4 py-2 border border-border text-foreground text-sm font-medium rounded-lg hover:bg-muted transition-colors">
                        Change Password
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            if (active === "users") {
              return (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">System Users</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{users.length} users configured</p>
                    </div>
                    <button className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity">
                      Add User
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                          <th className="py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                          <th className="py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
                          <th className="py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {users.map(u => (
                          <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <Avatar name={u.name} size="sm" />
                                <span className="text-sm font-medium text-foreground">{u.name}</span>
                              </div>
                            </td>
                            <td className="py-3 text-sm text-muted-foreground">{u.email}</td>
                            <td className="py-3 text-sm text-foreground">{u.role}</td>
                            <td className="py-3">
                              <Badge variant={statusToBadgeVariant(u.status)}>{u.status}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }

            return null;
          }}
        </Tabs>
      </div>
    </div>
  );
}
