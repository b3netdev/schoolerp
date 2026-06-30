import { Tabs } from "@/components/common/Tabs";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { PageHeader } from "@/components/common/PageHeader";
import { Avatar } from "@/components/common/Avatar";
import { Badge, statusToBadgeVariant } from "@/components/common/Badge";
import { users } from "@/data/dummyData";
import { Settings as SettingsIcon, User, Shield } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const tabs = [
  { id: "general", label: "General", icon: <SettingsIcon className="w-4 h-4" /> },
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
      />
    </div>
  );
}



const fallbackTimeZones: any = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dhaka",
  "Asia/Kathmandu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
];
export type TimeZoneOption = {
  key: string;
  label: string;
  value: string;
};

const getTimeZoneOffset = (timeZone: string) => {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    });

    const parts = formatter.formatToParts(new Date());

    const offset = parts.find((part) => part.type === "timeZoneName")?.value;

    return offset?.replace("GMT", "UTC") || "UTC";
  } catch {
    return "UTC";
  }
};







export const timeZoneOptions: TimeZoneOption[] =
  typeof Intl !== "undefined" &&
    typeof (Intl as any).supportedValuesOf === "function"
    ? (Intl as any).supportedValuesOf("timeZone").map((zone: string) => ({
      key: zone,
      value: zone,
      label: `${getTimeZoneOffset(zone)} - ${zone.replace("_", " ")}`,
    }))
    : fallbackTimeZones.map((zone: string) => ({
      key: zone,
      value: zone,
      label: `${getTimeZoneOffset(zone)} - ${zone.replace("_", " ")}`,
    }));

interface TimeZoneDropdownFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TimeZoneDropdownField = ({
  label = "Time Zone",
  value,
  onChange,
  placeholder = "Select time zone",
  disabled = false,
}: TimeZoneDropdownFieldProps) => {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>

      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full rounded-lg border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/30">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent className="max-h-72">
          {timeZoneOptions.map((zone) => (
            <SelectItem key={zone.key} value={zone.value}>
              {zone.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};


export default function Settings() {
  const [formData, setFormData] = useState({
    system_name: "",
    system_email: "",
    school_name: "",
    system_phone: "",
    school_address: "",
    timezone: "",
  });
  return (
    <div>
      <Breadcrumb items={[{ label: "Settings" }]} />
      <PageHeader title="Settings" description="Manage school and account configuration" />

      <div className="bg-card border border-border rounded-xl p-6">
        <Tabs tabs={tabs} defaultTab="general">
          {(active) => {
            if (active === "general") {
              return (
                <div className="max-w-2xl space-y-5">
                  <h3 className="text-sm font-semibold text-foreground">School Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="System Name" value={formData.system_name} />
                    <FormField label="System email" value={formData.system_email} />
                    <FormField label="System Phone" value={formData.system_phone} />
                    <FormField label="School Name" value={formData.school_name} />
                    <TimeZoneDropdownField
                      value={formData.timezone}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          timezone: value,
                        }))
                      }
                    />

                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">School Address</label>
                    <textarea
                      defaultValue={formData.school_address}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      rows={2}

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

            // if (active === "users") {
            //   return (
            //     <div>
            //       <div className="flex items-center justify-between mb-5">
            //         <div>
            //           <h3 className="text-sm font-semibold text-foreground">System Users</h3>
            //           <p className="text-xs text-muted-foreground mt-0.5">{users.length} users configured</p>
            //         </div>
            //         <button className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:opacity-90 transition-opacity">
            //           Add User
            //         </button>
            //       </div>
            //       <div className="overflow-x-auto">
            //         <table className="w-full">
            //           <thead>
            //             <tr className="border-b border-border">
            //               <th className="py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
            //               <th className="py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
            //               <th className="py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role</th>
            //               <th className="py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
            //             </tr>
            //           </thead>
            //           <tbody className="divide-y divide-border">
            //             {users.map(u => (
            //               <tr key={u.id} className="hover:bg-muted/40 transition-colors">
            //                 <td className="py-3">
            //                   <div className="flex items-center gap-3">
            //                     <Avatar name={u.name} size="sm" />
            //                     <span className="text-sm font-medium text-foreground">{u.name}</span>
            //                   </div>
            //                 </td>
            //                 <td className="py-3 text-sm text-muted-foreground">{u.email}</td>
            //                 <td className="py-3 text-sm text-foreground">{u.role}</td>
            //                 <td className="py-3">
            //                   <Badge variant={statusToBadgeVariant(u.status)}>{u.status}</Badge>
            //                 </td>
            //               </tr>
            //             ))}
            //           </tbody>
            //         </table>
            //       </div>
            //     </div>
            //   );
            // }

            return null;
          }}
        </Tabs>
      </div>
    </div>
  );
}
