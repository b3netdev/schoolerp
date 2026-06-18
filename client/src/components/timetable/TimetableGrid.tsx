interface Slot {
  time: string;
  subject: string;
  teacher: string;
}

interface TimetableGridProps {
  timetable: Record<string, Slot[]>;
}

const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const dayLabels: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
};

const subjectColors = [
  "bg-blue-50 border-blue-200 text-blue-800",
  "bg-purple-50 border-purple-200 text-purple-800",
  "bg-emerald-50 border-emerald-200 text-emerald-800",
  "bg-amber-50 border-amber-200 text-amber-800",
  "bg-rose-50 border-rose-200 text-rose-800",
  "bg-cyan-50 border-cyan-200 text-cyan-800",
];

function getSubjectColor(subject: string): string {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  return subjectColors[Math.abs(hash) % subjectColors.length];
}

export function TimetableGrid({ timetable }: TimetableGridProps) {
  const timeSlots = timetable[days[0]]?.map(s => s.time) || [];

  return (
    <div className="overflow-x-auto -mx-6">
      <table className="w-full min-w-[700px] border-collapse" data-testid="timetable-grid">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-28 border-b border-border">
              Time
            </th>
            {days.map(day => (
              <th key={day} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border">
                {dayLabels[day]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {timeSlots.map((time, ti) => (
            <tr key={ti} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                {time}
              </td>
              {days.map(day => {
                const slot = timetable[day]?.[ti];
                if (!slot) return <td key={day} className="px-3 py-3" />;
                const colorClass = getSubjectColor(slot.subject);
                return (
                  <td key={day} className="px-3 py-3">
                    <div className={`rounded-lg border px-2.5 py-2 ${colorClass}`}>
                      <p className="text-xs font-semibold leading-tight">{slot.subject}</p>
                      <p className="text-xs opacity-75 mt-0.5 leading-tight">{slot.teacher}</p>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
